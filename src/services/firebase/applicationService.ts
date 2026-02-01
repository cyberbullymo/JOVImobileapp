/**
 * Application Service (GIG-008)
 * Handles tracking of external application attempts and user applications
 */

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  increment,
  orderBy,
} from 'firebase/firestore';
import { firestore, COLLECTIONS } from './config';
import type {
  ApplicationAttempt,
  UserApplication,
  CreateApplicationAttemptInput,
  MarkAsAppliedInput,
  CreateInternalApplicationInput,
  Application,
  GigOrigin,
} from '../../types';

// ============================================================================
// APPLICATION TRACKING
// ============================================================================

/**
 * Track when a user opens an external application link
 */
export async function trackApplicationAttempt(
  input: CreateApplicationAttemptInput
): Promise<string> {
  const attemptData = {
    gigId: input.gigId,
    userId: input.userId,
    source: input.source,
    sourceUrl: input.sourceUrl,
    timestamp: serverTimestamp(),
    status: 'opened' as const,
  };

  const docRef = await addDoc(
    collection(firestore, COLLECTIONS.APPLICATION_ATTEMPTS),
    attemptData
  );

  // Increment application count on the gig
  const gigRef = doc(firestore, COLLECTIONS.GIGS, input.gigId);
  await updateDoc(gigRef, {
    applicationCount: increment(1),
  });

  return docRef.id;
}

/**
 * Mark a gig as applied by the user
 */
export async function markAsApplied(input: MarkAsAppliedInput): Promise<string> {
  const applicationData = {
    gigId: input.gigId,
    gigTitle: input.gigTitle,
    userId: input.userId,
    appliedAt: serverTimestamp(),
    status: 'applied' as const,
    source: input.source,
    sourceUrl: input.sourceUrl || null,
  };

  const docRef = await addDoc(
    collection(firestore, COLLECTIONS.USER_APPLICATIONS),
    applicationData
  );

  return docRef.id;
}

/**
 * Check if user has already applied to a gig
 */
export async function hasUserApplied(
  userId: string,
  gigId: string
): Promise<boolean> {
  const q = query(
    collection(firestore, COLLECTIONS.USER_APPLICATIONS),
    where('userId', '==', userId),
    where('gigId', '==', gigId)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Get all applied gig IDs for a user (for showing applied badges)
 */
export async function getUserAppliedGigIds(userId: string): Promise<Set<string>> {
  const q = query(
    collection(firestore, COLLECTIONS.USER_APPLICATIONS),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const gigIds = new Set<string>();

  snapshot.forEach((doc) => {
    const data = doc.data();
    gigIds.add(data.gigId);
  });

  return gigIds;
}

/**
 * Get user's applications (for "My Applications" section)
 */
export async function getUserApplications(
  userId: string
): Promise<UserApplication[]> {
  const q = query(
    collection(firestore, COLLECTIONS.USER_APPLICATIONS),
    where('userId', '==', userId),
    orderBy('appliedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const applications: UserApplication[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    applications.push({
      id: docSnapshot.id,
      gigId: data.gigId,
      gigTitle: data.gigTitle,
      userId: data.userId,
      appliedAt: data.appliedAt?.toDate() || new Date(),
      status: data.status,
      source: data.source as GigOrigin,
      sourceUrl: data.sourceUrl,
      notes: data.notes,
    });
  });

  return applications;
}

/**
 * Update application status (e.g., user got interview, offer, etc.)
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: UserApplication['status'],
  notes?: string
): Promise<void> {
  const docRef = doc(firestore, COLLECTIONS.USER_APPLICATIONS, applicationId);
  await updateDoc(docRef, {
    status,
    ...(notes && { notes }),
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Get application attempt count for a gig
 */
export async function getGigApplicationAttemptCount(
  gigId: string
): Promise<number> {
  const q = query(
    collection(firestore, COLLECTIONS.APPLICATION_ATTEMPTS),
    where('gigId', '==', gigId)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
}

/**
 * Get conversion rate (% of opens that resulted in "marked applied")
 */
export async function getGigConversionRate(gigId: string): Promise<number> {
  const attemptsQuery = query(
    collection(firestore, COLLECTIONS.APPLICATION_ATTEMPTS),
    where('gigId', '==', gigId)
  );

  const appliedQuery = query(
    collection(firestore, COLLECTIONS.USER_APPLICATIONS),
    where('gigId', '==', gigId)
  );

  const [attemptsSnapshot, appliedSnapshot] = await Promise.all([
    getDocs(attemptsQuery),
    getDocs(appliedQuery),
  ]);

  if (attemptsSnapshot.size === 0) return 0;
  return (appliedSnapshot.size / attemptsSnapshot.size) * 100;
}

// ============================================================================
// INTERNAL JOVI APPLICATIONS
// ============================================================================

/**
 * Submit an internal application through Jovi
 */
export async function submitInternalApplication(
  input: CreateInternalApplicationInput
): Promise<string> {
  // Check if user has already applied
  const alreadyApplied = await hasUserApplied(input.applicantId, input.gigId);
  if (alreadyApplied) {
    throw new Error('You have already applied to this gig');
  }

  // Create the application in the APPLICATIONS collection
  const applicationData = {
    gigId: input.gigId,
    applicantId: input.applicantId,
    coverLetter: input.coverLetter,
    portfolioLinks: input.portfolioLinks || [],
    status: 'Pending' as const,
    appliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(firestore, COLLECTIONS.APPLICATIONS),
    applicationData
  );

  // Also track in USER_APPLICATIONS for the user's "My Applications" view
  await addDoc(collection(firestore, COLLECTIONS.USER_APPLICATIONS), {
    gigId: input.gigId,
    gigTitle: input.gigTitle,
    userId: input.applicantId,
    appliedAt: serverTimestamp(),
    status: 'applied' as const,
    source: 'user-generated' as const,
    applicationId: docRef.id,
  });

  // Increment application count on the gig
  const gigRef = doc(firestore, COLLECTIONS.GIGS, input.gigId);
  await updateDoc(gigRef, {
    applicationCount: increment(1),
  });

  return docRef.id;
}

/**
 * Get applications for a specific gig (for gig owners)
 */
export async function getGigApplications(gigId: string): Promise<Application[]> {
  const q = query(
    collection(firestore, COLLECTIONS.APPLICATIONS),
    where('gigId', '==', gigId),
    orderBy('appliedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const applications: Application[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    applications.push({
      id: docSnapshot.id,
      gigId: data.gigId,
      gig: data.gig,
      applicantId: data.applicantId,
      applicantProfile: data.applicantProfile,
      coverLetter: data.coverLetter,
      portfolioLinks: data.portfolioLinks || [],
      status: data.status,
      appliedAt: data.appliedAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      reviewedAt: data.reviewedAt?.toDate(),
      reviewNotes: data.reviewNotes,
    });
  });

  return applications;
}

/**
 * Update an application's review status (for gig owners)
 */
export async function reviewApplication(
  applicationId: string,
  status: 'Reviewed' | 'Accepted' | 'Rejected',
  notes?: string
): Promise<void> {
  const docRef = doc(firestore, COLLECTIONS.APPLICATIONS, applicationId);
  await updateDoc(docRef, {
    status,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(notes && { reviewNotes: notes }),
  });
}
