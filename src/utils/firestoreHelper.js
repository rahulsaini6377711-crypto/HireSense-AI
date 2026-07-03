import {
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocFromCache,
  getDocsFromCache,
  doc as getDocRef
} from 'firebase/firestore';

/**
 * Wraps a promise in a timeout that rejects after the specified milliseconds.
 */
const withTimeout = (promise, ms, errorMessage = "Operation timed out") => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

/**
 * Retries a function with exponential backoff.
 */
const withRetry = async (fn, retries = 3, delay = 200) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // If client is offline, don't retry online operations; fail fast to cache
      if (
        typeof navigator !== 'undefined' && !navigator.onLine ||
        err.message?.toLowerCase().includes('offline') ||
        err.message?.toLowerCase().includes('unavailable') ||
        err.code === 'unavailable'
      ) {
        throw err;
      }
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};

/**
 * Safely fetches a single document, falling back to cache if offline or timed out.
 */
export const safeGetDoc = async (docRef, timeoutMs = 4000) => {
  try {
    return await withTimeout(
      withRetry(() => getDoc(docRef)),
      timeoutMs,
      "Firestore read timed out"
    );
  } catch (error) {
    console.warn(`safeGetDoc failed or timed out: ${error.message}. Attempting cache fallback...`);
    try {
      const cacheSnap = await getDocFromCache(docRef);
      console.log(`Successfully retrieved document from cache: ${docRef.id}`);
      return cacheSnap;
    } catch (cacheError) {
      console.error(`Failed to read document from cache: ${cacheError.message}`);
      throw error; // Throw original error so caller knows server/cache both failed
    }
  }
};

/**
 * Safely fetches multiple documents, falling back to cache if offline or timed out.
 */
export const safeGetDocs = async (queryRef, timeoutMs = 4000) => {
  try {
    return await withTimeout(
      withRetry(() => getDocs(queryRef)),
      timeoutMs,
      "Firestore query timed out"
    );
  } catch (error) {
    console.warn(`safeGetDocs failed or timed out: ${error.message}. Attempting cache fallback...`);
    try {
      const cacheSnap = await getDocsFromCache(queryRef);
      console.log(`Successfully retrieved query results from cache`);
      return cacheSnap;
    } catch (cacheError) {
      console.error(`Failed to read query from cache: ${cacheError.message}`);
      throw error;
    }
  }
};

/**
 * Safely sets a document, falling back to offline persistence queue if server write hangs.
 */
export const safeSetDoc = async (docRef, data, options = {}, timeoutMs = 4000) => {
  try {
    await withTimeout(
      withRetry(() => setDoc(docRef, data, options)),
      timeoutMs,
      "Firestore setDoc timed out"
    );
    return { success: true, queuedOffline: false };
  } catch (error) {
    console.warn(`safeSetDoc failed or timed out: ${error.message}. Relying on offline persistence.`);
    // Since offline cache persistence is enabled, Firestore will sync this write when online.
    // Resolve successfully to allow user to continue in the UI.
    return { success: true, queuedOffline: true };
  }
};

/**
 * Safely updates a document, falling back to offline persistence queue if server write hangs.
 */
export const safeUpdateDoc = async (docRef, data, timeoutMs = 4000) => {
  try {
    await withTimeout(
      withRetry(() => updateDoc(docRef, data)),
      timeoutMs,
      "Firestore updateDoc timed out"
    );
    return { success: true, queuedOffline: false };
  } catch (error) {
    console.warn(`safeUpdateDoc failed or timed out: ${error.message}. Relying on offline persistence.`);
    return { success: true, queuedOffline: true };
  }
};

/**
 * Safely deletes a document, falling back to offline persistence queue if server write hangs.
 */
export const safeDeleteDoc = async (docRef, timeoutMs = 4000) => {
  try {
    await withTimeout(
      withRetry(() => deleteDoc(docRef)),
      timeoutMs,
      "Firestore deleteDoc timed out"
    );
    return { success: true, queuedOffline: false };
  } catch (error) {
    console.warn(`safeDeleteDoc failed or timed out: ${error.message}. Relying on offline persistence.`);
    return { success: true, queuedOffline: true };
  }
};

/**
 * Safely adds a document to a collection by generating the doc reference synchronously 
 * and using setDoc internally, guaranteeing a valid ID even when offline.
 */
export const safeAddDoc = async (collectionRef, data, timeoutMs = 4000) => {
  const newDocRef = getDocRef(collectionRef);
  const result = await safeSetDoc(newDocRef, data, {}, timeoutMs);
  return {
    id: newDocRef.id,
    path: newDocRef.path,
    ref: newDocRef,
    ...result
  };
};
