import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from '../services/firebase';
import { updateProfile } from 'firebase/auth';
import { ensureUserProfile, getUserProfile } from '../services/userService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUserProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUserProfile(null);
      return null;
    }

    try {
      const profile = await ensureUserProfile(firebaseUser);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      console.warn("Failed to retrieve user profile from Firestore, using offline fallback:", err.message);
      const fallbackProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'User',
        role: 'user',
        status: 'active'
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await loadUserProfile(currentUser);
        } catch (err) {
          console.error("onAuthStateChanged profile load error:", err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  const signup = useCallback(async (email, password, name = '') => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
      }

      const profile = await ensureUserProfile(userCredential.user, name);
      setUser(userCredential.user);
      setUserProfile(profile);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await loadUserProfile(userCredential.user);
      setUser(userCredential.user);
      setUserProfile(profile);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadUserProfile]);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!user) return null;
    const profile = await getUserProfile(user.uid);
    setUserProfile(profile);
    return profile;
  }, [user]);

  const value = {
    user,
    userProfile,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    refreshUserProfile,
    isAuthenticated: !!user,
    isAdmin: userProfile?.role === 'admin',
    register: signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
