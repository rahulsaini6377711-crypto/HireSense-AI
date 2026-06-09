import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { FiArrowRight, FiLoader } from 'react-icons/fi';
import ResumeUploadZone from '../components/ResumeUploadZone';
import ResumePreview from '../components/ResumePreview';
import { uploadResume, getUserResumes, saveAnalysisResult } from '../services/resumeStorage';
import { extractResumeInfo } from '../services/resumeParser';
import { analyzeResume } from '../services/aiAnalyzer';
import AtsScoreCard from '../components/AtsScoreCard';


const ResumeAnalysis = () => {
  const { user } = useAuth();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedResume, setParsedResume] = useState(null);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userResumes, setUserResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');

  // Load user's resumes on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserResumes();
    }
  }, [user]);

  const loadUserResumes = async () => {
    try {
      setLoadingResumes(true);
      const resumes = await getUserResumes(user.uid);
      setUserResumes(resumes);
    } catch (error) {
      console.error('Error loading resumes:', error);
      toast.error('Failed to load your resumes');
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleFileSelect = (file) => {
    setUploadedFile(file);
    // Reset previous analysis when a new file is selected
    setParsedResume(null);
    setExtractedInfo(null);
    setAnalysisResult(null);
  };

  const handleParseComplete = async (resumeData) => {
    setParsedResume(resumeData);

    // Extract key information
    const info = extractResumeInfo(resumeData.text);
    setExtractedInfo(info);

    // Compute local AI analysis
    try {
      const analysis = analyzeResume(resumeData.text);
      setAnalysisResult(analysis);

      // Try to upload to Firebase
      if (user?.uid) {
        await handleUploadToFirebase(resumeData, analysis);
      }
    } catch (err) {
      console.error('Error running AI Resume analysis:', err);
      toast.error('Failed to compute resume analysis report.');
    }
  };

  const handleUploadToFirebase = async (resumeData, analysis = null) => {
    if (!uploadedFile || !user?.uid) return;

    try {
      setIsUploading(true);
      // Upload PDF file to storage and log metadata in resumes collection
      await uploadResume(uploadedFile, user.uid, resumeData);
      
      // Save computed AI Analysis to Firestore resume_analysis collection
      const targetAnalysis = analysis || analysisResult || analyzeResume(resumeData.text);
      await saveAnalysisResult(user.uid, targetAnalysis);
      
      toast.success('Resume and AI Analysis saved successfully!');
      
      // Reload user resumes
      await loadUserResumes();
    } catch (error) {
      console.error('Error uploading resume and analysis:', error);
      toast.error(error.message || 'Failed to save resume analysis');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualUpload = async () => {
    if (!parsedResume || !uploadedFile || !user?.uid) {
      toast.error('Please upload and parse a resume first');
      return;
    }

    await handleUploadToFirebase(parsedResume);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <span className="text-2xl">📄</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Resume Analysis
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Upload and analyze your resume with AI
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tabs */}
            <div className="flex gap-2 bg-white/50 dark:bg-gray-800/50 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all relative ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                History
                {userResumes.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {userResumes.length}
                  </span>
                )}
              </button>
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Upload Zone */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Upload Your Resume
                  </h2>
                  <ResumeUploadZone
                    onFileSelect={handleFileSelect}
                    onParseComplete={handleParseComplete}
                    isLoading={isUploading}
                  />
                </div>

                {/* Preview */}
                {parsedResume && (
                  <div className="space-y-8">
                    {analysisResult && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          AI Analysis Report
                        </h2>
                        <AtsScoreCard analysis={analysisResult} />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Resume Preview
                        </h2>
                        <button
                          onClick={handleManualUpload}
                          disabled={isUploading}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
                        >
                          {isUploading ? (
                            <>
                              <FiLoader className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              Save Resume
                              <FiArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                      <ResumePreview
                        resumeData={parsedResume}
                        fileName={uploadedFile?.name}
                        fileSize={uploadedFile?.size}
                        uploadedAt={parsedResume.uploadedAt}
                        extractedInfo={extractedInfo}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {loadingResumes ? (
                  <div className="flex items-center justify-center py-12">
                    <FiLoader className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : userResumes.length === 0 ? (
                  <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-2xl">
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      No resumes uploaded yet
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                      Upload your first resume to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userResumes.map((resume) => (
                      <motion.div
                        key={resume.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {resume.originalFileName}
                            </h3>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>📄 {resume.pageCount} pages</span>
                              <span>💾 {(resume.fileSize / 1024).toFixed(2)} KB</span>
                              <span>📅 {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <a
                            href={resume.storageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                          >
                            View
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                How It Works
              </h3>
              <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-blue-600 dark:text-blue-400">
                    1
                  </span>
                  <span>Upload your PDF resume</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-blue-600 dark:text-blue-400">
                    2
                  </span>
                  <span>We extract and analyze the content</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-blue-600 dark:text-blue-400">
                    3
                  </span>
                  <span>View insights and recommendations</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-bold text-blue-600 dark:text-blue-400">
                    4
                  </span>
                  <span>Save to your account for later</span>
                </li>
              </ol>
            </motion.div>

            {/* Features Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Features
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">✨</span>
                  <span>AI-powered text extraction</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">🔍</span>
                  <span>Automatic skill detection</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">📊</span>
                  <span>Contact info extraction</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">💾</span>
                  <span>Secure cloud storage</span>
                </li>
              </ul>
            </motion.div>

            {/* Requirements Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Requirements
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  PDF format only
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Max 10 MB file size
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Clear, readable text
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  No image-only PDFs
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysis;
