import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { FiArrowRight, FiLoader, FiDownload, FiMail, FiTrash2, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import ResumeUploadZone from '../components/ResumeUploadZone';
import ResumePreview from '../components/ResumePreview';
import { uploadResume, getUserResumes, saveAnalysisResult, getUserAnalyses, deleteAnalysis } from '../services/resumeStorage';
import { extractResumeInfo } from '../services/resumeParser';
import { analyzeResumeWithGemini } from '../services/geminiService';
import AtsScoreCard from '../components/AtsScoreCard';
import EmailReportModal from '../components/EmailReportModal';
import { generateResumeAnalysisPDF } from '../utils/pdfGenerator';
import { useNotifications } from '../hooks/useNotifications';
import { useSEO } from '../hooks/useSEO';

const ResumeAnalysis = () => {
  useSEO('Resume Analysis', 'Upload your PDF resume to perform deep ATS scanning and matching.');
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedResume, setParsedResume] = useState(null);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userResumes, setUserResumes] = useState([]);
  const [userAnalyses, setUserAnalyses] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');
  
  // Progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  
  // History report viewer states
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Load user's resumes and analysis reports on mount, plus cached parsed resume
  useEffect(() => {
    if (user?.uid) {
      loadUserResumes();
      
      const cached = localStorage.getItem(`hiresense_parsed_resume_${user.uid}`);
      if (cached) {
        try {
          const { parsed, info, analysis, fileSelect } = JSON.parse(cached);
          setParsedResume(parsed);
          setExtractedInfo(info);
          setAnalysisResult(analysis);
          if (fileSelect) {
            setUploadedFile(fileSelect);
          }
        } catch (e) {
          console.error("Error loading cached parsed resume:", e);
        }
      }
    }
  }, [user]);

  const loadUserResumes = async () => {
    try {
      setLoadingResumes(true);
      const [resumes, analyses] = await Promise.all([
        getUserResumes(user.uid),
        getUserAnalyses(user.uid)
      ]);
      setUserResumes(resumes);
      setUserAnalyses(analyses);
    } catch (error) {
      console.error('Error loading resumes and analyses:', error);
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
    if (user?.uid) {
      localStorage.removeItem(`hiresense_parsed_resume_${user.uid}`);
    }
  };

  const handleParseComplete = async (resumeData) => {
    setParsedResume(resumeData);

    // Extract key information
    const info = extractResumeInfo(resumeData.text);
    setExtractedInfo(info);

    // Compute local AI analysis
    try {
      const analysis = await analyzeResumeWithGemini(resumeData.text);
      setAnalysisResult(analysis);

      // Cache parsed resume
      if (user?.uid) {
        localStorage.setItem(
          `hiresense_parsed_resume_${user.uid}`,
          JSON.stringify({
            parsed: resumeData,
            info,
            analysis,
            fileSelect: uploadedFile ? { name: uploadedFile.name, size: uploadedFile.size, type: uploadedFile.type } : null
          })
        );
        
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
      setStatusText('Uploading resume file to secure storage...');
      setUploadProgress(0);
      
      // Upload PDF file to storage and log metadata in resumes collection with progress listener
      await uploadResume(uploadedFile, user.uid, resumeData, (pct) => {
        setUploadProgress(pct);
      });
      
      setStatusText('Saving AI analysis report to database...');
      setUploadProgress(95);
      
      // Save computed AI Analysis to Firestore resume_analysis collection
      const targetAnalysis = analysis || analysisResult || await analyzeResumeWithGemini(resumeData.text);
      await saveAnalysisResult(user.uid, targetAnalysis, uploadedFile.name);
      
      setUploadProgress(100);
      toast.success('Resume and AI Analysis saved successfully!');
      addNotification(
        'Resume Analyzed',
        `Your resume "${uploadedFile.name}" has been successfully uploaded and analyzed.`,
        'success'
      );
      
      // Reload user resumes
      await loadUserResumes();
    } catch (error) {
      console.error('Error uploading resume and analysis:', error);
      toast.error(error.message || 'Failed to save resume analysis');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setStatusText('');
    }
  };

  const handleManualUpload = async () => {
    if (!parsedResume || !uploadedFile || !user?.uid) {
      toast.error('Please upload and parse a resume first');
      return;
    }

    await handleUploadToFirebase(parsedResume);
  };

  const handleDeleteReport = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis report?')) return;
    try {
      await deleteAnalysis(id);
      addNotification('Report Deleted', 'A resume analysis report has been removed.', 'info');
      await loadUserResumes();
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }
    } catch (err) {
      toast.error('Failed to delete report');
    }
  };

  // Map analysis database fields to match AtsScoreCard expectations
  const getNormalizedAnalysis = (report) => {
    if (!report) return null;
    return {
      ...report,
      detectedSkills: report.skills || report.detectedSkills || [],
      improvementSuggestions: report.suggestions || report.improvementSuggestions || [],
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-12">
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
                onClick={() => {
                  setActiveTab('upload');
                  setSelectedAnalysis(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Upload & Parse
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all relative ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Saved Analyses
                {userAnalyses.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-550 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {userAnalyses.length}
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
                    externalProgress={isUploading ? uploadProgress : null}
                    externalStatus={isUploading ? statusText : null}
                  />
                </div>

                {/* Preview */}
                {parsedResume && (
                  <div className="space-y-8">
                    {analysisResult && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            AI Analysis Report
                          </h2>
                          <div className="flex gap-2">
                            <button
                              onClick={() => generateResumeAnalysisPDF(analysisResult, uploadedFile?.name + '_analysis.pdf')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-xs font-bold rounded-lg border border-gray-250 dark:border-gray-750 transition"
                            >
                              <FiDownload /> PDF
                            </button>
                            <button
                              onClick={() => setIsEmailModalOpen(true)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-xs font-bold rounded-lg border border-gray-250 dark:border-gray-750 transition"
                            >
                              <FiMail /> Email
                            </button>
                          </div>
                        </div>
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
                className="space-y-6"
              >
                {!selectedAnalysis ? (
                  /* History List */
                  loadingResumes ? (
                    <div className="flex items-center justify-center py-12">
                      <FiLoader className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : userAnalyses.length === 0 ? (
                    <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-2xl">
                      <p className="text-gray-600 dark:text-gray-400 text-lg font-bold">
                        No saved analyses found
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        Upload your first resume in the tab above to log report details.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userAnalyses.map((report) => {
                        const date = report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : new Date(report.createdAt || 0).toLocaleDateString();
                        const matchingResume = userResumes.find(r => r.originalFileName === report.fileName || r.fileName === report.fileName);
                        return (
                          <motion.div
                            key={report.id}
                            whileHover={{ y: -2 }}
                            onClick={() => setSelectedAnalysis(report)}
                            className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700/80 p-5 hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                {report.fileName || 'Resume Report'}
                              </h3>
                              <div className="flex flex-wrap gap-3 mt-2 text-xs font-semibold text-gray-550 dark:text-gray-450">
                                <span>📅 Analyzed: {date}</span>
                                <span>🎯 Overall: {report.overallRating || 'N/A'}</span>
                                <span>🛠️ Skills detected: {report.skills?.length || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                              <div className="flex flex-col items-center">
                                <span className={`text-2xl font-black ${
                                  report.atsScore >= 85 ? 'text-emerald-500' : report.atsScore >= 65 ? 'text-blue-500' : 'text-rose-500'
                                }`}>
                                  {report.atsScore}%
                                </span>
                                <span className="text-[9px] uppercase tracking-wider text-gray-450 font-bold">ATS Score</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {matchingResume && (
                                  <a
                                    href={matchingResume.storageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-lg border border-emerald-250 dark:border-emerald-900/30 transition flex items-center justify-center"
                                    title="Download Original Resume PDF"
                                    style={{ height: '34px', width: '34px' }}
                                  >
                                    📄
                                  </a>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateResumeAnalysisPDF(getNormalizedAnalysis(report), report.fileName + '_report.pdf');
                                  }}
                                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-750 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition"
                                  title="Download Report PDF"
                                >
                                  <FiDownload size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteReport(e, report.id)}
                                  className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/30 transition"
                                  title="Delete Report"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* Detail Report View */
                  <div className="space-y-6">
                    {(() => {
                      const matchingResume = userResumes.find(r => r.originalFileName === selectedAnalysis.fileName || r.fileName === selectedAnalysis.fileName);
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-750 pb-4">
                          <button
                            onClick={() => setSelectedAnalysis(null)}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                          >
                            <FiArrowLeft /> Back to Saved Lists
                          </button>
                          <div className="flex gap-2">
                            {matchingResume && (
                              <a
                                href={matchingResume.storageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold rounded-xl shadow transition"
                              >
                                📄 Download Original PDF
                              </a>
                            )}
                            <button
                              onClick={() => generateResumeAnalysisPDF(getNormalizedAnalysis(selectedAnalysis), selectedAnalysis.fileName + '_analysis.pdf')}
                              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
                            >
                              <FiDownload /> Download Report PDF
                            </button>
                            <button
                              onClick={() => setIsEmailModalOpen(true)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition"
                            >
                              <FiMail /> Email PDF
                            </button>
                            <button
                              onClick={(e) => handleDeleteReport(e, selectedAnalysis.id)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition"
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                    
                    <AtsScoreCard analysis={getNormalizedAnalysis(selectedAnalysis)} />
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

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        reportName={(selectedAnalysis || analysisResult)?.fileName || uploadedFile?.name || 'Resume Analysis Report'}
        reportType="resume_analysis"
        reportData={getNormalizedAnalysis(selectedAnalysis || analysisResult)}
      />
    </div>
  );
};

export default ResumeAnalysis;
