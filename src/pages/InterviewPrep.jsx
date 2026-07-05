import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiCopy, FiBookmark, FiChevronDown, FiChevronUp, 
  FiKey, FiBriefcase, FiCpu, FiUser, FiCheck, FiPlay, FiFileText 
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { getUserResumes } from '../services/resumeStorage';
import { generateInterviewQuestions } from '../services/geminiInterview';
import { useSEO } from '../hooks/useSEO';

const InterviewPrep = () => {
  useSEO('AI Interview Preparation', 'Generate personalized interview questions based on your resume and target companies using Gemini AI.');
  const { user } = useAuth();
  const navigate = useNavigate();

  // API Key state
  const [apiKey, setApiKey] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [hasEnvKey, setHasEnvKey] = useState(false);

  // Resume selection and options
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetCompany, setTargetCompany] = useState('None');
  const [experienceLevel, setExperienceLevel] = useState('Experienced');
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Generated Questions state
  const [questionsGroup, setQuestionsGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('technical');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [bookmarks, setBookmarks] = useState({});

  // Companies list
  const companies = [
    { value: 'None', label: 'General / No Specific Company' },
    { value: 'Google', label: 'Google' },
    { value: 'Amazon', label: 'Amazon' },
    { value: 'Microsoft', label: 'Microsoft' },
    { value: 'Infosys', label: 'Infosys' },
    { value: 'TCS', label: 'TCS' },
    { value: 'Wipro', label: 'Wipro' },
    { value: 'Accenture', label: 'Accenture' }
  ];

  // Check API keys and load saved resumes
  useEffect(() => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    const localKey = localStorage.getItem('VITE_GEMINI_API_KEY') || localStorage.getItem('gemini_api_key');
    
    if (envKey) {
      setHasEnvKey(true);
    } else if (localKey) {
      setApiKey(localKey);
    } else {
      setShowKeyConfig(true);
    }

    if (user?.uid) {
      loadResumes();
    }

    // Load bookmarks from local storage
    const savedBookmarks = localStorage.getItem(`bookmarks_${user?.uid || 'guest'}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    // Load any previously generated questions from localStorage
    const savedQuestions = localStorage.getItem(`generated_prep_${user?.uid}`);
    if (savedQuestions) {
      try {
        setQuestionsGroup(JSON.parse(savedQuestions));
      } catch (e) {
        console.error('Error parsing saved prep questions:', e);
      }
    }
  }, [user]);

  const loadResumes = async () => {
    try {
      setLoadingResumes(true);
      const userResumes = await getUserResumes(user.uid);
      setResumes(userResumes);
      if (userResumes.length > 0) {
        setSelectedResumeId(userResumes[0].id);
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
      toast.error('Failed to load saved resumes');
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    localStorage.setItem('VITE_GEMINI_API_KEY', apiKey.trim());
    setShowKeyConfig(false);
    toast.success('Gemini API Key saved successfully');
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('VITE_GEMINI_API_KEY');
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setShowKeyConfig(true);
    toast.success('Gemini API Key removed');
  };

  // Generate Questions
  const handleGenerateQuestions = async () => {
    if (generating) return;

    if (!hasEnvKey && !apiKey) {
      toast.error('Please configure your Gemini API Key first.');
      setShowKeyConfig(true);
      return;
    }

    if (!selectedResumeId) {
      toast.error('Please upload or select a resume first.');
      return;
    }

    const selectedResume = resumes.find(r => r.id === selectedResumeId);
    if (!selectedResume || !selectedResume.resumeText) {
      toast.error('Resume text content is missing. Please try re-uploading your resume.');
      return;
    }

    try {
      setGenerating(true);
      toast.loading('Analyzing resume and generating questions...', { id: 'generating-questions' });
      
      const response = await generateInterviewQuestions(selectedResume.resumeText, {
        company: targetCompany,
        level: experienceLevel
      });

      // Format response structure just in case categories are different
      const formatted = {
        hr: response.hr || [],
        technical: response.technical || [],
        project: response.project || [],
        behavioral: response.behavioral || [],
        coding: response.coding || [],
        resumeId: selectedResumeId,
        company: targetCompany,
        level: experienceLevel,
        generatedAt: new Date().toISOString()
      };

      setQuestionsGroup(formatted);
      localStorage.setItem(`generated_prep_${user.uid}`, JSON.stringify(formatted));
      toast.success('Interview Prep generated successfully!', { id: 'generating-questions' });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error(error.message || 'Failed to generate questions. Please verify your API Key.', { id: 'generating-questions' });
    } finally {
      setGenerating(false);
    }
  };

  // Toggle question details
  const toggleExpandQuestion = (id) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Copy Question to clipboard
  const handleCopyQuestion = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Question copied to clipboard');
  };

  // Toggle Bookmark
  const handleToggleBookmark = (questionObj) => {
    const qKey = `${activeTab}_${questionObj.question.slice(0, 30)}`;
    const updatedBookmarks = { ...bookmarks };
    
    if (updatedBookmarks[qKey]) {
      delete updatedBookmarks[qKey];
      toast.success('Bookmark removed');
    } else {
      updatedBookmarks[qKey] = {
        ...questionObj,
        category: activeTab,
        bookmarkedAt: new Date().toISOString()
      };
      toast.success('Question bookmarked');
    }

    setBookmarks(updatedBookmarks);
    localStorage.setItem(`bookmarks_${user?.uid || 'guest'}`, JSON.stringify(updatedBookmarks));
  };

  // Launch mock interview with active questions
  const handleStartMockInterview = () => {
    if (!questionsGroup) return;
    
    // Combine all questions or pass them to Mock Interview page
    localStorage.setItem(`active_mock_interview_${user.uid}`, JSON.stringify({
      questions: [
        ...(questionsGroup.hr || []).map(q => ({ ...q, category: 'HR' })),
        ...(questionsGroup.technical || []).map(q => ({ ...q, category: 'Technical' })),
        ...(questionsGroup.project || []).map(q => ({ ...q, category: 'Project-Based' })),
        ...(questionsGroup.behavioral || []).map(q => ({ ...q, category: 'Behavioral' })),
        ...(questionsGroup.coding || []).map(q => ({ ...q, category: 'Coding' }))
      ],
      resumeId: questionsGroup.resumeId,
      company: questionsGroup.company,
      level: questionsGroup.level
    }));

    navigate('/mock-interview');
  };

  // Get active tab questions
  const getTabQuestions = () => {
    if (!questionsGroup) return [];
    return questionsGroup[activeTab] || [];
  };

  // Filter and search questions
  const filteredQuestions = getTabQuestions().filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-350 border-emerald-200 dark:border-emerald-900/30';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-350 border-blue-200 dark:border-blue-900/30';
      case 'hard':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-350 border-rose-200 dark:border-rose-900/30';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            AI Interview Prep System
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate tailored questions and practice evaluations powered by Gemini AI
          </p>
        </motion.div>

        {/* API Key management */}
        <div className="flex items-center gap-2">
          {!hasEnvKey && (
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition font-bold text-sm shadow-sm"
            >
              <FiKey />
              {apiKey ? 'Change API Key' : 'Configure API Key'}
            </button>
          )}
        </div>
      </div>

      {/* Key Config Panel */}
      <AnimatePresence>
        {showKeyConfig && !hasEnvKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl">
                <FiKey size={24} />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Google Gemini API Key Required</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    To generate custom interview prep content, you must configure a Google Gemini API Key. Keys are processed securely client-side and saved only inside your local browser.
                  </p>
                </div>
                <form onSubmit={handleSaveApiKey} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                  <input
                    type="password"
                    placeholder="Enter your Gemini API Key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-gray-950 dark:text-white rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition shadow-md shadow-amber-600/10"
                    >
                      Save Key
                    </button>
                    {localStorage.getItem('VITE_GEMINI_API_KEY') && (
                      <button
                        type="button"
                        onClick={handleClearApiKey}
                        className="px-4 py-2 border border-rose-250 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 rounded-xl font-bold text-sm transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuration Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <FiBriefcase className="text-blue-500" /> Configure AI Preparation Session
        </h2>

        {loadingResumes ? (
          <div className="py-6 text-center text-gray-500">
            Loading resumes...
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <FiFileText className="mx-auto text-gray-400 w-12 h-12 mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">No Resumes Uploaded</h3>
            <p className="text-sm text-gray-650 dark:text-gray-400 mb-4 max-w-sm mx-auto">
              You need to parse at least one PDF resume to generate personalized interview questions.
            </p>
            <button
              onClick={() => navigate('/resume-analysis')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition shadow"
            >
              Upload Resume
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Select Parsed Resume
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-750 dark:bg-gray-900/60 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-semibold"
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.fileName || resume.originalFileName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Target Company Style
              </label>
              <select
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-750 dark:bg-gray-900/60 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-semibold"
              >
                {companies.map((co) => (
                  <option key={co.value} value={co.value}>
                    {co.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Candidate Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-750 dark:bg-gray-900/60 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-semibold"
              >
                <option value="Fresher">Fresher Questions (Entry Level / Graduate)</option>
                <option value="Experienced">Experienced Questions (Mid to Senior Architect)</option>
              </select>
            </div>

            <div className="md:col-span-3 pt-2">
              <button
                onClick={handleGenerateQuestions}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/10"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating Personalized Questions...</span>
                  </>
                ) : (
                  <>
                    <FiCpu />
                    <span>Generate AI Prep Interview Questions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Main Questions View */}
      {questionsGroup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Start Mock Interview Banner */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-3 py-1 rounded-full">
                Interactive Practice Hub
              </span>
              <h2 className="text-2xl font-black">Launch Mock Interview Session</h2>
              <p className="text-blue-100 text-sm max-w-xl">
                Ready to test yourself under pressure? Enter our mock interview mode to answer questions one-by-one with a countdown timer, then receive comprehensive Gemini grades!
              </p>
            </div>
            <button
              onClick={handleStartMockInterview}
              className="flex items-center gap-2 px-6 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition shadow-lg shrink-0"
            >
              <FiPlay fill="currentColor" /> Start Mock Interview
            </button>
          </div>

          {/* Search, Filter, and Category Navigation */}
          <div className="bg-white/60 dark:bg-gray-800/40 border border-gray-250 dark:border-gray-700/50 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-xl">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <FiSearch className="absolute left-3 top-3.5 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search generated questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-800 pb-1 md:border-none md:pb-0 justify-center">
              {[
                { key: 'technical', label: 'Technical (15)' },
                { key: 'hr', label: 'HR (10)' },
                { key: 'project', label: 'Project (10)' },
                { key: 'behavioral', label: 'Behavioral (10)' },
                { key: 'coding', label: 'Coding (5)' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Difficulty Filter */}
            <div className="flex gap-1.5 self-stretch md:self-auto shrink-0">
              {['all', 'easy', 'medium', 'hard'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDifficultyFilter(lvl)}
                  className={`flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-bold capitalize border transition ${
                    difficultyFilter === lvl
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950 border-transparent shadow'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-750 hover:bg-gray-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12 bg-white/40 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-800 rounded-3xl">
                <p className="text-gray-500 font-bold">No questions found matching your search filters.</p>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const qId = `${activeTab}_${idx}`;
                const isExpanded = expandedQuestions[qId];
                const bookmarkKey = `${activeTab}_${q.question.slice(0, 30)}`;
                const isBookmarked = !!bookmarks[bookmarkKey];

                return (
                  <motion.div
                    key={qId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-750/70 p-5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 px-2 py-0.5 rounded uppercase">
                            Q{idx + 1}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 border rounded uppercase ${getDifficultyColor(q.difficulty)}`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white leading-relaxed">
                          {q.question}
                        </h3>
                      </div>

                      {/* Card actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopyQuestion(q.question)}
                          className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 transition"
                          title="Copy Question"
                        >
                          <FiCopy size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleBookmark(q)}
                          className={`p-2 rounded-lg border transition ${
                            isBookmarked
                              ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-400'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-750 dark:hover:bg-gray-700 text-gray-650'
                          }`}
                          title={isBookmarked ? 'Bookmarked' : 'Bookmark Question'}
                        >
                          <FiBookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    {/* Expected Answer Collapsible Button */}
                    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between items-center">
                      <button
                        onClick={() => toggleExpandQuestion(qId)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      >
                        {isExpanded ? (
                          <>
                            <FiChevronUp /> Hide Answer Guidelines
                          </>
                        ) : (
                          <>
                            <FiChevronDown /> Reveal Answer Guidelines
                          </>
                        )}
                      </button>
                    </div>

                    {/* Collapsible Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-4 pt-4 mt-2"
                        >
                          <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 p-4 rounded-xl space-y-3 text-xs leading-relaxed">
                            <div>
                              <span className="font-bold text-emerald-600 dark:text-emerald-450 uppercase text-[10px]">Expected Answer Profile</span>
                              <p className="text-gray-700 dark:text-gray-300 mt-1 italic font-medium">{q.expectedAnswer}</p>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-800 pt-2.5">
                              <span className="font-bold text-blue-600 dark:text-blue-450 uppercase text-[10px]">Evaluation Criteria</span>
                              <p className="text-gray-700 dark:text-gray-300 mt-1">{q.evaluationCriteria}</p>
                            </div>
                            {q.evaluationRubric && (
                              <div className="border-t border-gray-200 dark:border-gray-800 pt-2.5">
                                <span className="font-bold text-purple-600 dark:text-purple-450 uppercase text-[10px]">Evaluation Rubric</span>
                                <p className="text-gray-700 dark:text-gray-300 mt-1">{q.evaluationRubric}</p>
                              </div>
                            )}
                            {q.hints && q.hints.length > 0 && (
                              <div className="border-t border-gray-200 dark:border-gray-800 pt-2.5">
                                <span className="font-bold text-amber-600 dark:text-amber-450 uppercase text-[10px]">Hints & Suggestions</span>
                                <p className="text-gray-700 dark:text-gray-300 mt-1 italic">
                                  {Array.isArray(q.hints) ? q.hints.join(' | ') : q.hints}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InterviewPrep;
