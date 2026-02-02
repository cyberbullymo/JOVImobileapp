import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  Firestore,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { getFunctions, httpsCallable, Functions } from "firebase/functions";
import type { Gig, CreateGigInput, GigFilters, GigSourceConfig, CurationStats } from "@/types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);
}

export { auth, db, storage, functions };

// Auth functions
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function checkIsAdmin(user: User): Promise<boolean> {
  const tokenResult = await user.getIdTokenResult();
  return tokenResult.claims.admin === true;
}

// Collection references (matching main app)
const COLLECTIONS = {
  GIGS: "gigs",
  GIG_SOURCES: "gigSources",
  DRAFTS: "gigDrafts",
};

// Helper to convert Firestore timestamps
function convertTimestamps(data: Record<string, unknown>): Record<string, unknown> {
  const converted = { ...data };
  for (const key of Object.keys(converted)) {
    if (converted[key] instanceof Timestamp) {
      converted[key] = (converted[key] as Timestamp).toDate();
    }
  }
  return converted;
}

// Gig CRUD operations
export async function createGig(input: CreateGigInput): Promise<string> {
  const now = new Date();
  const expiresAt = input.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const cleanInput = removeUndefinedFields(input);
  const gigData = {
    ...cleanInput,
    postedBy: null, // Aggregated gigs have null postedBy
    createdAt: Timestamp.fromDate(now),
    lastUpdatedAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
    status: "Open",
    isActive: true,
    externalId: `manual-${Date.now()}`,
    viewCount: 0,
    applicationCount: 0,
    qualityScore: input.qualityScore || 5,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.GIGS), gigData);

  // Update with gigId
  await updateDoc(docRef, { gigId: docRef.id });

  return docRef.id;
}

export async function getGig(id: string): Promise<Gig | null> {
  const docRef = doc(db, COLLECTIONS.GIGS, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = convertTimestamps(docSnap.data());
  return { id: docSnap.id, ...data } as Gig;
}

export async function updateGig(id: string, updates: Partial<Gig>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GIGS, id);
  await updateDoc(docRef, {
    ...updates,
    lastUpdatedAt: Timestamp.fromDate(new Date()),
  });
}

export async function deleteGig(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GIGS, id);
  await deleteDoc(docRef);
}

export async function deactivateGig(id: string): Promise<void> {
  await updateGig(id, { isActive: false, status: "Closed" });
}

export async function reactivateGig(id: string): Promise<void> {
  await updateGig(id, { isActive: true, status: "Open" });
}

export async function getGigs(filters?: GigFilters): Promise<Gig[]> {
  let q = query(collection(db, COLLECTIONS.GIGS), orderBy("createdAt", "desc"));

  if (filters?.source && filters.source !== "user-generated") {
    q = query(q, where("source", "==", filters.source));
  }

  if (filters?.status === "active") {
    q = query(q, where("isActive", "==", true));
  } else if (filters?.status === "expired") {
    q = query(q, where("isActive", "==", false));
  }

  if (filters?.profession) {
    q = query(q, where("profession", "array-contains", filters.profession));
  }

  const snapshot = await getDocs(q);
  const gigs = snapshot.docs.map((doc) => {
    const data = convertTimestamps(doc.data());
    return { id: doc.id, ...data } as Gig;
  });

  // Client-side search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    return gigs.filter(
      (gig) =>
        gig.title.toLowerCase().includes(searchLower) ||
        gig.location.city.toLowerCase().includes(searchLower) ||
        gig.location.state.toLowerCase().includes(searchLower)
    );
  }

  return gigs;
}

export async function getManuallyCuratedGigs(): Promise<Gig[]> {
  // Get all gigs that are not user-generated (i.e., curated by admin)
  const q = query(
    collection(db, COLLECTIONS.GIGS),
    where("postedBy", "==", null),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = convertTimestamps(doc.data());
    return { id: doc.id, ...data } as Gig;
  });
}

// Duplicate detection
export async function checkForDuplicates(
  title: string,
  city: string
): Promise<Gig[]> {
  const q = query(
    collection(db, COLLECTIONS.GIGS),
    where("location.city", "==", city),
    where("isActive", "==", true)
  );

  const snapshot = await getDocs(q);
  const gigs = snapshot.docs.map((doc) => {
    const data = convertTimestamps(doc.data());
    return { id: doc.id, ...data } as Gig;
  });

  // Simple string similarity check
  const titleLower = title.toLowerCase();
  return gigs.filter((gig) => {
    const existingTitleLower = gig.title.toLowerCase();
    const similarity = calculateSimilarity(titleLower, existingTitleLower);
    return similarity > 0.7;
  });
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

// Bulk operations
export async function bulkDeactivateGigs(ids: string[]): Promise<void> {
  const batch = writeBatch(db);

  for (const id of ids) {
    const docRef = doc(db, COLLECTIONS.GIGS, id);
    batch.update(docRef, {
      isActive: false,
      status: "Closed",
      lastUpdatedAt: Timestamp.fromDate(new Date()),
    });
  }

  await batch.commit();
}

export async function bulkDeleteGigs(ids: string[]): Promise<void> {
  const batch = writeBatch(db);

  for (const id of ids) {
    const docRef = doc(db, COLLECTIONS.GIGS, id);
    batch.delete(docRef);
  }

  await batch.commit();
}

// Helper to remove undefined values (Firestore doesn't accept undefined)
function removeUndefinedFields<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
}

