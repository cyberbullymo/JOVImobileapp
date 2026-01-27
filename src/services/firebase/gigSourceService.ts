/**
 * Gig Source Service
 * Handles CRUD operations and health monitoring for the gigSources collection
 * Used to track external gig aggregation sources and their performance
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { firestore, COLLECTIONS } from './config';
import {
  GigSource,
  GigSourceType,
  GigSourcePlatform,
  GigSourceLocation,
  ScrapingFrequency,
  CreateGigSourceInput,
  UpdateGigSourceInput,
  GigSourceHealth,
  SourceHealthStatus,
  GIG_SOURCE_DEFAULTS,
  getSourceHealthStatus,
  isWithinExpectedFrequency,
} from '../../types';

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate source ID format (lowercase, hyphenated)
 */
const isValidSourceId = (sourceId: string): boolean => {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(sourceId);
};

/**
 * Validate gig source input
 */
export const validateGigSourceInput = (input: CreateGigSourceInput): ValidationResult => {
  const errors: string[] = [];

  // Source ID validation
  if (!input.sourceId?.trim()) {
    errors.push('sourceId is required');
  } else if (!isValidSourceId(input.sourceId)) {
    errors.push('sourceId must be lowercase with hyphens only (e.g., "craigslist-la-beauty")');
  }

  // Name validation
  if (!input.name?.trim()) {
    errors.push('name is required');
  } else if (input.name.length < 5) {
    errors.push('name must be at least 5 characters');
  }

  // URL validation
  if (!input.url?.trim()) {
    errors.push('url is required');
  } else {
    try {
      new URL(input.url);
    } catch {
      errors.push('url must be a valid URL');
    }
  }

  // Type validation
  const validTypes: GigSourceType[] = ['rss', 'scraper', 'api', 'manual'];
  if (!input.type || !validTypes.includes(input.type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`);
  }

  // Platform validation
  const validPlatforms: GigSourcePlatform[] = ['craigslist', 'indeed', 'school-board', 'facebook', 'instagram'];
  if (!input.platform || !validPlatforms.includes(input.platform)) {
    errors.push(`platform must be one of: ${validPlatforms.join(', ')}`);
  }

  // Location validation
  if (!input.location) {
    errors.push('location is required');
  } else {
    if (!input.location.city?.trim()) errors.push('location.city is required');
    if (!input.location.state?.trim()) errors.push('location.state is required');
    if (!input.location.region?.trim()) errors.push('location.region is required');
  }

  // Frequency validation
  const validFrequencies: ScrapingFrequency[] = ['hourly', 'every-6-hours', 'daily', 'weekly', 'manual'];
  if (!input.scrapingFrequency || !validFrequencies.includes(input.scrapingFrequency)) {
    errors.push(`scrapingFrequency must be one of: ${validFrequencies.join(', ')}`);
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
 * Create a new gig source
 */
export const createGigSource = async (input: CreateGigSourceInput): Promise<string> => {
  const validation = validateGigSourceInput(input);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Check if source already exists
  const existingSource = await getGigSourceById(input.sourceId);
  if (existingSource) {
    throw new Error(`Source with ID "${input.sourceId}" already exists`);
  }

  const now = new Date();
  const sourceData: GigSource = {
    sourceId: input.sourceId,
    name: input.name.trim(),
    url: input.url.trim(),
    type: input.type,
    platform: input.platform,
    location: {
      city: input.location.city.trim(),
      state: input.location.state.trim(),
      region: input.location.region.trim(),
    },
    isActive: input.isActive ?? false, // Default to inactive until verified
    lastScraped: null,
    lastSuccess: null,
    scrapingFrequency: input.scrapingFrequency,
    gigCount: 0,
    totalGigsScraped: 0,
    errorCount: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };

  const sourceRef = doc(firestore, COLLECTIONS.GIG_SOURCES, input.sourceId);
  await setDoc(sourceRef, {
    ...sourceData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return input.sourceId;
};

/**
 * Create multiple gig sources in a batch
 */
export const createGigSourcesBatch = async (sources: CreateGigSourceInput[]): Promise<string[]> => {
  // Validate all sources first
  for (const source of sources) {
    const validation = validateGigSourceInput(source);
    if (!validation.isValid) {
      throw new Error(`Validation failed for "${source.sourceId}": ${validation.errors.join(', ')}`);
    }
  }

  const batch = writeBatch(firestore);
  const sourceIds: string[] = [];

  for (const input of sources) {
    const sourceRef = doc(firestore, COLLECTIONS.GIG_SOURCES, input.sourceId);
    const sourceData: Omit<GigSource, 'createdAt' | 'updatedAt'> = {
      sourceId: input.sourceId,
      name: input.name.trim(),
      url: input.url.trim(),
      type: input.type,
      platform: input.platform,
      location: {
        city: input.location.city.trim(),
        state: input.location.state.trim(),
        region: input.location.region.trim(),
      },
      isActive: input.isActive ?? false,
      lastScraped: null,
      lastSuccess: null,
      scrapingFrequency: input.scrapingFrequency,
      gigCount: 0,
      totalGigsScraped: 0,
      errorCount: 0,
      lastError: null,
    };

    batch.set(sourceRef, {
      ...sourceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    sourceIds.push(input.sourceId);
  }

  await batch.commit();
  return sourceIds;
};

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get a gig source by ID
 */
export const getGigSourceById = async (sourceId: string): Promise<GigSource | null> => {
  const sourceRef = doc(firestore, COLLECTIONS.GIG_SOURCES, sourceId);
  const sourceSnap = await getDoc(sourceRef);

  if (!sourceSnap.exists()) {
    return null;
  }

  return convertTimestamps(sourceSnap.data() as GigSource);
};

/**
 * Get all gig sources
 */
export const getAllGigSources = async (): Promise<GigSource[]> => {
  const sourcesRef = collection(firestore, COLLECTIONS.GIG_SOURCES);
  const q = query(sourcesRef, orderBy('name'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => convertTimestamps(doc.data() as GigSource));
};

/**
 * Get active gig sources
 */
export const getActiveGigSources = async (): Promise<GigSource[]> => {
  const sourcesRef = collection(firestore, COLLECTIONS.GIG_SOURCES);
  const q = query(
    sourcesRef,
    where('isActive', '==', true),
    orderBy('name')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => convertTimestamps(doc.data() as GigSource));
};

/**
 * Get gig sources by platform
 */
export const getGigSourcesByPlatform = async (platform: GigSourcePlatform): Promise<GigSource[]> => {
  const sourcesRef = collection(firestore, COLLECTIONS.GIG_SOURCES);
  const q = query(
    sourcesRef,
    where('platform', '==', platform),
    orderBy('name')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => convertTimestamps(doc.data() as GigSource));
};

/**
 * Get gig sources by region
 */
export const getGigSourcesByRegion = async (region: string): Promise<GigSource[]> => {
  const sourcesRef = collection(firestore, COLLECTIONS.GIG_SOURCES);
  const q = query(
    sourcesRef,
    where('location.region', '==', region),
    orderBy('name')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => convertTimestamps(doc.data() as GigSource));
};

/**
 * Get sources with errors (for monitoring)
 */
export const getSourcesWithErrors = async (): Promise<GigSource[]> => {
  const sourcesRef = collection(firestore, COLLECTIONS.GIG_SOURCES);
  const q = query(
    sourcesRef,
    where('errorCount', '>', 0),
    orderBy('errorCount', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => convertTimestamps(doc.data() as GigSource));
};

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update a gig source
 */
export const updateGigSource = async (
  sourceId: string,
  updates: UpdateGigSourceInput
): Promise<void> => {
  const sourceRef = doc(firestore, COLLECTIONS.GIG_SOURCES, sourceId);

  await updateDoc(sourceRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Record a successful scrape
 */
export const recordSuccessfulScrape = async (
  sourceId: string,
  newGigsCount: number = 0
): Promise<void> => {
  const sourceRef = doc(firestore, COLLECTIONS.GIG_SOURCES, sourceId);

  const updates: Record<string, any> = {
    lastScraped: serverTimestamp(),
    errorCount: 0, // Reset error count on success
    lastError: null,
    updatedAt: serverTimestamp(),
  };

  if (newGigsCount > 0) {
    updates.lastSuccess = serverTimestamp();
    updates.gigCount = increment(newGigsCount);
    updates.totalGigsScraped = increment(newGigsCount);
  }

  await updateDoc(sourceRef, updates);
};

/**
 * Record a scrape failure
 */
export const recordScrapeFailure = async (
  sourceId: string,
  errorMessage: string
): Promise<void> => {
  const sourceRef = doc(firestore, COLLECTIONS.GIG_SOURCES, sourceId);

  // Get current error count to check if we should auto-disable
  const source = await getGigSourceById(sourceId);
  const newErrorCount = (source?.errorCount ?? 0) + 1;

  const updates: Record<string, any> = {
    lastScraped: serverTimestamp(),
    errorCount: increment(1),
    lastError: errorMessage,
    updatedAt: serverTimestamp(),
  };

  // Auto-disable after max consecutive errors
  if (newErrorCount >= GIG_SOURCE_DEFAULTS.maxConsecutiveErrors) {
    updates.isActive = false;
  }

  await updateDoc(sourceRef, updates);
};

/**
 * Activate a gig source
 */
export const activateGigSource = async (sourceId: string): Promise<void> => {
  await updateGigSource(sourceId, { isActive: true });
};

/**
 * Deactivate a gig source
 */
export const deactivateGigSource = async (sourceId: string): Promise<void> => {
  await updateGigSource(sourceId, { isActive: false });
};

/**
 * Update gig count (when gigs are added or removed)
 */
export const updateGigCount = async (
  sourceId: string,
  delta: number
): Promise<void> => {
  const sourceRef = doc(firestore, COLLECTIONS.GIG_SOURCES, sourceId);

  await updateDoc(sourceRef, {
    gigCount: increment(delta),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Decrement gig count (when a gig expires or is deleted)
 */
export const decrementGigCount = async (sourceId: string): Promise<void> => {
  await updateGigCount(sourceId, -1);
};

/**
 * Update advanced metrics
 */
export const updateSourceMetrics = async (
  sourceId: string,
  metrics: {
    averageGigQuality?: number;
    conversionRate?: number;
    deduplicationRate?: number;
  }
): Promise<void> => {
  const sourceRef = doc(firestore, COLLECTIONS.GIG_SOURCES, sourceId);

  await updateDoc(sourceRef, {
    ...metrics,
    updatedAt: serverTimestamp(),
  });
};

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a gig source
 */
export const deleteGigSource = async (sourceId: string): Promise<void> => {
  const sourceRef = doc(firestore, COLLECTIONS.GIG_SOURCES, sourceId);
  await deleteDoc(sourceRef);
};

// ============================================================================
// HEALTH MONITORING
// ============================================================================

/**
 * Get health status for all sources
 */
export const getAllSourcesHealth = async (): Promise<GigSourceHealth[]> => {
  const sources = await getAllGigSources();

  return sources.map(source => ({
    sourceId: source.sourceId,
    status: getSourceHealthStatus(source),
    lastScraped: source.lastScraped,
    errorCount: source.errorCount,
    gigCount: source.gigCount,
    isWithinExpectedFrequency: isWithinExpectedFrequency(source),
  }));
};

/**
 * Get sources that need attention (critical or warning status)
 */
export const getSourcesNeedingAttention = async (): Promise<GigSourceHealth[]> => {
  const allHealth = await getAllSourcesHealth();

  return allHealth.filter(
    health => health.status === 'critical' || health.status === 'warning'
  );
};

/**
 * Get sources that are overdue for scraping
 */
export const getOverdueSources = async (): Promise<GigSource[]> => {
  const activeSources = await getActiveGigSources();

  return activeSources.filter(source => !isWithinExpectedFrequency(source));
};

/**
 * Get aggregated stats for all sources
 */
export const getSourcesStats = async (): Promise<{
  totalSources: number;
  activeSources: number;
  totalGigs: number;
  healthySources: number;
  warningSources: number;
  criticalSources: number;
  inactiveSources: number;
}> => {
  const allHealth = await getAllSourcesHealth();
  const sources = await getAllGigSources();

  return {
    totalSources: sources.length,
    activeSources: sources.filter(s => s.isActive).length,
    totalGigs: sources.reduce((sum, s) => sum + s.gigCount, 0),
    healthySources: allHealth.filter(h => h.status === 'healthy').length,
    warningSources: allHealth.filter(h => h.status === 'warning').length,
    criticalSources: allHealth.filter(h => h.status === 'critical').length,
    inactiveSources: allHealth.filter(h => h.status === 'inactive').length,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Firestore timestamps to Date objects
 */
const convertTimestamps = (source: GigSource): GigSource => {
  return {
    ...source,
    lastScraped: source.lastScraped
      ? (source.lastScraped as any).toDate?.() ?? source.lastScraped
      : null,
    lastSuccess: source.lastSuccess
      ? (source.lastSuccess as any).toDate?.() ?? source.lastSuccess
      : null,
    createdAt: (source.createdAt as any).toDate?.() ?? source.createdAt,
    updatedAt: (source.updatedAt as any).toDate?.() ?? source.updatedAt,
  };
};

/**
 * Generate source ID from platform and location
 */
export const generateSourceId = (
  platform: GigSourcePlatform,
  city: string,
  suffix?: string
): string => {
  const cleanCity = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const base = `${platform}-${cleanCity}`;
  return suffix ? `${base}-${suffix}` : base;
};

/**
 * Get source ID from a gig's source and location
 * Used by Cloud Functions to update source stats
 */
export const getSourceIdFromGig = (gig: {
  source: string;
  location: { city: string; state: string };
}): string | null => {
  if (gig.source === 'user-generated') return null;

  const platform = gig.source as GigSourcePlatform;
  return generateSourceId(platform, gig.location.city);
};
