/**
 * Firebase Cloud Functions for JOVIAPP_react
 *
 * Export all Cloud Functions from this file.
 * Functions are automatically deployed based on exports.
 */

// GIG-010: AI Quality Scoring Functions
export {
  scoreNewGig,
  rescoreUpdatedGig,
  batchScoreGigs,
  scoreGig,
  getReviewQueue,
  completeReview,
} from "./gigScoring";
