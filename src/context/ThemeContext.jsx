import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { doc } from 'firebase/firestore';
import { safeUpdateDoc } from '../utils/firestoreHelper';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user, userProfile, refreshUserProfile } = useAuth() || {};
  const [theme, setThemeState] = useState(() => {
    const localTheme = localStorage.getItem('theme');
    if (localTheme) return localTheme;
    return 'system';
  });

  const applyTheme = (targetTheme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (targetTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(targetTheme);
    }
  };

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync theme with Firestore user profile if logged in
  useEffect(() => {
    if (userProfile?.theme && userProfile.theme !== theme) {
      setThemeState(userProfile.theme);
    }
  }, [userProfile]);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await safeUpdateDoc(userRef, {
          theme: newTheme,
          updatedAt: new Date()
        });
        if (refreshUserProfile) {
          await refreshUserProfile();
        }
      } catch (error) {
        console.error('Failed to sync theme to Firestore:', error);
      }
    }
  };

  // Listen for system theme changes if theme is set to 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
