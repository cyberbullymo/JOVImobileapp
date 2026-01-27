/**
 * Migration Script: Extend Gigs Collection Schema
 *
 * This script migrates existing gigs to support both user-generated and aggregated gigs.
 * It adds new fields with appropriate defaults while maintaining backward compatibility.
 *
 * Run with: npx ts-node scripts/migrateGigs.ts
 * Or configure in package.json: "migrate:gigs": "ts-node scripts/migrateGigs.ts"
 *
 * Prerequisites:
 * - Firebase Admin SDK credentials (service account JSON)
 * - Set GOOGLE_APPLICATION_CREDENTIALS environment variable to the path of your service account key
 *   OR place a serviceAccountKey.json file in the project root
 *
 * Example:
 *   export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
 *   npm run migrate:gigs:dry-run
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK
const initializeFirebase = (): admin.firestore.Firestore => {
  // Check if already initialized
  if (admin.apps && admin.apps.length > 0) {
    return admin.firestore();
  }

  // Try to find service account credentials
  const possiblePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    './serviceAccountKey.json',
    './service-account.json',
    './firebase-adminsdk.json',
  ].filter(Boolean) as string[];

  let credential: admin.credential.Credential | undefined;

  for (const credPath of possiblePaths) {
    const fullPath = credPath.startsWith('/') ? credPath : join(process.cwd(), credPath);
    if (existsSync(fullPath)) {
      try {
        const serviceAccount = JSON.parse(readFileSync(fullPath, 'utf-8'));
        credential = admin.credential.cert(serviceAccount);
        console.log(`Using service account from: ${fullPath}`);
        break;
      } catch (e) {
        console.warn(`Failed to load credentials from ${fullPath}:`, e);
      }
    }
  }

  if (!credential) {
    console.error('\n❌ Firebase Admin credentials not found!');
    console.error('\nTo run this migration, you need to:');
    console.error('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('2. Click "Generate new private key" to download the JSON file');
    console.error('3. Save it as "serviceAccountKey.json" in the project root');
    console.error('   OR set GOOGLE_APPLICATION_CREDENTIALS environment variable\n');
    console.error('Example:');
    console.error('  export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"');
    console.error('  npm run migrate:gigs:dry-run\n');
    process.exit(1);
  }

  admin.initializeApp({
    credential,
    projectId: 'jovi-10873',
  });

  return admin.firestore();
};

// Default values for new fields
const GIG_DEFAULTS = {
  source: 'user-generated' as const,
  sourceUrl: null,
  externalId: null,
  qualityScore: 5,
  isActive: true,
  viewCount: 0,
  applicationCount: 0,
  expirationDays: 30,
};

// Map legacy gig types to new format
const GIG_TYPE_MAP: Record<string, string> = {
  'Full-time': 'full-time',
  'Part-time': 'part-time',
  'Freelance': 'freelance',
  'Internship': 'internship',
  'Apprenticeship': 'apprenticeship',
};

// Map legacy compensation types to new pay types
const PAY_TYPE_MAP: Record<string, string> = {
  'Hourly': 'hourly',
  'Salary': 'salary',
  'Commission': 'commission',
  'Unpaid': 'hourly', // Default to hourly for unpaid
};

// Map specialties to profession types
const SPECIALTY_TO_PROFESSION: Record<string, string> = {
  'hair': 'hairstylist',
  'hairstylist': 'hairstylist',
  'hairstyling': 'hairstylist',
  'coloring': 'hairstylist',
  'cutting': 'hairstylist',
  'styling': 'hairstylist',
  'braiding': 'hairstylist',
  'nails': 'nail-tech',
  'nail': 'nail-tech',
  'manicure': 'nail-tech',
  'pedicure': 'nail-tech',
  'nail art': 'nail-tech',
  'esthetics': 'esthetician',
  'esthetician': 'esthetician',
  'skincare': 'esthetician',
  'facial': 'esthetician',
  'makeup': 'makeup-artist',
  'makeup artist': 'makeup-artist',
  'mua': 'makeup-artist',
  'bridal': 'makeup-artist',
  'barber': 'barber',
  'barbering': 'barber',
  'lashes': 'lash-tech',
  'lash': 'lash-tech',
  'eyelash': 'lash-tech',
  'extensions': 'lash-tech',
};

interface LegacyGig {
  id?: string;
  founderId?: string;
  founderProfile?: any;
  title: string;
  description: string;
  type?: string;
  specialties?: string[];
  location?: {
    city: string;
    state: string;
    lat?: number;
    lng?: number;
  };
  compensation?: {
    type: string;
    amount?: number;
    range?: {
      min: number;
      max: number;
    };
  };
  requirements?: string[];
  benefits?: string[];
  startDate?: any;
  status?: string;
  applicantCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

interface MigratedGig {
  // Core identifiers
  gigId: string;

  // Basic gig information
  title: string;
  description: string;
  location: {
    city: string;
    state: string;
    lat: number | null;
    lng: number | null;
  };

  // Poster information
  postedBy: string | null;
  founderId: string | null;
  founderProfile: any | null;

  // Timestamps
  createdAt: admin.firestore.Timestamp;
  lastUpdatedAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;

  // Gig classification
  gigType: string;
  type: string;
  profession: string[];
  specialties: string[];

  // Compensation
  payRange: {
    min: number;
    max: number;
    type: string;
  };
  compensation: any;

  // Requirements
  requirements: string[];
  benefits: string[];
  startDate: admin.firestore.Timestamp | null;

  // Status
  status: string;
  isActive: boolean;

  // Aggregation fields
  source: string;
  sourceUrl: string | null;
  externalId: string | null;

  // Metrics
  qualityScore: number;
  viewCount: number;
  applicationCount: number;
  applicantCount: number;
}

/**
 * Calculate expiration date (30 days from creation)
 */
