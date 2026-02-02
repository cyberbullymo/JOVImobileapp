/**
 * Firebase Cloud Functions for Gig Quality Scoring
 * GIG-010: AI Quality Scoring
 *
 * Automatically scores gigs on creation and provides
 * batch scoring for admin operations.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { scoreGigWithClaude } from "./lib/claudeScoring";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Default score for user-generated gigs (already vetted through posting flow)
const USER_GENERATED_DEFAULT_SCORE = 8;

// Threshold for flagging gigs for manual review
const LOW_SCORE_THRESHOLD = 5;

/**
 * Automatically score new gigs when created in Firestore
 *
 * Triggers on: gigs/{gigId} document creation
 * Skips user-generated gigs (defaults to score 8)
 * Flags low-scoring gigs (<5) for manual review
 */
export const scoreNewGig = functions.firestore
  .document("gigs/{gigId}")
  .onCreate(async (snap, context) => {
    const gigId = context.params.gigId;
    const gig = snap.data();

    console.log(`Scoring new gig: ${gigId}`);

    // Skip scoring for user-generated gigs (already manually vetted)
    if (gig.source === "user-generated") {
      console.log(`User-generated gig ${gigId} - using default score`);

      await snap.ref.update({
        qualityScore: USER_GENERATED_DEFAULT_SCORE,
        scoringReasoning: "User-generated gig - default high score",
        scoredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { gigId, score: USER_GENERATED_DEFAULT_SCORE, skipped: true };
    }

    try {
      // Score the gig using Claude API
      const scoring = await scoreGigWithClaude({
        title: gig.title,
        description: gig.description,
        location: gig.location,
        payRange: gig.payRange,
        gigType: gig.gigType,
        profession: gig.profession,
        source: gig.source,
        requirements: gig.requirements,
        benefits: gig.benefits,
      });

      console.log(`Gig ${gigId} scored: ${scoring.score}/10`);

      // Update the gig document with scoring results
      await snap.ref.update({
        qualityScore: scoring.score,
        scoringBreakdown: scoring.breakdown,
        scoringReasoning: scoring.reasoning,
        scoredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Flag for manual review if score is low
      if (scoring.score < LOW_SCORE_THRESHOLD) {
        console.log(`Gig ${gigId} flagged for review (score: ${scoring.score})`);

        await db.collection("gigReviewQueue").add({
          gigId: gigId,
          gigTitle: gig.title || "Untitled",
          score: scoring.score,
          scoringBreakdown: scoring.breakdown,
          reason: "Low quality score",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          reviewed: false,
        });
      }

      return { gigId, score: scoring.score, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error scoring gig ${gigId}:`, error);

      // Set default score on error
      await snap.ref.update({
        qualityScore: 5,
        scoringError: errorMessage,
        scoredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { gigId, score: 5, success: false, error: errorMessage };
    }
  });

/**
 * Re-score a gig when it's updated with significant changes
 *
 * Triggers on: gigs/{gigId} document update
 * Only re-scores if title or description changed
 */
export const rescoreUpdatedGig = functions.firestore
  .document("gigs/{gigId}")
  .onUpdate(async (change, context) => {
    const gigId = context.params.gigId;
    const before = change.before.data();
    const after = change.after.data();

    // Skip if this update was from scoring itself
    if (after.scoredAt && !before.scoredAt) {
      return { gigId, skipped: true, reason: "Initial scoring update" };
    }

    // Skip user-generated gigs
    if (after.source === "user-generated") {
      return { gigId, skipped: true, reason: "User-generated gig" };
    }

    // Only re-score if title or description changed significantly
    const titleChanged = before.title !== after.title;
    const descriptionChanged = before.description !== after.description;

    if (!titleChanged && !descriptionChanged) {
      return { gigId, skipped: true, reason: "No significant changes" };
    }

    console.log(`Re-scoring updated gig: ${gigId}`);

    try {
      const scoring = await scoreGigWithClaude({
        title: after.title,
        description: after.description,
        location: after.location,
        payRange: after.payRange,
        gigType: after.gigType,
        profession: after.profession,
        source: after.source,
        requirements: after.requirements,
        benefits: after.benefits,
      });

      console.log(`Gig ${gigId} re-scored: ${scoring.score}/10`);

      await change.after.ref.update({
        qualityScore: scoring.score,
        scoringBreakdown: scoring.breakdown,
        scoringReasoning: scoring.reasoning,
        scoredAt: admin.firestore.FieldValue.serverTimestamp(),
        scoringError: admin.firestore.FieldValue.delete(),
      });

      return { gigId, score: scoring.score, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error re-scoring gig ${gigId}:`, error);

      await change.after.ref.update({
        scoringError: errorMessage,
        scoredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { gigId, success: false, error: errorMessage };
    }
  });

/**
 * Batch score multiple gigs (admin callable function)
 *
 * Called from admin panel to score/re-score selected gigs
 * Requires admin authentication
 */
export const batchScoreGigs = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to score gigs"
    );
  }

  // Check for admin claim
  const isAdmin = context.auth.token.admin === true;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required"
    );
  }

  const gigIds: string[] = data.gigIds;

  if (!Array.isArray(gigIds) || gigIds.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "gigIds must be a non-empty array"
    );
  }

  // Limit batch size to prevent timeouts
  if (gigIds.length > 20) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Maximum 20 gigs per batch"
    );
  }

  console.log(`Batch scoring ${gigIds.length} gigs`);

  const results: Array<{
    gigId: string;
    score?: number;
    success: boolean;
    error?: string;
  }> = [];

  for (const gigId of gigIds) {
    try {
      const gigSnap = await db.collection("gigs").doc(gigId).get();

      if (!gigSnap.exists) {
        results.push({ gigId, success: false, error: "Gig not found" });
        continue;
      }

      const gig = gigSnap.data();
      if (!gig) {
        results.push({ gigId, success: false, error: "Empty gig data" });
        continue;
      }

      const scoring = await scoreGigWithClaude({
        title: gig.title,
        description: gig.description,
        location: gig.location,
        payRange: gig.payRange,
        gigType: gig.gigType,
        profession: gig.profession,
        source: gig.source,
        requirements: gig.requirements,
        benefits: gig.benefits,
      });

      await gigSnap.ref.update({
        qualityScore: scoring.score,
        scoringBreakdown: scoring.breakdown,
        scoringReasoning: scoring.reasoning,
        scoredAt: admin.firestore.FieldValue.serverTimestamp(),
        scoringError: admin.firestore.FieldValue.delete(),
      });

      results.push({ gigId, score: scoring.score, success: true });
      console.log(`Batch: Scored gig ${gigId}: ${scoring.score}/10`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      results.push({ gigId, success: false, error: errorMessage });
      console.error(`Batch: Error scoring gig ${gigId}:`, error);
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`Batch complete: ${successCount}/${gigIds.length} scored successfully`);

  return {
    results,
    summary: {
      total: gigIds.length,
      success: successCount,
      failed: gigIds.length - successCount,
    },
  };
});

