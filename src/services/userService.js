import {
  doc,
  collection,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from './firebase';
import { logActivity } from './activityLogService';
import {
  safeGetDoc,
  safeGetDocs,
  safeSetDoc,
  safeDeleteDoc
} from '../utils/firestoreHelper';

const USERS_COLLECTION = 'users';

const getAdminEmails = () => {
  const envEmails = import.meta.env.VITE_ADMIN_EMAILS || '';
  return envEmails
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

export const resolveUserRole = (email) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  return getAdminEmails().includes(normalizedEmail) ? 'admin' : 'user';
};

export const createUserProfile = async (uid, { email, name }) => {
  const role = resolveUserRole(email);
  const profile = {
    uid,
    email: email || '',
    name: name || '',
    role,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await safeSetDoc(doc(db, USERS_COLLECTION, uid), profile);
  } catch (error) {
    console.warn("Failed to write user profile document, offline persistence will queue this:", error.message);
  }

  try {
    await logActivity({
      userId: uid,
      userEmail: email,
      action: 'user_registered',
      details: { name, role },
    });
  } catch (error) {
    console.warn("Failed to log user registration activity offline:", error.message);
  }

  return profile;
};

export const getUserProfile = async (uid) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  try {
    const snapshot = await safeGetDoc(userRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.warn("getUserProfile getDoc failed:", error.message);
    throw error; // Propagate to let caller handle offline/timeout fallback
  }
};

export const updateUserProfile = async (uid, updates) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  try {
    await safeSetDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    }, { merge: true });

    await logActivity({
      userId: uid,
      userEmail: updates.email || '',
      action: 'profile_updated',
      details: { fields: Object.keys(updates) },
    });
  } catch (error) {
    console.warn("Failed to update user profile, offline persistence will queue this: ", error.message);
  }
};

export const ensureUserProfile = async (firebaseUser, name) => {
  let existing = null;
  let fetchFailed = false;

  try {
    existing = await getUserProfile(firebaseUser.uid);
  } catch (error) {
    console.warn("Failed to fetch existing user profile, proceeding with offline fallback profile generation:", error.message);
    fetchFailed = true;
  }

  if (fetchFailed) {
    // Return safe offline profile directly without setDoc to avoid overwriting actual server profile when coming back online.
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: name || firebaseUser.displayName || 'User',
      role: resolveUserRole(firebaseUser.email),
      status: 'active',
      isOfflineFallback: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  if (existing) {
    if (existing.status === 'deleted') return null;

    const expectedRole = resolveUserRole(firebaseUser.email);
    if (existing.role !== expectedRole) {
      const updatedProfile = {
        ...existing,
        role: expectedRole,
        updatedAt: new Date(),
      };
      try {
        await safeSetDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), updatedProfile, { merge: true });
      } catch (err) {
        console.warn("Failed to update user role, offline persistence will queue this:", err.message);
      }
      return updatedProfile;
    }

    return existing;
  }

  return createUserProfile(firebaseUser.uid, {
    email: firebaseUser.email,
    name: name || firebaseUser.displayName || '',
  });
};

export const getAllUsers = async () => {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await safeGetDocs(q);
    const users = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status !== 'deleted') {
        users.push({ id: docSnap.id, ...data });
      }
    });
    return users;
  } catch (error) {
    console.error("Failed to fetch all users:", error);
    return [];
  }
};

const deleteCollectionByUserId = async (collectionName, userId) => {
  try {
    const q = query(collection(db, collectionName), where('userId', '==', userId));
    const snapshot = await safeGetDocs(q);
    const deletions = snapshot.docs.map((docSnap) => safeDeleteDoc(docSnap.ref));
    await Promise.all(deletions);
  } catch (error) {
    console.error(`Failed to delete collection ${collectionName} for user:`, error);
  }
};

const deleteUserStorage = async (userId) => {
  try {
    const folderRef = ref(storage, `resumes/${userId}`);
    const list = await listAll(folderRef);
    await Promise.all(list.items.map((itemRef) => deleteObject(itemRef)));
  } catch (error) {
    console.warn('Storage cleanup skipped:', error.message);
  }
};

export const deleteUser = async (userId, adminUser) => {
  const userProfile = await getUserProfile(userId);
  if (!userProfile) {
    throw new Error('User not found');
  }

  if (userProfile.role === 'admin') {
    throw new Error('Cannot delete an admin account');
  }

  await deleteCollectionByUserId('resumes', userId);
  await deleteCollectionByUserId('resume_analysis', userId);
  await deleteCollectionByUserId('interview_sessions', userId);
  await deleteCollectionByUserId('job_matches', userId);
  await deleteUserStorage(userId);
  await safeDeleteDoc(doc(db, USERS_COLLECTION, userId));

  await logActivity({
    userId: adminUser.uid,
    userEmail: adminUser.email,
    action: 'user_deleted',
    details: {
      deletedUserId: userId,
      deletedUserEmail: userProfile.email,
    },
  });
};

export const getUserReport = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return null;

    const fetchByUser = async (collectionName) => {
      const q = query(collection(db, collectionName), where('userId', '==', userId));
      const snapshot = await safeGetDocs(q);
      const items = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
      return items;
    };

    const [resumes, analyses, sessions, jobMatches] = await Promise.all([
      fetchByUser('resumes'),
      fetchByUser('resume_analysis'),
      fetchByUser('interview_sessions'),
      fetchByUser('job_matches'),
    ]);

    const sortByDate = (items) =>
      [...items].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });

    const sortedAnalyses = sortByDate(analyses);
    const avgAts =
      analyses.length > 0
        ? Math.round(analyses.reduce((sum, item) => sum + (item.atsScore || 0), 0) / analyses.length)
        : 0;
    const avgInterview =
      sessions.length > 0
        ? Math.round(sessions.reduce((sum, item) => sum + (item.avgScore || 0), 0) / sessions.length)
        : 0;
    const avgJobMatch =
      jobMatches.length > 0
        ? Math.round(jobMatches.reduce((sum, item) => sum + (item.matchScore || 0), 0) / jobMatches.length)
        : 0;

    return {
      profile,
      stats: {
        resumeCount: resumes.length,
        analysisCount: analyses.length,
        sessionCount: sessions.length,
        jobMatchCount: jobMatches.length,
        avgAts,
        avgInterview,
        avgJobMatch,
      },
      latestAnalysis: sortedAnalyses[0] || null,
      recentSessions: sortByDate(sessions).slice(0, 5),
      recentJobMatches: sortByDate(jobMatches).slice(0, 5),
    };
  } catch (error) {
    console.error("Failed to generate user report:", error);
    return null;
  }
};