const calculateExpiresAt = (createdAt: admin.firestore.Timestamp): admin.firestore.Timestamp => {
  const date = createdAt.toDate();
  date.setDate(date.getDate() + GIG_DEFAULTS.expirationDays);
  return admin.firestore.Timestamp.fromDate(date);
};

/**
 * Map specialties array to profession types
 */
const mapSpecialtiesToProfession = (specialties: string[]): string[] => {
  const professions = new Set<string>();

  for (const specialty of specialties) {
    const normalized = specialty.toLowerCase().trim();
    const profession = SPECIALTY_TO_PROFESSION[normalized];
    if (profession) {
      professions.add(profession);
    }
  }

  // Default to hairstylist if no professions matched
  if (professions.size === 0) {
    professions.add('hairstylist');
  }

  return Array.from(professions);
};

/**
 * Migrate a single gig document
 */
const migrateGig = (docId: string, data: LegacyGig): MigratedGig => {
  const now = admin.firestore.Timestamp.now();
  const createdAt = data.createdAt || now;
  const updatedAt = data.updatedAt || now;

  // Map legacy gig type
  const legacyType = data.type || 'Full-time';
  const gigType = GIG_TYPE_MAP[legacyType] || 'full-time';

  // Map compensation to payRange
  let payRange = {
    min: 0,
    max: 0,
    type: 'hourly',
  };

  if (data.compensation) {
    const payType = PAY_TYPE_MAP[data.compensation.type] || 'hourly';
    if (data.compensation.range) {
      payRange = {
        min: data.compensation.range.min,
        max: data.compensation.range.max,
        type: payType,
      };
    } else if (data.compensation.amount) {
      payRange = {
        min: data.compensation.amount,
        max: data.compensation.amount,
        type: payType,
      };
    }
  }

  // Map specialties to profession
  const specialties = data.specialties || [];
  const profession = mapSpecialtiesToProfession(specialties);

  // Ensure location has all fields
  const location = {
    city: data.location?.city || '',
    state: data.location?.state || '',
    lat: data.location?.lat || null,
    lng: data.location?.lng || null,
  };

  // Determine if gig is active based on status
  const isActive = data.status !== 'Closed' && data.status !== 'Filled';

  return {
    // Core identifiers
    gigId: docId,

    // Basic gig information
    title: data.title,
    description: data.description,
    location,

    // Poster information (user-generated gigs have founderId)
    postedBy: data.founderId || null,
    founderId: data.founderId || null,
    founderProfile: data.founderProfile || null,

    // Timestamps
    createdAt,
    lastUpdatedAt: updatedAt,
    updatedAt,
    expiresAt: calculateExpiresAt(createdAt),

    // Gig classification
    gigType,
    type: legacyType, // Keep legacy for backward compat
    profession,
    specialties, // Keep original for backward compat

    // Compensation
    payRange,
    compensation: data.compensation || null, // Keep legacy for backward compat

    // Requirements
    requirements: data.requirements || [],
    benefits: data.benefits || [],
    startDate: data.startDate || null,

    // Status
    status: data.status || 'Open',
    isActive,

    // Aggregation fields (all existing gigs are user-generated)
    source: GIG_DEFAULTS.source,
    sourceUrl: GIG_DEFAULTS.sourceUrl,
    externalId: GIG_DEFAULTS.externalId,

    // Metrics
    qualityScore: GIG_DEFAULTS.qualityScore,
    viewCount: GIG_DEFAULTS.viewCount,
    applicationCount: data.applicantCount || GIG_DEFAULTS.applicationCount,
    applicantCount: data.applicantCount || GIG_DEFAULTS.applicationCount,
  };
};

/**
 * Perform dry run - preview changes without writing
 */
