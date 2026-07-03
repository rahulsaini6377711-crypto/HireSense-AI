import { auth, db, storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, doc, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { logActivity } from './activityLogService';
import {
  safeGetDoc,
  safeGetDocs,
  safeUpdateDoc,
  safeDeleteDoc,
  safeAddDoc
} from '../utils/firestoreHelper';

/**
 * Upload resume to Firebase Storage and save metadata to Firestore
 * @param {File} file - The PDF file to upload
 * @param {string} userId - The user's ID
 * @param {Object} resumeData - Parsed resume data
 * @returns {Promise<Object>} Resume document data with ID
 */
export const uploadResume = async (file, userId, resumeData, onProgress = null) => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    if (userId !== auth.currentUser.uid) {
      throw new Error('User ID mismatch');
    }

    // Upload to Firebase Storage using resumable upload
    const timestamp = Date.now();
    const storagePath = `resumes/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    if (onProgress) {
      uploadTask.on('state_changed', (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(pct);
      });
    }

    const snapshot = await uploadTask;
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save metadata to Firestore using safeAddDoc
    const resumesCollection = collection(db, 'resumes');
    const resumeDoc = await safeAddDoc(resumesCollection, {
      userId,
      fileName: resumeData.fileName,
      originalFileName: file.name,
      pageCount: resumeData.pageCount,
      fileSize: resumeData.fileSize,
      resumeText: resumeData.text,
      storageUrl: downloadURL,
      storagePath,
      uploadedAt: new Date(resumeData.uploadedAt),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await logActivity({
      userId,
      userEmail: auth.currentUser.email,
      action: 'resume_uploaded',
      details: { resumeId: resumeDoc.id, fileName: file.name },
    });

    return {
      id: resumeDoc.id,
      ...resumeData,
      storageUrl: downloadURL,
      storagePath
    };
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
};

/**
 * Get user's resumes from Firestore
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of resume documents
 */
export const getUserResumes = async (userId) => {
  try {
    const resumesCollection = collection(db, 'resumes');
    const q = query(resumesCollection, where('userId', '==', userId));
    const querySnapshot = await safeGetDocs(q);

    const resumes = [];
    querySnapshot.forEach((doc) => {
      resumes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return resumes;
  } catch (error) {
    console.error('Error fetching resumes:', error);
    throw error;
  }
};

/**
 * Get a specific resume by ID
 * @param {string} resumeId - The resume document ID
 * @returns {Promise<Object>} Resume document data
 */
export const getResume = async (resumeId) => {
  try {
    const resumeRef = doc(db, 'resumes', resumeId);
    const resumeSnapshot = await safeGetDoc(resumeRef);

    if (!resumeSnapshot.exists()) {
      throw new Error('Resume not found');
    }

    return {
      id: resumeSnapshot.id,
      ...resumeSnapshot.data()
    };
  } catch (error) {
    console.error('Error fetching resume:', error);
    throw error;
  }
};

/**
 * Delete a resume from Firebase Storage and Firestore
 * @param {string} resumeId - The resume document ID
 * @param {string} storagePath - The storage path of the file
 * @returns {Promise<void>}
 */
export const deleteResume = async (resumeId, storagePath) => {
  try {
    // Delete from Storage
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    // Delete from Firestore
    const resumeRef = doc(db, 'resumes', resumeId);
    await safeDeleteDoc(resumeRef);

    toast.success('Resume deleted successfully');
  } catch (error) {
    console.error('Error deleting resume:', error);
    throw error;
  }
};

/**
 * Update resume metadata in Firestore
 * @param {string} resumeId - The resume document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateResumeMetadata = async (resumeId, updates) => {
  try {
    const resumeRef = doc(db, 'resumes', resumeId);
    await safeUpdateDoc(resumeRef, {
      ...updates,
      updatedAt: new Date()
    });

    toast.success('Resume updated successfully');
  } catch (error) {
    console.error('Error updating resume:', error);
    throw error;
  }
};

/**
 * Save resume analysis result in Firestore
 * @param {string} userId - The user's ID
 * @param {Object} analysisData - Detailed analysis data
 * @returns {Promise<string>} Created document ID
 */
export const saveAnalysisResult = async (userId, analysisData, fileName = 'Resume') => {
  try {
    const analysisCollection = collection(db, 'resume_analysis');
    const docRef = await safeAddDoc(analysisCollection, {
      userId,
      fileName,
      atsScore: analysisData.atsScore,
      overallRating: analysisData.overallRating,
      strengths: analysisData.strengths,
      weaknesses: analysisData.weaknesses,
      skills: analysisData.detectedSkills,
      missingSkills: analysisData.missingSkills,
      suggestions: analysisData.improvementSuggestions,
      recommendedProjects: analysisData.recommendedProjects,
      recommendedCertifications: analysisData.recommendedCertifications,
      createdAt: new Date(),
    });

    await logActivity({
      userId,
      userEmail: auth.currentUser?.email,
      action: 'analysis_saved',
      details: { analysisId: docRef.id, atsScore: analysisData.atsScore, fileName },
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving analysis result:', error);
    throw error;
  }
};

/**
 * Get latest resume analysis result for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} Latest analysis data or null
 */
export const getLatestAnalysisResult = async (userId) => {
  try {
    const analysisCollection = collection(db, 'resume_analysis');
    const q = query(analysisCollection, where('userId', '==', userId));
    const querySnapshot = await safeGetDocs(q);

    const reports = [];
    querySnapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (reports.length === 0) return null;

    // Sort by createdAt descending (client-side to bypass Firebase index requirement)
    reports.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    return reports[0];
  } catch (error) {
    console.error('Error fetching latest analysis result:', error);
    throw error;
  }
};

/**
 * Save an interview session result to Firestore
 * @param {string} userId - The user's ID
 * @param {Object} sessionData - Session data including questions, answers, scores
 * @returns {Promise<string>} Created document ID
 */
export const saveInterviewSession = async (userId, sessionData) => {
  try {
    const sessionsCollection = collection(db, 'interview_sessions');
    const docRef = await safeAddDoc(sessionsCollection, {
      userId,
      role: sessionData.role || 'general',
      avgScore: sessionData.avgScore || 0,
      grade: sessionData.grade || 'N/A',
      performance: sessionData.performance || '',
      answeredCount: sessionData.answeredCount || 0,
      strongAnswers: sessionData.strongAnswers || 0,
      weakAnswers: sessionData.weakAnswers || 0,
      topScore: sessionData.topScore || 0,
      lowestScore: sessionData.lowestScore || 0,
      answers: sessionData.answers || [],
      durationSeconds: sessionData.durationSeconds || 0,
      createdAt: new Date(),
    });

    await logActivity({
      userId,
      userEmail: auth.currentUser?.email,
      action: 'interview_completed',
      details: { sessionId: docRef.id, role: sessionData.role, avgScore: sessionData.avgScore },
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving interview session:', error);
    throw error;
  }
};

/**
 * Get all interview sessions for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of session documents
 */
export const getUserInterviewSessions = async (userId) => {
  try {
    const sessionsCollection = collection(db, 'interview_sessions');
    const q = query(sessionsCollection, where('userId', '==', userId));
    const querySnapshot = await safeGetDocs(q);

    const sessions = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() });
    });

    sessions.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    return sessions;
  } catch (error) {
    console.error('Error fetching interview sessions:', error);
    throw error;
  }
};

/**
 * Save a job match result to Firestore
 * @param {string} userId - The user's ID
 * @param {Object} matchData - Job match data
 * @returns {Promise<string>} Created document ID
 */
export const saveJobMatch = async (userId, matchData) => {
  try {
    const matchesCollection = collection(db, 'job_matches');
    const docRef = await safeAddDoc(matchesCollection, {
      userId,
      jobTitle: matchData.jobTitle || '',
      company: matchData.company || '',
      location: matchData.location || '',
      matchScore: matchData.matchScore || 0,
      matchedSkills: matchData.matchedSkills || [],
      missingSkills: matchData.missingSkills || [],
      createdAt: new Date(),
    });

    await logActivity({
      userId,
      userEmail: auth.currentUser?.email,
      action: 'job_match_calculated',
      details: {
        matchId: docRef.id,
        jobTitle: matchData.jobTitle,
        matchScore: matchData.matchScore,
      },
    });

    return docRef.id;
  } catch (error) {
    console.error('Error saving job match:', error);
    throw error;
  }
};

/**
 * Get all job matches for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of job match documents
 */
export const getUserJobMatches = async (userId) => {
  try {
    const matchesCollection = collection(db, 'job_matches');
    const q = query(matchesCollection, where('userId', '==', userId));
    const querySnapshot = await safeGetDocs(q);

    const matches = [];
    querySnapshot.forEach((docSnap) => {
      matches.push({ id: docSnap.id, ...docSnap.data() });
    });

    matches.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    return matches;
  } catch (error) {
    console.error('Error fetching job matches:', error);
    throw error;
  }
};

/**
 * Get all resume analysis results for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of analysis documents
 */
export const getUserAnalyses = async (userId) => {
  try {
    const analysisCollection = collection(db, 'resume_analysis');
    const q = query(analysisCollection, where('userId', '==', userId));
    const querySnapshot = await safeGetDocs(q);

    const analyses = [];
    querySnapshot.forEach((doc) => {
      analyses.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by createdAt descending
    analyses.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    return analyses;
  } catch (error) {
    console.error('Error fetching user analyses:', error);
    throw error;
  }
};

/**
 * Delete a resume analysis report
 * @param {string} analysisId - The analysis document ID
 * @returns {Promise<void>}
 */
export const deleteAnalysis = async (analysisId) => {
  try {
    const analysisRef = doc(db, 'resume_analysis', analysisId);
    await safeDeleteDoc(analysisRef);
    toast.success('Analysis report deleted successfully');
  } catch (error) {
    console.error('Error deleting analysis:', error);
    throw error;
  }
};
