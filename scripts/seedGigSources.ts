/**
 * Seed Script: Initial Gig Sources
 *
 * This script seeds the gigSources collection with initial SoCal sources.
 * Run with: npm run seed:gig-sources
 *
 * Prerequisites:
 * - Firebase Admin SDK credentials (service account JSON)
 * - Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK
const initializeFirebase = (): admin.firestore.Firestore => {
  if (admin.apps && admin.apps.length > 0) {
    return admin.firestore();
  }

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
    console.error('\nTo run this script, you need to:');
    console.error('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.error('2. Click "Generate new private key" to download the JSON file');
    console.error('3. Save it as "serviceAccountKey.json" in the project root');
    console.error('   OR set GOOGLE_APPLICATION_CREDENTIALS environment variable\n');
    process.exit(1);
  }

  admin.initializeApp({
    credential,
    projectId: 'jovi-10873',
  });

  return admin.firestore();
};

// Types matching our schema
interface GigSourceSeed {
  sourceId: string;
  name: string;
  url: string;
  type: 'rss' | 'scraper' | 'api' | 'manual';
  platform: 'craigslist' | 'indeed' | 'school-board' | 'facebook' | 'instagram';
  location: {
    city: string;
    state: string;
    region: string;
  };
  isActive: boolean;
  scrapingFrequency: 'hourly' | 'every-6-hours' | 'daily' | 'weekly' | 'manual';
}

// Initial SoCal sources
const initialSources: GigSourceSeed[] = [
  // Craigslist - SoCal
  {
    sourceId: 'craigslist-la-beauty',
    name: 'Craigslist LA - Beauty Services',
    url: 'https://losangeles.craigslist.org/search/bty?format=rss',
    type: 'rss',
    platform: 'craigslist',
    location: { city: 'Los Angeles', state: 'CA', region: 'socal' },
    isActive: true,
    scrapingFrequency: 'every-6-hours',
  },
  {
    sourceId: 'craigslist-oc-beauty',
    name: 'Craigslist Orange County - Beauty',
    url: 'https://orangecounty.craigslist.org/search/bty?format=rss',
    type: 'rss',
    platform: 'craigslist',
    location: { city: 'Orange County', state: 'CA', region: 'socal' },
    isActive: true,
    scrapingFrequency: 'every-6-hours',
  },
  {
    sourceId: 'craigslist-sd-beauty',
    name: 'Craigslist San Diego - Beauty',
    url: 'https://sandiego.craigslist.org/search/bty?format=rss',
    type: 'rss',
    platform: 'craigslist',
    location: { city: 'San Diego', state: 'CA', region: 'socal' },
    isActive: true,
    scrapingFrequency: 'every-6-hours',
  },
  {
    sourceId: 'craigslist-ie-beauty',
    name: 'Craigslist Inland Empire - Beauty',
    url: 'https://inlandempire.craigslist.org/search/bty?format=rss',
    type: 'rss',
    platform: 'craigslist',
    location: { city: 'Inland Empire', state: 'CA', region: 'socal' },
    isActive: true,
    scrapingFrequency: 'every-6-hours',
  },
  {
    sourceId: 'craigslist-ventura-beauty',
    name: 'Craigslist Ventura County - Beauty',
    url: 'https://ventura.craigslist.org/search/bty?format=rss',
    type: 'rss',
    platform: 'craigslist',
    location: { city: 'Ventura', state: 'CA', region: 'socal' },
    isActive: true,
    scrapingFrequency: 'daily',
  },

  // School Job Boards - Beauty Schools
  {
    sourceId: 'paul-mitchell-la',
    name: 'Paul Mitchell School LA - Career Board',
    url: 'https://paulmitchell.edu/los-angeles/careers',
    type: 'scraper',
    platform: 'school-board',
    location: { city: 'Los Angeles', state: 'CA', region: 'socal' },
    isActive: false, // Will activate when scraper is ready
    scrapingFrequency: 'daily',
  },
  {
    sourceId: 'paul-mitchell-oc',
    name: 'Paul Mitchell School Costa Mesa - Career Board',
    url: 'https://paulmitchell.edu/costa-mesa/careers',
    type: 'scraper',
    platform: 'school-board',
    location: { city: 'Costa Mesa', state: 'CA', region: 'socal' },
    isActive: false,
    scrapingFrequency: 'daily',
  },
  {
    sourceId: 'marinello-la',
    name: 'Marinello Schools LA - Career Board',
    url: 'https://marinello.edu/careers',
    type: 'scraper',
    platform: 'school-board',
    location: { city: 'Los Angeles', state: 'CA', region: 'socal' },
    isActive: false,
    scrapingFrequency: 'daily',
  },

  // Craigslist - NorCal (for future expansion)
  {
    sourceId: 'craigslist-sf-beauty',
    name: 'Craigslist San Francisco - Beauty',
    url: 'https://sfbay.craigslist.org/search/bty?format=rss',
    type: 'rss',
    platform: 'craigslist',
    location: { city: 'San Francisco', state: 'CA', region: 'norcal' },
    isActive: false, // Activate for NorCal expansion
    scrapingFrequency: 'every-6-hours',
  },
  {
    sourceId: 'craigslist-sj-beauty',
    name: 'Craigslist San Jose - Beauty',
    url: 'https://sanjose.craigslist.org/search/bty?format=rss',
    type: 'rss',
    platform: 'craigslist',
    location: { city: 'San Jose', state: 'CA', region: 'norcal' },
    isActive: false,
    scrapingFrequency: 'every-6-hours',
  },

  // Indeed (placeholder - will need API key)
  {
    sourceId: 'indeed-la-beauty',
    name: 'Indeed LA - Beauty & Salon Jobs',
    url: 'https://www.indeed.com/jobs?q=salon+beauty&l=Los+Angeles%2C+CA',
    type: 'api',
    platform: 'indeed',
    location: { city: 'Los Angeles', state: 'CA', region: 'socal' },
    isActive: false, // Will activate when Indeed API is set up
    scrapingFrequency: 'daily',
  },
];

/**
 * Seed a single source
 */
