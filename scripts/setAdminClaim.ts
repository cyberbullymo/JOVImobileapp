/**
 * Set Admin Claim Script
 *
 * This script sets or removes the admin custom claim for Firebase users.
 * Run with: npx ts-node scripts/setAdminClaim.ts <email>
 *
 * Prerequisites:
 * - Firebase Admin SDK credentials (service account JSON)
 * - Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 *   OR place serviceAccountKey.json in project root
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin SDK
const initializeFirebase = (): admin.auth.Auth => {
  if (admin.apps && admin.apps.length > 0) {
    return admin.auth();
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

  return admin.auth();
};

/**
 * Set admin claim for a user by email
 */
const setAdminClaim = async (email: string): Promise<void> => {
  const auth = initializeFirebase();

  console.log(`\n🔍 Looking up user: ${email}`);

  const user = await auth.getUserByEmail(email);
  console.log(`   Found user: ${user.displayName || '(no display name)'}`);
  console.log(`   UID: ${user.uid}`);

  // Check current claims
  const currentClaims = user.customClaims || {};
  console.log(`   Current claims:`, currentClaims);

  if (currentClaims.admin === true) {
    console.log(`\n⚠️  User already has admin claim.`);
    return;
  }

  // Set admin claim
  await auth.setCustomUserClaims(user.uid, { ...currentClaims, admin: true });

  console.log(`\n✅ Admin claim set for ${email}`);
  console.log(`\n⚠️  IMPORTANT: The user must sign out and sign back in for the claim to take effect.`);
};

/**
 * Remove admin claim from a user by email
 */
const removeAdminClaim = async (email: string): Promise<void> => {
  const auth = initializeFirebase();

  console.log(`\n🔍 Looking up user: ${email}`);

  const user = await auth.getUserByEmail(email);
  console.log(`   Found user: ${user.displayName || '(no display name)'}`);
  console.log(`   UID: ${user.uid}`);

  const currentClaims = user.customClaims || {};

  if (!currentClaims.admin) {
    console.log(`\n⚠️  User does not have admin claim.`);
    return;
  }

  // Remove admin claim
  const { admin: _, ...remainingClaims } = currentClaims;
  await auth.setCustomUserClaims(user.uid, remainingClaims);

  console.log(`\n✅ Admin claim removed from ${email}`);
  console.log(`\n⚠️  IMPORTANT: The user must sign out and sign back in for the change to take effect.`);
};

/**
 * List all admin users
 */
const listAdmins = async (): Promise<void> => {
  const auth = initializeFirebase();

  console.log(`\n📋 Listing all admin users...\n`);

  let admins: admin.auth.UserRecord[] = [];
  let nextPageToken: string | undefined;

  do {
    const result = await auth.listUsers(1000, nextPageToken);
    const adminUsers = result.users.filter(
      user => user.customClaims?.admin === true
    );
    admins = [...admins, ...adminUsers];
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  if (admins.length === 0) {
    console.log('No admin users found.');
    return;
  }

  console.log(`Found ${admins.length} admin user(s):\n`);

  admins.forEach(user => {
    console.log(`  👤 ${user.email}`);
    console.log(`     Name: ${user.displayName || '(not set)'}`);
    console.log(`     UID: ${user.uid}`);
    console.log('');
  });
};

/**
 * Check if a user has admin claim
 */
const checkAdmin = async (email: string): Promise<void> => {
  const auth = initializeFirebase();

  console.log(`\n🔍 Checking admin status for: ${email}`);

  const user = await auth.getUserByEmail(email);
  const isAdmin = user.customClaims?.admin === true;

  console.log(`\n   Email: ${user.email}`);
  console.log(`   Name: ${user.displayName || '(not set)'}`);
  console.log(`   UID: ${user.uid}`);
  console.log(`   Admin: ${isAdmin ? '✅ Yes' : '❌ No'}`);
  console.log(`   All claims:`, user.customClaims || {});
};

/**
 * Print usage instructions
 */
const printUsage = (): void => {
  console.log('\nUsage: npx ts-node scripts/setAdminClaim.ts <command> [email]');
  console.log('\nCommands:');
  console.log('  set <email>     - Grant admin access to user');
  console.log('  remove <email>  - Remove admin access from user');
  console.log('  check <email>   - Check if user has admin access');
  console.log('  list            - List all admin users');
  console.log('\nExamples:');
  console.log('  npx ts-node scripts/setAdminClaim.ts set user@example.com');
  console.log('  npx ts-node scripts/setAdminClaim.ts remove user@example.com');
  console.log('  npx ts-node scripts/setAdminClaim.ts check user@example.com');
  console.log('  npx ts-node scripts/setAdminClaim.ts list');
};

/**
 * Main entry point
 */
const main = async (): Promise<void> => {
  const command = process.argv[2];
  const email = process.argv[3];

  try {
    switch (command) {
      case 'set':
        if (!email) {
          console.error('❌ Email is required for set command');
          printUsage();
          process.exit(1);
        }
        await setAdminClaim(email);
        break;

      case 'remove':
        if (!email) {
          console.error('❌ Email is required for remove command');
          printUsage();
          process.exit(1);
        }
        await removeAdminClaim(email);
        break;

      case 'check':
        if (!email) {
          console.error('❌ Email is required for check command');
          printUsage();
          process.exit(1);
        }
        await checkAdmin(email);
        break;

      case 'list':
        await listAdmins();
        break;

      default:
        // Backwards compatible: if first arg is an email, treat as 'set'
        if (command && command.includes('@')) {
          await setAdminClaim(command);
        } else {
          printUsage();
          process.exit(1);
        }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('no user record')) {
        console.error(`\n❌ User not found: ${email || command}`);
        console.error('   Make sure the user has signed up first.\n');
      } else {
        console.error('\n❌ Error:', error.message);
      }
    } else {
      console.error('\n❌ Error:', error);
    }
    process.exit(1);
  }
};

main();