// Draft operations
export async function saveDraft(
  userId: string,
  draftId: string | null,
  data: Partial<CreateGigInput>
): Promise<string> {
  const cleanData = removeUndefinedFields(data);

  if (draftId) {
    const docRef = doc(db, COLLECTIONS.DRAFTS, draftId);
    await updateDoc(docRef, {
      ...cleanData,
      updatedAt: Timestamp.fromDate(new Date()),
    });
    return draftId;
  } else {
    const docRef = await addDoc(collection(db, COLLECTIONS.DRAFTS), {
      ...cleanData,
      userId,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
    return docRef.id;
  }
}

export async function getDraft(draftId: string): Promise<Partial<CreateGigInput> | null> {
  const docRef = doc(db, COLLECTIONS.DRAFTS, draftId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return docSnap.data() as Partial<CreateGigInput>;
}

export async function deleteDraft(draftId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.DRAFTS, draftId);
  await deleteDoc(docRef);
}

export interface GigDraft {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  location?: {
    city?: string;
    state?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export async function getAllDrafts(): Promise<GigDraft[]> {
  const q = query(
    collection(db, COLLECTIONS.DRAFTS),
    orderBy("updatedAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = convertTimestamps(doc.data());
    return { id: doc.id, ...data } as GigDraft;
  });
}

// Analytics
export async function getCurationStats(): Promise<CurationStats> {
  const gigs = await getManuallyCuratedGigs();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const activeGigs = gigs.filter((g) => g.isActive);
  const thisWeekGigs = gigs.filter((g) => new Date(g.createdAt) >= weekAgo);

  const avgQualityScore =
    activeGigs.length > 0
      ? activeGigs.reduce((sum, g) => sum + g.qualityScore, 0) / activeGigs.length
      : 0;

  const bySource: Record<string, number> = {};
  const byProfession: Record<string, number> = {};

  for (const gig of gigs) {
    bySource[gig.source] = (bySource[gig.source] || 0) + 1;
    for (const prof of gig.profession) {
      byProfession[prof] = (byProfession[prof] || 0) + 1;
    }
  }

  return {
    totalGigs: gigs.length,
    activeGigs: activeGigs.length,
    thisWeekGigs: thisWeekGigs.length,
    avgQualityScore: Math.round(avgQualityScore * 10) / 10,
    bySource: bySource as Record<string, number>,
    byProfession: byProfession as Record<string, number>,
  };
}

// Gig Sources
export async function getGigSources(): Promise<GigSourceConfig[]> {
  const q = query(collection(db, COLLECTIONS.GIG_SOURCES), orderBy("name"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = convertTimestamps(doc.data());
    return { sourceId: doc.id, ...data } as GigSourceConfig;
  });
}

// Image upload
export async function uploadGigImage(file: File): Promise<string> {
  const fileName = `gig-images/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// CSV Export
export function exportGigsToCSV(gigs: Gig[]): string {
  const headers = [
    "ID",
    "Title",
    "Description",
    "City",
    "State",
    "Gig Type",
    "Professions",
    "Pay Min",
    "Pay Max",
    "Pay Type",
    "Source",
    "Source URL",
    "Quality Score",
    "Status",
    "Created At",
    "Expires At",
    "Views",
    "Applications",
  ];

  const rows = gigs.map((gig) => [
    gig.id,
    `"${gig.title.replace(/"/g, '""')}"`,
    `"${gig.description.replace(/"/g, '""')}"`,
    gig.location.city,
    gig.location.state,
    gig.gigType,
    gig.profession.join("; "),
    gig.payRange.min,
    gig.payRange.max,
    gig.payRange.type,
    gig.source,
    gig.sourceUrl || "",
    gig.qualityScore,
    gig.isActive ? "Active" : "Inactive",
    new Date(gig.createdAt).toISOString(),
    new Date(gig.expiresAt).toISOString(),
    gig.viewCount,
    gig.applicationCount,
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

// ============================================================================
// AI Quality Scoring (GIG-010)
// ============================================================================

export interface ScoreGigResult {
  gigId: string;
  score: number;
  reasoning: string;
  breakdown: {
    completeness: number;
    professionalism: number;
    studentRelevance: number;
    actionability: number;
  };
  success: boolean;
}

export interface BatchScoreResult {
  results: Array<{
    gigId: string;
    score?: number;
    success: boolean;
    error?: string;
  }>;
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

/**
 * Score a single gig using Claude AI
 */
export async function scoreGig(gigId: string): Promise<ScoreGigResult> {
  const scoreGigFn = httpsCallable<{ gigId: string }, ScoreGigResult>(
    functions,
    "scoreGig"
  );
  const result = await scoreGigFn({ gigId });
  return result.data;
}

/**
 * Batch score multiple gigs using Claude AI
 */
export async function batchScoreGigs(gigIds: string[]): Promise<BatchScoreResult> {
  const batchScoreFn = httpsCallable<{ gigIds: string[] }, BatchScoreResult>(
    functions,
    "batchScoreGigs"
  );
  const result = await batchScoreFn({ gigIds });
  return result.data;
}

/**
 * Get gigs pending manual review (low score)
 */
export interface GigReview {
  id: string;
  gigId: string;
  gigTitle: string;
  score: number;
  scoringBreakdown?: {
    completeness: number;
    professionalism: number;
    studentRelevance: number;
    actionability: number;
  };
  reason: string;
  createdAt: Date;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  action?: "approved" | "edited" | "deactivated";
}

export async function getReviewQueue(): Promise<GigReview[]> {
  const q = query(
    collection(db, "gigReviewQueue"),
    where("reviewed", "==", false),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = convertTimestamps(doc.data());
    return { id: doc.id, ...data } as GigReview;
  });
}

/**
 * Complete a review action
 */
export async function completeReview(
  reviewId: string,
  action: "approved" | "edited" | "deactivated"
): Promise<void> {
  const completeReviewFn = httpsCallable<
    { reviewId: string; action: string },
    { success: boolean }
  >(functions, "completeReview");
  await completeReviewFn({ reviewId, action });
}
