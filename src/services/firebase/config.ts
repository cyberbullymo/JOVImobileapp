/**
 * Firebase Configuration
 * Using the JavaScript Firebase SDK for Expo Go compatibility
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAByqoRWGL0m-xiv2dowAWIKXJX_XFNtnM',
  authDomain: 'jovi-10873.firebaseapp.com',
  projectId: 'jovi-10873',
  storageBucket: 'jovi-10873.firebasestorage.app',
  messagingSenderId: '502037763802',
  appId: '1:502037763802:android:bf50f6089eb751c144b7e3',
};

// Initialize Firebase (prevent re-initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export Firebase instances
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  GIGS: 'gigs',
  APPLICATIONS: 'applications',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  PORTFOLIO: 'portfolio',
} as const;
