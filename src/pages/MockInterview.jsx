import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, FiPlay, FiMaximize2, FiMinimize2, FiClock, 
  FiCheck, FiChevronRight, FiChevronLeft, FiSend, FiLoader, 
  FiAward, FiX, FiCheckCircle, FiSkipForward, FiCpu 
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection } from 'firebase/firestore';
import { safeAddDoc } from '../utils/firestoreHelper';
import { evaluateInterviewAnswer } from '../services/geminiInterview';
import { useSEO } from '../hooks/useSEO';

const CircularProgress = ({ score, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = "stroke-rose-500";
  if (score >= 80) colorClass = "stroke-emerald-500";
  else if (score >= 60) colorClass = "stroke-blue-500";
  else if (score >= 40) colorClass = "stroke-amber-500";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-gray-200 dark:stroke-gray-800 fill-none"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`fill-none transition-all duration-1000 ${colorClass}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{score}</span>
        <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-450 mt-1">Score</span>
      </div>
    </div>
  );
};

const MockInterview = () => {
  useSEO('Live Mock Interview', 'Test your preparation in an interactive mock environment with real-time AI grading.');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Interview state
  const [questions, setQuestions] = useState([]);
  const [resumeId, setResumeId] = useState('');
  const [company, setCompany] = useState('');
  const [level, setLevel] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // User answers and scores logging
  const [answersLog, setAnswersLog] = useState([]);
  const [scoresLog, setScoresLog] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  // Mode and view states
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer states (120 seconds per question)
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef(null);

  // Load questions on mount
  useEffect(() => {
    if (user?.uid) {
      const activeSession = localStorage.getItem(`active_mock_interview_${user.uid}`);
      if (activeSession) {
        try {
          const parsed = JSON.parse(activeSession);
          // Limit to 5-10 questions if required, but let's load all generated questions (e.g. 50 is a lot, let's pick 10 or 15 for a mock session or let them do all! Actually, let's load all of them but let them exit at any point)
          // Wait, the prompt says: "Generate: 10 HR, 15 Tech, 10 Project, 10 Behavioral, 5 Coding". 50 questions total is quite long for a single sitting mock. Let's let them practice a curated subset of 10 questions (2 from each category) OR practice all. Curating a random sample of 10 questions (2 HR, 2 Tech, 2 Project, 2 Behavioral, 2 Coding) makes the mock interview extremely realistic and friendly, while keeping the full 50 questions available in the prep list.
          // Let's check if the list has categories and curate a standard 10 questions mock:
          const allQs = parsed.questions || [];
          
          // Let's filter by category to sample:
          const hrs = allQs.filter(q => q.category === 'HR');
          const techs = allQs.filter(q => q.category === 'Technical');
          const projs = allQs.filter(q => q.category === 'Project-Based' || q.category === 'Project');
          const behs = allQs.filter(q => q.category === 'Behavioral');
          const codings = allQs.filter(q => q.category === 'Coding');

          const curated = [
            ...hrs.slice(0, 2),
            ...techs.slice(0, 2),
            ...projs.slice(0, 2),
            ...behs.slice(0, 2),
            ...codings.slice(0, 2)
          ];

          setQuestions(curated.length > 0 ? curated : allQs);
          setResumeId(parsed.resumeId || 'unknown');
          setCompany(parsed.company || 'None');
          setLevel(parsed.level || 'Experienced');
          
          // Initialize answer logs
          setAnswersLog(new Array(curated.length > 0 ? curated.length : allQs.length).fill(''));
          setScoresLog(new Array(curated.length > 0 ? curated.length : allQs.length).fill(null));
        } catch (e) {
          console.error('Error loading mock interview questions:', e);
          toast.error('Failed to parse interview questions session.');
        }
      }
    }
  }, [user]);

  // Timer effect
  useEffect(() => {
    if (interviewComplete || evaluating || currentEvaluation) {
      clearInterval(timerRef.current);
      return;
    }

    // Reset and start timer for current question
    setTimeLeft(120);
    clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIdx, interviewComplete, evaluating, currentEvaluation]);

  // Handle Fullscreen events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleTimeOut = () => {
    toast.error("Time's up for this question!");
    // Auto submit whatever is in the answer
    handleSubmitAnswer(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        toast.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Submit Answer for grading
  const handleSubmitAnswer = async (isAutoSubmit = false) => {
    const answerToEvaluate = currentAnswer.trim() || (isAutoSubmit ? "[No Answer Provided - Time Expired]" : "");
    if (!isAutoSubmit && !answerToEvaluate) {
      toast.error('Please type a response before submitting.');
      return;
    }

    try {
      setEvaluating(true);
      clearInterval(timerRef.current);

      const activeQ = questions[currentIdx];
      const evaluation = await evaluateInterviewAnswer(
        activeQ.question,
        activeQ.expectedAnswer,
        answerToEvaluate,
        activeQ.difficulty || 'Medium'
      );

      // Save to logs
      const updatedAnswers = [...answersLog];
      updatedAnswers[currentIdx] = answerToEvaluate;
      setAnswersLog(updatedAnswers);

      const updatedScores = [...scoresLog];
      updatedScores[currentIdx] = evaluation;
      setScoresLog(updatedScores);

      setCurrentEvaluation(evaluation);
      toast.success('Grading complete!');
    } catch (error) {
      console.error('Error evaluating answer:', error);
      toast.error(error.message || 'Failed to grade your answer with Gemini AI.');
    } finally {
      setEvaluating(false);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    setCurrentEvaluation(null);
    setCurrentAnswer(answersLog[currentIdx + 1] || '');
    
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      handleFinishInterview();
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentEvaluation(null);
      setCurrentIdx(currentIdx - 1);
      setCurrentAnswer(answersLog[currentIdx - 1] || '');
    }
  };

  const handleSkip = () => {
    const updatedAnswers = [...answersLog];
    updatedAnswers[currentIdx] = "[Skipped]";
    setAnswersLog(updatedAnswers);

    const updatedScores = [...scoresLog];
    // Assign 0 or simple default evaluation for skipped questions
    updatedScores[currentIdx] = {
      score: 0,
      confidence: 'Low',
      strengths: [],
      weaknesses: ['Question was skipped.'],
      grammarFeedback: 'N/A',
      technicalAccuracy: 'N/A',
      communicationScore: 0,
      improvementSuggestions: 'Make sure to attempt all questions in actual interviews.',
      betterAnswer: questions[currentIdx].expectedAnswer
    };
    setScoresLog(updatedScores);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setCurrentAnswer(answersLog[currentIdx + 1] || '');
    } else {
      handleFinishInterview();
    }
  };

  // Finish session and write to Firestore
  const handleFinishInterview = async () => {
    clearInterval(timerRef.current);
    
    // Check if there are any unattempted questions
    const unattempted = scoresLog.some(s => s === null);
    if (unattempted) {
      const confirm = window.confirm("You have unanswered questions. Finishing now will mark them as skipped. Proceed?");
      if (!confirm) return;
    }

    try {
      setSavingSession(true);
      
      // Filter out null scores for calculations, filling skipped values
      const finalizedAnswers = answersLog.map((ans, i) => ans || "[Skipped]");
      const finalizedScores = scoresLog.map((scoreObj, i) => {
        if (scoreObj) return scoreObj;
        return {
          score: 0,
          confidence: 'Low',
          strengths: [],
          weaknesses: ['Not attempted.'],
          grammarFeedback: 'N/A',
          technicalAccuracy: 'N/A',
          communicationScore: 0,
          improvementSuggestions: 'Not attempted.',
          betterAnswer: questions[i].expectedAnswer
        };
      });

      const avgScore = Math.round(finalizedScores.reduce((sum, s) => sum + s.score, 0) / finalizedScores.length);
      
      // Save session in Firestore
      const sessionData = {
        userId: user.uid,
        resumeId: resumeId || 'unknown',
        company: company || 'None',
        level: level || 'Experienced',
        questions: questions.map(q => ({
          question: q.question,
          category: q.category || 'General',
          expectedAnswer: q.expectedAnswer,
          difficulty: q.difficulty || 'Medium'
        })),
        answers: finalizedAnswers,
        scores: finalizedScores,
        averageScore: avgScore,
        createdAt: new Date()
      };

      await safeAddDoc(collection(db, 'interview_sessions'), sessionData);
      
      setAnswersLog(finalizedAnswers);
      setScoresLog(finalizedScores);
      setInterviewComplete(true);
      toast.success('Interview Session saved successfully!');
      
      // Clear fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save your session to Firestore.');
    } finally {
      setSavingSession(false);
    }
  };

  // Calculate stats for completed interview
  const getOverallGrade = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-emerald-500' };
    if (score >= 75) return { label: 'Strong', color: 'text-blue-500' };
    if (score >= 55) return { label: 'Good', color: 'text-amber-500' };
    return { label: 'Needs Improvement', color: 'text-rose-500' };
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md">
        <FiAward className="text-gray-400 w-16 h-16 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Active Session Found</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-6 text-sm">
          Please select a resume and generate interview questions first.
        </p>
        <button
          onClick={() => navigate('/interview-prep')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow"
        >
          Go to Interview Prep
        </button>
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;
  const attemptedCount = scoresLog.filter(s => s !== null).length;

  return (
    <div className={`min-h-screen ${isFullscreen ? 'bg-gray-950 p-6 flex flex-col justify-center' : 'space-y-6 pb-12'}`}>
      
      {/* Session Header */}
      {!interviewComplete && (
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to exit the mock interview? Your progress will not be saved.")) {
                  navigate('/interview-prep');
                }
              }}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-xl transition border border-gray-200 dark:border-gray-700"
              title="Cancel Interview"
            >
              <FiArrowLeft size={16} />
            </button>
            <div>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                Mock Mode ({company !== 'None' ? company : 'General'})
              </span>
              <h2 className="text-lg font-black text-gray-900 dark:text-white capitalize">
                Question {currentIdx + 1} of {questions.length}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Countdown timer */}
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl font-bold text-sm ${
              timeLeft < 30 
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 animate-pulse'
                : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300'
            }`}>
              <FiClock />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-750 dark:text-gray-300 rounded-xl transition border border-gray-200 dark:border-gray-700"
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            >
              {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {!interviewComplete && (
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {!interviewComplete ? (
          <motion.div
            key={`question-container-${currentIdx}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-5 gap-6"
          >
            {/* Left Panel: Question and Answer Interface */}
            <div className="md:col-span-3 space-y-6">
              <div className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750/70 rounded-3xl p-6 sm:p-8 shadow-lg backdrop-blur-md">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-150 px-2.5 py-0.5 rounded uppercase">
                      {activeQuestion.category}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 border rounded uppercase ${
                      activeQuestion.difficulty?.toLowerCase() === 'easy' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30' :
                      activeQuestion.difficulty?.toLowerCase() === 'hard' ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/30' :
                      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30'
                    }`}>
                      {activeQuestion.difficulty}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-relaxed">
                    {activeQuestion.question}
                  </h3>
                </div>

                <div className="mt-8 space-y-4">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Your Response
                  </label>
                  <textarea
                    rows={8}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your structured answer here... Be detailed, reference core technical concepts, and provide specific examples if applicable."
                    disabled={evaluating || currentEvaluation}
                    className="w-full p-4 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/40 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none text-sm leading-relaxed"
                  />
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrevious}
                        disabled={currentIdx === 0 || evaluating}
                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-250 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-bold text-xs disabled:opacity-50"
                      >
                        <FiChevronLeft /> Previous
                      </button>
                      <button
                        onClick={handleSkip}
                        disabled={evaluating}
                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-250 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition font-bold text-xs disabled:opacity-50"
                      >
                        Skip <FiSkipForward />
                      </button>
                    </div>

                    {!currentEvaluation ? (
                      <button
                        onClick={() => handleSubmitAnswer(false)}
                        disabled={evaluating || !currentAnswer.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all text-xs"
                      >
                        {evaluating ? (
                          <>
                            <FiLoader className="animate-spin" /> Graded by AI...
                          </>
                        ) : (
                          <>
                            Submit Response <FiSend />
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-bold rounded-xl hover:opacity-90 transition shadow-md text-xs animate-pulse"
                      >
                        {currentIdx + 1 === questions.length ? 'Finish & Summary' : 'Next Question'} <FiChevronRight />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Immediate Gemini Evaluation Report */}
            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                {currentEvaluation ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750/70 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 rounded-lg">
                          <FiCheckCircle size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Grading Completed</h4>
                          <span className="text-[10px] text-gray-500 font-bold">Immediate AI evaluation</span>
                        </div>
                      </div>
                      <CircularProgress score={currentEvaluation.score} size={64} strokeWidth={6} />
                    </div>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {/* Detailed Score Breakdown */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800/80">
                          <span className="text-[9px] uppercase font-bold text-gray-550 block">Accuracy</span>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                            {currentEvaluation.technicalAccuracy}
                          </span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800/80">
                          <span className="text-[9px] uppercase font-bold text-gray-550 block">Confidence</span>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                            {currentEvaluation.confidence}
                          </span>
                        </div>
                      </div>

                      {/* Strengths */}
                      {currentEvaluation.strengths?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-extrabold text-emerald-600 dark:text-emerald-450 tracking-wider">Strengths</span>
                          <ul className="list-disc pl-4 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                            {currentEvaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {currentEvaluation.weaknesses?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-extrabold text-rose-600 dark:text-rose-450 tracking-wider">Weaknesses & Omissions</span>
                          <ul className="list-disc pl-4 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                            {currentEvaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Grammar Feedback */}
                      {currentEvaluation.grammarFeedback && (
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-extrabold text-blue-600 dark:text-blue-450 tracking-wider">Communication & Language</span>
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                            {currentEvaluation.grammarFeedback}
                          </p>
                        </div>
                      )}

                      {/* Suggestions */}
                      {currentEvaluation.improvementSuggestions && (
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-extrabold text-amber-600 dark:text-amber-450 tracking-wider">Improvement Suggestion</span>
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                            {currentEvaluation.improvementSuggestions}
                          </p>
                        </div>
                      )}

                      {/* Better Answer Model */}
                      {currentEvaluation.betterAnswer && (
                        <div className="border-t border-gray-150 dark:border-gray-800 pt-3 space-y-1">
                          <span className="text-[10px] uppercase font-extrabold text-purple-600 dark:text-purple-450 tracking-wider block">Suggested Better Answer</span>
                          <p className="text-xs text-gray-700 dark:text-gray-300 bg-purple-500/5 dark:bg-purple-950/10 border border-purple-200/50 dark:border-purple-900/30 p-3 rounded-xl italic mt-1 leading-relaxed">
                            {currentEvaluation.betterAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : evaluating ? (
                  <div className="bg-gray-50/50 dark:bg-gray-900/20 border border-dashed border-gray-250 dark:border-gray-850 rounded-3xl p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
                    <FiLoader className="text-blue-500 w-12 h-12 mb-3 animate-spin" />
                    <h4 className="font-bold text-gray-650 dark:text-gray-400 text-sm">AI Grading in progress</h4>
                    <p className="text-xs text-gray-500 max-w-[200px] mt-1.5 mb-3">
                      Gemini is generating feedback on your answer.
                    </p>
                    <div className="flex gap-1.5 justify-center items-center">
                      <span className="w-2 bg-blue-500 h-2 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 bg-blue-500 h-2 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 bg-blue-500 h-2 rounded-full animate-bounce" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50/50 dark:bg-gray-900/20 border border-dashed border-gray-250 dark:border-gray-850 rounded-3xl p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
                    <FiCpu className="text-gray-300 dark:text-gray-700 w-12 h-12 mb-3 animate-pulse" />
                    <h4 className="font-bold text-gray-650 dark:text-gray-400 text-sm">Evaluation Report Pending</h4>
                    <p className="text-xs text-gray-500 max-w-[200px] mt-1.5">
                      Write and submit your response to see a detailed Gemini AI breakdown of your performance.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* Interview Complete Results Panel */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750/70 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8"
          >
            {/* Complete Header banner */}
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl">
                <FiAward size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Interview Practice Completed!</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm">
                Excellent work completing your personalized session for the <strong className="capitalize">{level}</strong> level. Here is your scorecard.
              </p>
            </div>

            {/* Scorecard Summary Metrics */}
            {(() => {
              const scores = scoresLog.filter(s => s !== null).map(s => s.score);
              const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 0;
              const grade = getOverallGrade(avgScore);
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-800 text-center flex flex-col items-center justify-center">
                    <span className="text-[10px] font-extrabold text-gray-450 uppercase tracking-widest">Overall Average Score</span>
                    <p className={`text-5xl font-black mt-2 leading-none`}>{avgScore}%</p>
                    <span className={`text-xs font-black mt-2 px-3 py-1 rounded-full border bg-white dark:bg-gray-900 ${grade.color}`}>
                      {grade.label}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-800 md:col-span-2 flex flex-col justify-center">
                    <span className="text-[10px] font-extrabold text-gray-450 uppercase tracking-widest mb-3">Performance Log Breakdown</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-500">Attempted</span>
                        <p className="text-lg font-black text-gray-800 dark:text-gray-150 mt-1">{attemptedCount} / {questions.length}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-gray-550">Skipped</span>
                        <p className="text-lg font-black text-gray-850 dark:text-gray-150 mt-1">{questions.length - attemptedCount}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-emerald-600">Best Score</span>
                        <p className="text-lg font-black text-emerald-600 mt-1">
                          {scores.length > 0 ? Math.max(...scores) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Answer Logs accordions */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Questions Review Panel</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const scoreObj = scoresLog[idx];
                  const userAnswer = answersLog[idx];
                  
                  return (
                    <div key={idx} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 bg-white/40 dark:bg-gray-900/20 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-450 px-2 py-0.5 rounded">
                              Q{idx + 1}
                            </span>
                            <span className="text-[9px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded uppercase">
                              {q.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-normal mt-1">
                            {q.question}
                          </h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-xs font-black shrink-0 ${
                          scoreObj?.score >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          scoreObj?.score >= 55 ? 'bg-blue-100 text-blue-850 dark:bg-blue-950/40 dark:text-blue-400' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450'
                        }`}>
                          Score: {scoreObj?.score || 0}/100
                        </span>
                      </div>

                      <div className="text-xs space-y-2 border-t border-gray-150 dark:border-gray-800 pt-3">
                        <p className="text-gray-650 dark:text-gray-400">
                          <strong>Your Answer:</strong> {userAnswer || <span className="italic text-gray-400">[Skipped/No response]</span>}
                        </p>
                        {scoreObj && scoreObj.betterAnswer && (
                          <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-200/30 p-3 rounded-xl text-gray-700 dark:text-gray-300 italic">
                            <strong>AI Suggested Better Answer:</strong> {scoreObj.betterAnswer}
                          </div>
                        )}
                        {scoreObj && scoreObj.improvementSuggestions && (
                          <p className="text-gray-700 dark:text-gray-350">
                            <strong>AI Feedback:</strong> {scoreObj.improvementSuggestions}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 border-t border-gray-150 dark:border-gray-850">
              <button
                onClick={() => navigate('/interview-prep')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-95 transition text-center shadow-lg text-sm"
              >
                Return to Prep Hub
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm"
              >
                Restart Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockInterview;
