import { collection, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { safeGetDocs } from '../utils/firestoreHelper';

/**
 * Download a string as a CSV file in-browser
 * @param {string} csvContent 
 * @param {string} fileName 
 */
const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export saved Job Matches to CSV
 * @param {string} userId 
 */
export const exportJobMatchesToCSV = async (userId) => {
  try {
    const q = query(collection(db, 'job_matches'), where('userId', '==', userId));
    const snapshot = await safeGetDocs(q);
    
    let csv = 'Job Title,Company,Location,Match Score,Date Calculated\n';
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const date = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : new Date(data.createdAt || 0).toLocaleDateString();
      
      // Escape commas in fields
      const title = `"${(data.jobTitle || '').replace(/"/g, '""')}"`;
      const company = `"${(data.company || '').replace(/"/g, '""')}"`;
      const location = `"${(data.location || '').replace(/"/g, '""')}"`;
      const score = data.matchScore || 0;
      
      csv += `${title},${company},${location},${score}%,${date}\n`;
    });
    
    downloadCSV(csv, `hiresense_job_matches_${Date.now()}.csv`);
  } catch (error) {
    console.error('Failed to export job matches to CSV:', error);
    throw error;
  }
};

/**
 * Export Interview Session Logs to CSV
 * @param {string} userId 
 */
export const exportInterviewSessionsToCSV = async (userId) => {
  try {
    const q = query(collection(db, 'interview_sessions'), where('userId', '==', userId));
    const snapshot = await safeGetDocs(q);
    
    let csv = 'Role,Average Score,Grade,Performance Rating,Questions Answered,Date Completed\n';
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const date = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : new Date(data.createdAt || 0).toLocaleDateString();
      
      const role = `"${(data.role || '').replace(/"/g, '""')}"`;
      const avgScore = data.avgScore || 0;
      const grade = data.grade || 'C';
      const perf = `"${(data.performance || '').replace(/"/g, '""')}"`;
      const answered = data.answeredCount || 0;
      
      csv += `${role},${avgScore}%,${grade},${perf},${answered},${date}\n`;
    });
    
    downloadCSV(csv, `hiresense_interview_sessions_${Date.now()}.csv`);
  } catch (error) {
    console.error('Failed to export interview sessions to CSV:', error);
    throw error;
  }
};