const dryRun = async (db: admin.firestore.Firestore): Promise<void> => {
  console.log('='.repeat(60));
  console.log('DRY RUN - Previewing migration changes');
  console.log('='.repeat(60));

  const gigsRef = db.collection('gigs');
  const snapshot = await gigsRef.get();

  console.log(`Found ${snapshot.size} gigs to migrate\n`);

  if (snapshot.empty) {
    console.log('No gigs found. Nothing to migrate.');
    return;
  }

  let count = 0;
  for (const doc of snapshot.docs) {
    count++;
    const data = doc.data() as LegacyGig;
    const migrated = migrateGig(doc.id, data);

    console.log(`\n[${count}/${snapshot.size}] Gig: ${doc.id}`);
    console.log(`  Title: ${migrated.title}`);
    console.log(`  Legacy type: ${data.type} -> New gigType: ${migrated.gigType}`);
    console.log(`  Specialties: [${data.specialties?.join(', ')}] -> Profession: [${migrated.profession.join(', ')}]`);
    console.log(`  Source: ${migrated.source}`);
    console.log(`  isActive: ${migrated.isActive}`);
    console.log(`  qualityScore: ${migrated.qualityScore}`);
    console.log(`  expiresAt: ${migrated.expiresAt.toDate().toISOString()}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('DRY RUN COMPLETE - No changes were made');
  console.log('='.repeat(60));
};

/**
 * Execute the migration
 */
const migrate = async (db: admin.firestore.Firestore): Promise<void> => {
  console.log('='.repeat(60));
  console.log('EXECUTING MIGRATION');
  console.log('='.repeat(60));

  const gigsRef = db.collection('gigs');
  const snapshot = await gigsRef.get();

  console.log(`Found ${snapshot.size} gigs to migrate\n`);

  if (snapshot.empty) {
    console.log('No gigs found. Nothing to migrate.');
    return;
  }

  const batch = db.batch();
  let batchCount = 0;
  let totalMigrated = 0;
  const BATCH_SIZE = 500; // Firestore batch limit

  for (const doc of snapshot.docs) {
    const data = doc.data() as LegacyGig;
    const migrated = migrateGig(doc.id, data);

    batch.set(doc.ref, migrated, { merge: true });
    batchCount++;
    totalMigrated++;

    // Commit batch when reaching limit
    if (batchCount >= BATCH_SIZE) {
      console.log(`Committing batch of ${batchCount} documents...`);
      await batch.commit();
      batchCount = 0;
    }
  }

  // Commit remaining documents
  if (batchCount > 0) {
    console.log(`Committing final batch of ${batchCount} documents...`);
    await batch.commit();
  }

  console.log('\n' + '='.repeat(60));
  console.log(`MIGRATION COMPLETE - ${totalMigrated} gigs migrated`);
  console.log('='.repeat(60));
};

/**
 * Validate migration results
 */
const validate = async (db: admin.firestore.Firestore): Promise<void> => {
  console.log('='.repeat(60));
  console.log('VALIDATING MIGRATION');
  console.log('='.repeat(60));

  const gigsRef = db.collection('gigs');
  const snapshot = await gigsRef.get();

  let valid = 0;
  let invalid = 0;
  const issues: string[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const docIssues: string[] = [];

    // Check required new fields
    if (data.source === undefined) docIssues.push('missing source');
    if (data.isActive === undefined) docIssues.push('missing isActive');
    if (data.qualityScore === undefined) docIssues.push('missing qualityScore');
    if (data.expiresAt === undefined) docIssues.push('missing expiresAt');
    if (data.viewCount === undefined) docIssues.push('missing viewCount');
    if (data.applicationCount === undefined) docIssues.push('missing applicationCount');
    if (data.gigType === undefined) docIssues.push('missing gigType');
    if (data.profession === undefined) docIssues.push('missing profession');
    if (data.payRange === undefined) docIssues.push('missing payRange');
    if (data.gigId === undefined) docIssues.push('missing gigId');

    // Validate user-generated gigs have postedBy
    if (data.source === 'user-generated' && !data.postedBy && !data.founderId) {
      docIssues.push('user-generated gig missing postedBy');
    }

    // Validate quality score range
    if (data.qualityScore !== undefined && (data.qualityScore < 1 || data.qualityScore > 10)) {
      docIssues.push(`invalid qualityScore: ${data.qualityScore}`);
    }

    if (docIssues.length > 0) {
      invalid++;
      issues.push(`${doc.id}: ${docIssues.join(', ')}`);
    } else {
      valid++;
    }
  }

  console.log(`\nValidation Results:`);
  console.log(`  Valid gigs: ${valid}`);
  console.log(`  Invalid gigs: ${invalid}`);

  if (issues.length > 0) {
    console.log('\nIssues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION COMPLETE');
  console.log('='.repeat(60));
};

/**
 * Main entry point
 */
const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const command = args[0] || 'dry-run';

  console.log('\n🚀 Gigs Collection Migration Script');
  console.log(`Command: ${command}\n`);

  try {
    const db = initializeFirebase();

    switch (command) {
      case 'dry-run':
        await dryRun(db);
        break;
      case 'migrate':
        await migrate(db);
        break;
      case 'validate':
        await validate(db);
        break;
      case 'full':
        await dryRun(db);
        console.log('\nProceeding with migration in 5 seconds... (Ctrl+C to cancel)');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await migrate(db);
        await validate(db);
        break;
      default:
        console.log('Usage: npx ts-node scripts/migrateGigs.ts [command]');
        console.log('\nCommands:');
        console.log('  dry-run   - Preview changes without writing (default)');
        console.log('  migrate   - Execute the migration');
        console.log('  validate  - Validate migration results');
        console.log('  full      - Run dry-run, migrate, and validate');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

main();