const seedSource = async (
  db: admin.firestore.Firestore,
  source: GigSourceSeed
): Promise<void> => {
  const sourceRef = db.collection('gigSources').doc(source.sourceId);

  // Check if already exists
  const existing = await sourceRef.get();
  if (existing.exists) {
    console.log(`  ⏭️  Skipping "${source.name}" - already exists`);
    return;
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  await sourceRef.set({
    ...source,
    lastScraped: null,
    lastSuccess: null,
    gigCount: 0,
    totalGigsScraped: 0,
    errorCount: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`  ✅ Created "${source.name}"`);
};

/**
 * Main seed function
 */
const seed = async (): Promise<void> => {
  console.log('\n🌱 Seeding Gig Sources Collection\n');
  console.log('='.repeat(50));

  const db = initializeFirebase();

  console.log(`\nSeeding ${initialSources.length} sources...\n`);

  for (const source of initialSources) {
    await seedSource(db, source);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Seeding complete!\n');

  // Print summary
  const activeCount = initialSources.filter(s => s.isActive).length;
  const inactiveCount = initialSources.length - activeCount;

  console.log('Summary:');
  console.log(`  - Total sources: ${initialSources.length}`);
  console.log(`  - Active: ${activeCount}`);
  console.log(`  - Inactive: ${inactiveCount}`);
  console.log('\nSources by region:');

  const byRegion = initialSources.reduce((acc, s) => {
    acc[s.location.region] = (acc[s.location.region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(byRegion).forEach(([region, count]) => {
    console.log(`  - ${region}: ${count}`);
  });

  console.log('\nSources by platform:');

  const byPlatform = initialSources.reduce((acc, s) => {
    acc[s.platform] = (acc[s.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(byPlatform).forEach(([platform, count]) => {
    console.log(`  - ${platform}: ${count}`);
  });

  console.log('\n');
};

/**
 * Clear all sources (use with caution!)
 */
const clearSources = async (): Promise<void> => {
  console.log('\n⚠️  Clearing all gig sources...\n');

  const db = initializeFirebase();
  const sourcesRef = db.collection('gigSources');
  const snapshot = await sourcesRef.get();

  if (snapshot.empty) {
    console.log('No sources to delete.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log(`✅ Deleted ${snapshot.size} sources.\n`);
};

/**
 * List all sources
 */
const listSources = async (): Promise<void> => {
  console.log('\n📋 Listing all gig sources...\n');

  const db = initializeFirebase();
  const sourcesRef = db.collection('gigSources');
  const snapshot = await sourcesRef.orderBy('name').get();

  if (snapshot.empty) {
    console.log('No sources found.');
    return;
  }

  console.log(`Found ${snapshot.size} sources:\n`);

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const status = data.isActive ? '🟢' : '⚪';
    console.log(`${status} ${data.name}`);
    console.log(`   ID: ${data.sourceId}`);
    console.log(`   Platform: ${data.platform} | Type: ${data.type}`);
    console.log(`   Location: ${data.location.city}, ${data.location.state} (${data.location.region})`);
    console.log(`   Gigs: ${data.gigCount} active | ${data.totalGigsScraped} total`);
    console.log(`   Errors: ${data.errorCount}`);
    console.log('');
  });
};

/**
 * Main entry point
 */
const main = async (): Promise<void> => {
  const command = process.argv[2] || 'seed';

  try {
    switch (command) {
      case 'seed':
        await seed();
        break;
      case 'clear':
        await clearSources();
        break;
      case 'list':
        await listSources();
        break;
      case 'reseed':
        await clearSources();
        await seed();
        break;
      default:
        console.log('Usage: npx ts-node scripts/seedGigSources.ts [command]');
        console.log('\nCommands:');
        console.log('  seed    - Seed initial gig sources (default)');
        console.log('  list    - List all existing sources');
        console.log('  clear   - Delete all sources (careful!)');
        console.log('  reseed  - Clear and reseed all sources');
        process.exit(1);
    }
  } catch (error) {
    console.error('Operation failed:', error);
    process.exit(1);
  }
};

main();
