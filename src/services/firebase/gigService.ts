/**
 * Gig Service
 * Handles CRUD operations and validation for gigs collection
 * Supports both user-generated and aggregated gigs
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  increment,
  DocumentReference,
  QueryConstraint,
} from 'firebase/firestore';
import { firestore, COLLECTIONS } from './config';
import {
  Gig,
  GigOrigin,
  GigType,
  GigProfession,
  GigLocation,
  PayRange,
  CreateUserGigInput,
  CreateAggregatedGigInput,
  GIG_DEFAULTS,
  calculateExpiresAt,
} from '../../types';

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate user-generated gig input
 */
export const validateUserGigInput = (input: CreateUserGigInput): ValidationResult => {
  const errors: string[] = [];

  // Required fields
  if (!input.title?.trim()) {
    errors.push('Title is required');
  } else if (input.title.length < 10) {
    errors.push('Title must be at least 10 characters');
  } else if (input.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  if (!input.description?.trim()) {
    errors.push('Description is required');
  } else if (input.description.length < 50) {
    errors.push('Description must be at least 50 characters');
  } else if (input.description.length > 5000) {
    errors.push('Description must be less than 5000 characters');
  }

  if (!input.postedBy?.trim()) {
    errors.push('postedBy (userId) is required for user-generated gigs');
  }

  // Location validation
  if (!input.location) {
    errors.push('Location is required');
  } else {
    if (!input.location.city?.trim()) {
      errors.push('City is required');
    }
    if (!input.location.state?.trim()) {
      errors.push('State is required');
    }
  }

  // Gig type validation
  const validGigTypes: GigType[] = [
    'booth-rental',
    'freelance',
    'full-time',
    'part-time',
    'internship',
    'apprenticeship',
    'commission',
  ];
  if (!input.gigType || !validGigTypes.includes(input.gigType)) {
    errors.push(`Invalid gig type. Must be one of: ${validGigTypes.join(', ')}`);
  }

  // Profession validation
  const validProfessions: GigProfession[] = [
    'hairstylist',
    'nail-tech',
    'esthetician',
    'makeup-artist',
    'barber',
    'lash-tech',
  ];
  if (!input.profession || input.profession.length === 0) {
    errors.push('At least one profession is required');
  } else {
    const invalidProfessions = input.profession.filter(p => !validProfessions.includes(p));
    if (invalidProfessions.length > 0) {
      errors.push(`Invalid professions: ${invalidProfessions.join(', ')}`);
    }
  }

  // Pay range validation
  if (!input.payRange) {
    errors.push('Pay range is required');
  } else {
    if (typeof input.payRange.min !== 'number' || input.payRange.min < 0) {
      errors.push('Pay range min must be a non-negative number');
    }
    if (typeof input.payRange.max !== 'number' || input.payRange.max < 0) {
      errors.push('Pay range max must be a non-negative number');
    }
    if (input.payRange.min > input.payRange.max) {
      errors.push('Pay range min cannot be greater than max');
    }
    const validPayTypes = ['hourly', 'per-service', 'salary', 'commission', 'booth-rental'];
    if (!input.payRange.type || !validPayTypes.includes(input.payRange.type)) {
      errors.push(`Invalid pay type. Must be one of: ${validPayTypes.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate aggregated gig input
 */
export const validateAggregatedGigInput = (input: CreateAggregatedGigInput): ValidationResult => {
  const errors: string[] = [];

  // Basic validation (same as user gig but without postedBy)
  if (!input.title?.trim()) {
    errors.push('Title is required');
  }

  if (!input.description?.trim()) {
    errors.push('Description is required');
  }

  // Aggregation-specific required fields
  const validSources: GigOrigin[] = ['craigslist', 'indeed', 'school-board', 'facebook'];
  if (!input.source || !validSources.includes(input.source)) {
    errors.push(`Invalid source. Must be one of: ${validSources.join(', ')}`);
  }

  if (!input.sourceUrl?.trim()) {
    errors.push('sourceUrl is required for aggregated gigs');
  } else {
    try {
      new URL(input.sourceUrl);
    } catch {
      errors.push('sourceUrl must be a valid URL');
    }
  }

  if (!input.externalId?.trim()) {
    errors.push('externalId is required for aggregated gigs');
  }

  // Quality score validation (if provided)
  if (input.qualityScore !== undefined) {
    if (typeof input.qualityScore !== 'number' || input.qualityScore < 1 || input.qualityScore > 10) {
      errors.push('qualityScore must be a number between 1 and 10');
    }
  }

  // Location validation
  if (!input.location) {
    errors.push('Location is required');
  } else {
    if (!input.location.city?.trim()) {
      errors.push('City is required');
    }
    if (!input.location.state?.trim()) {
      errors.push('State is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new user-generated gig
 */
export const createUserGig = async (input: CreateUserGigInput): Promise<string> => {
  const validation = validateUserGigInput(input);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  const now = new Date();
  const gigData: Partial<Gig> = {
    // Basic info
    title: input.title.trim(),
    description: input.description.trim(),
    location: {
      city: input.location.city.trim(),
      state: input.location.state.trim(),
      lat: input.location.lat,
      lng: input.location.lng,
    },

    // Poster info
    postedBy: input.postedBy,
    founderId: input.postedBy, // Backward compat

    // Timestamps
    createdAt: now,
    lastUpdatedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiresAt(now),

    // Classification
    gigType: input.gigType,
    type: input.gigType, // Backward compat
    profession: input.profession,
    specialties: input.profession as unknown as string[], // Backward compat

    // Compensation
    payRange: input.payRange,

    // Requirements
    requirements: input.requirements || [],
    benefits: input.benefits || [],
    startDate: input.startDate,

    // Status
    status: 'Open',
    isActive: GIG_DEFAULTS.isActive,

    // Source (user-generated)
    source: 'user-generated',
    sourceUrl: null,
    externalId: null,

    // Metrics
    qualityScore: GIG_DEFAULTS.qualityScore,
    viewCount: GIG_DEFAULTS.viewCount,
    applicationCount: GIG_DEFAULTS.applicationCount,
    applicantCount: GIG_DEFAULTS.applicationCount, // Backward compat
  };

  const gigsRef = collection(firestore, COLLECTIONS.GIGS);
  const docRef = await addDoc(gigsRef, {
    ...gigData,
    createdAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(gigData.expiresAt as Date),
  });

  // Update with gigId
  await updateDoc(docRef, {
    gigId: docRef.id,
    id: docRef.id, // Backward compat
  });

  return docRef.id;
};

/**
 * Create a new aggregated gig
 * Note: This should typically be called by Cloud Functions with admin privileges
 */
export const createAggregatedGig = async (input: CreateAggregatedGigInput): Promise<string> => {
  const validation = validateAggregatedGigInput(input);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Check for duplicates using source + externalId
  const existingGig = await findGigByExternalId(input.source, input.externalId);
  if (existingGig) {
    throw new Error(`Gig with externalId ${input.externalId} from ${input.source} already exists`);
  }

  const now = new Date();
  const gigData: Partial<Gig> = {
    // Basic info
    title: input.title.trim(),
    description: input.description.trim(),
    location: {
      city: input.location.city.trim(),
      state: input.location.state.trim(),
      lat: input.location.lat,
      lng: input.location.lng,
    },

    // Poster info (null for aggregated)
    postedBy: null,
    founderId: null,
    founderProfile: null,

    // Timestamps
    createdAt: now,
    lastUpdatedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiresAt(now),

    // Classification
    gigType: input.gigType,
    type: input.gigType,
    profession: input.profession,
    specialties: input.profession as unknown as string[],

    // Compensation
    payRange: input.payRange,

    // Requirements
    requirements: input.requirements || [],
    benefits: input.benefits || [],

    // Status
    status: 'Open',
    isActive: GIG_DEFAULTS.isActive,

    // Source (aggregated)
    source: input.source,
    sourceUrl: input.sourceUrl,
    externalId: input.externalId,

    // Metrics
    qualityScore: input.qualityScore ?? GIG_DEFAULTS.qualityScore,
    viewCount: GIG_DEFAULTS.viewCount,
    applicationCount: GIG_DEFAULTS.applicationCount,
    applicantCount: GIG_DEFAULTS.applicationCount,
  };

  const gigsRef = collection(firestore, COLLECTIONS.GIGS);
  const docRef = await addDoc(gigsRef, {
    ...gigData,
    createdAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(gigData.expiresAt as Date),
  });

  // Update with gigId
  await updateDoc(docRef, {
    gigId: docRef.id,
    id: docRef.id,
  });

  return docRef.id;
};

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get a gig by ID
 */
export const getGigById = async (gigId: string): Promise<Gig | null> => {
  const gigRef = doc(firestore, COLLECTIONS.GIGS, gigId);
  const gigSnap = await getDoc(gigRef);

  if (!gigSnap.exists()) {
    return null;
  }

  return { id: gigSnap.id, ...gigSnap.data() } as Gig;
};

/**
 * Find gig by external ID (for de-duplication)
 */
export const findGigByExternalId = async (
  source: GigOrigin,
  externalId: string
): Promise<Gig | null> => {
  const gigsRef = collection(firestore, COLLECTIONS.GIGS);
  const q = query(
    gigsRef,
    where('source', '==', source),
    where('externalId', '==', externalId),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Gig;
};

/**
 * Get active gigs sorted by quality score
 */
export const getActiveGigs = async (
  options: {
    limitCount?: number;
    profession?: GigProfession;
    city?: string;
    state?: string;
  } = {}
): Promise<Gig[]> => {
  const gigsRef = collection(firestore, COLLECTIONS.GIGS);
  const constraints: QueryConstraint[] = [
    where('isActive', '==', true),
    orderBy('qualityScore', 'desc'),
    orderBy('createdAt', 'desc'),
  ];

  if (options.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  const q = query(gigsRef, ...constraints);
  const snapshot = await getDocs(q);

  let gigs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gig));

  // Client-side filtering for array-contains and location
  if (options.profession) {
    gigs = gigs.filter(gig => gig.profession.includes(options.profession!));
  }
  if (options.city) {
    gigs = gigs.filter(gig => gig.location.city === options.city);
  }
  if (options.state) {
    gigs = gigs.filter(gig => gig.location.state === options.state);
  }

  return gigs;
};

/**
 * Get gigs by source
 */
export const getGigsBySource = async (source: GigOrigin): Promise<Gig[]> => {
  const gigsRef = collection(firestore, COLLECTIONS.GIGS);
  const q = query(
    gigsRef,
    where('source', '==', source),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gig));
};

/**
 * Get gigs posted by a user
 */
export const getGigsByUser = async (userId: string): Promise<Gig[]> => {
  const gigsRef = collection(firestore, COLLECTIONS.GIGS);
  const q = query(
    gigsRef,
    where('postedBy', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gig));
};

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update a gig
 */
export const updateGig = async (
  gigId: string,
  updates: Partial<Omit<Gig, 'id' | 'gigId' | 'createdAt' | 'source' | 'postedBy'>>
): Promise<void> => {
  const gigRef = doc(firestore, COLLECTIONS.GIGS, gigId);

  await updateDoc(gigRef, {
    ...updates,
    lastUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Increment view count
 */
export const incrementViewCount = async (gigId: string): Promise<void> => {
  const gigRef = doc(firestore, COLLECTIONS.GIGS, gigId);
  await updateDoc(gigRef, {
    viewCount: increment(1),
  });
};

/**
 * Increment application count
 */
export const incrementApplicationCount = async (gigId: string): Promise<void> => {
  const gigRef = doc(firestore, COLLECTIONS.GIGS, gigId);
  await updateDoc(gigRef, {
    applicationCount: increment(1),
    applicantCount: increment(1), // Backward compat
  });
};

/**
 * Deactivate a gig
 */
export const deactivateGig = async (gigId: string): Promise<void> => {
  await updateGig(gigId, { isActive: false, status: 'Closed' });
};

/**
 * Update quality score
 */
export const updateQualityScore = async (gigId: string, score: number): Promise<void> => {
  if (score < 1 || score > 10) {
    throw new Error('Quality score must be between 1 and 10');
  }
  await updateGig(gigId, { qualityScore: score });
};

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a gig
 */
export const deleteGig = async (gigId: string): Promise<void> => {
  const gigRef = doc(firestore, COLLECTIONS.GIGS, gigId);
  await deleteDoc(gigRef);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a gig is expired
 */
export const isGigExpired = (gig: Gig): boolean => {
  const expiresAt = gig.expiresAt instanceof Date ? gig.expiresAt : (gig.expiresAt as any).toDate();
  return new Date() > expiresAt;
};

/**
 * Deactivate expired gigs (should be run by Cloud Function on schedule)
 */
export const deactivateExpiredGigs = async (): Promise<number> => {
  const gigsRef = collection(firestore, COLLECTIONS.GIGS);
  const now = Timestamp.now();

  const q = query(
    gigsRef,
    where('isActive', '==', true),
    where('expiresAt', '<=', now)
  );

  const snapshot = await getDocs(q);
  let count = 0;

  for (const doc of snapshot.docs) {
    await updateDoc(doc.ref, {
      isActive: false,
      status: 'Closed',
      lastUpdatedAt: serverTimestamp(),
    });
    count++;
  }

  return count;
};