/**
 * Score a single gig (admin callable function)
 *
 * Useful for re-scoring individual gigs from admin panel
 */
export const scoreGig = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated to score gigs"
    );
  }

  // Check for admin claim
  const isAdmin = context.auth.token.admin === true;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required"
    );
  }

  const gigId: string = data.gigId;

  if (!gigId || typeof gigId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "gigId is required"
    );
  }

  console.log(`Admin scoring gig: ${gigId}`);

  const gigSnap = await db.collection("gigs").doc(gigId).get();

  if (!gigSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Gig not found"
    );
  }

  const gig = gigSnap.data();
  if (!gig) {
    throw new functions.https.HttpsError(
      "not-found",
      "Empty gig data"
    );
  }

  try {
    const scoring = await scoreGigWithClaude({
      title: gig.title,
      description: gig.description,
      location: gig.location,
      payRange: gig.payRange,
      gigType: gig.gigType,
      profession: gig.profession,
      source: gig.source,
      requirements: gig.requirements,
      benefits: gig.benefits,
    });

    await gigSnap.ref.update({
      qualityScore: scoring.score,
      scoringBreakdown: scoring.breakdown,
      scoringReasoning: scoring.reasoning,
      scoredAt: admin.firestore.FieldValue.serverTimestamp(),
      scoringError: admin.firestore.FieldValue.delete(),
    });

    console.log(`Admin: Scored gig ${gigId}: ${scoring.score}/10`);

    return {
      gigId,
      score: scoring.score,
      reasoning: scoring.reasoning,
      breakdown: scoring.breakdown,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Admin: Error scoring gig ${gigId}:`, error);

    throw new functions.https.HttpsError(
      "internal",
      `Failed to score gig: ${errorMessage}`
    );
  }
});

/**
 * Get review queue (admin callable function)
 *
 * Returns gigs that need manual review
 */
export const getReviewQueue = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated"
    );
  }

  // Check for admin claim
  const isAdmin = context.auth.token.admin === true;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required"
    );
  }

  const limit = data.limit || 20;
  const includeReviewed = data.includeReviewed || false;

  let query = db.collection("gigReviewQueue")
    .orderBy("createdAt", "desc")
    .limit(limit);

  if (!includeReviewed) {
    query = query.where("reviewed", "==", false);
  }

  const snapshot = await query.get();

  const reviews = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { reviews, count: reviews.length };
});

/**
 * Mark a review as complete (admin callable function)
 */
export const completeReview = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated"
    );
  }

  // Check for admin claim
  const isAdmin = context.auth.token.admin === true;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required"
    );
  }

  const { reviewId, action } = data;

  if (!reviewId || typeof reviewId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "reviewId is required"
    );
  }

  if (!action || !["approved", "edited", "deactivated"].includes(action)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "action must be 'approved', 'edited', or 'deactivated'"
    );
  }

  const reviewRef = db.collection("gigReviewQueue").doc(reviewId);
  const reviewSnap = await reviewRef.get();

  if (!reviewSnap.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Review not found"
    );
  }

  await reviewRef.update({
    reviewed: true,
    reviewedBy: context.auth.uid,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    action: action,
  });

  // If action is 'deactivated', also deactivate the gig
  if (action === "deactivated") {
    const reviewData = reviewSnap.data();
    if (reviewData?.gigId) {
      await db.collection("gigs").doc(reviewData.gigId).update({
        isActive: false,
      });
    }
  }

  return { success: true, reviewId, action };
});
