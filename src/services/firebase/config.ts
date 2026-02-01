/**
 * Firebase Configuration
 * Using the JavaScript Firebase SDK for Expo Go compatibility
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
// @ts-expect-error - getReactNativePersistence is exported in RN bundle but not in types
import { initializeAuth, getAuth, getReactNativePersistence } from '@firebase/auth';
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

// Initialize Firebase Auth with React Native persistence
export const auth = getApps().length === 1
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  GIGS: 'gigs',
  GIG_SOURCES: 'gigSources',
  APPLICATIONS: 'applications',
  APPLICATION_ATTEMPTS: 'applicationAttempts',
  USER_APPLICATIONS: 'userApplications',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  PORTFOLIO: 'portfolio',
} as const;
