/**
 * Jovi Auth Store
 * Zustand store for authentication state management
 */

import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase/config';
import { UserProfile, UserType } from '../types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userType: UserType, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Fetch user profile from Firestore
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data() as UserProfile;

      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to login',
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  signUp: async (
    email: string,
    password: string,
    userType: UserType,
    displayName: string
  ) => {
    try {
      set({ isLoading: true, error: null });

      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateFirebaseProfile(userCredential.user, { displayName });

      // Create base user profile
      const baseProfile = {
        id: userCredential.user.uid,
        email,
        displayName,
        userType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to Firestore (profile will be completed later)
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      await setDoc(userDocRef, baseProfile);

      set({
        user: baseProfile as UserProfile,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to sign up',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });

      await signOut(auth);

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to logout',
        isLoading: false,
      });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });

      await sendPasswordResetEmail(auth, email);

      set({ isLoading: false, error: null });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to send reset email',
        isLoading: false,
      });
      throw error;
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    try {
      const { user } = get();
      if (!user) {
        throw new Error('No user logged in');
      }

      set({ isLoading: true, error: null });

      const updatedProfile = {
        ...user,
        ...updates,
        updatedAt: new Date(),
      };

      const userDocRef = doc(firestore, 'users', user.id);
      await updateDoc(userDocRef, updates as Record<string, any>);

      set({
        user: updatedProfile,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update profile',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setUser: (user: UserProfile | null) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },
}));

// Firebase auth state listener
// Call this in your App.tsx on mount
export const initializeAuthListener = () => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Fetch full user profile from Firestore
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          useAuthStore.getState().setUser(userData);
        } else {
          useAuthStore.getState().setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        useAuthStore.getState().setUser(null);
      }
    } else {
      useAuthStore.getState().setUser(null);
    }
  });
};
