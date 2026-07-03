import { collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { safeAddDoc, safeGetDocs } from '../utils/firestoreHelper';

const ACTIVITY_LOGS_COLLECTION = 'activity_logs';

export const logActivity = async ({ userId, userEmail, action, details = {} }) => {
  try {
    await safeAddDoc(collection(db, ACTIVITY_LOGS_COLLECTION), {
      userId: userId || 'system',
      userEmail: userEmail || '',
      action,
      details,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const getActivityLogs = async (maxEntries = 100) => {
  try {
    const q = query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(maxEntries)
    );
    const snapshot = await safeGetDocs(q);
    const logs = [];
    snapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...docSnap.data() });
    });
    return logs;
  } catch (error) {
    console.error('Failed to get activity logs:', error);
    return [];
  }
};
