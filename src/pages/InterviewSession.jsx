import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiArrowLeft, FiAlertCircle, FiCheck, FiSend, FiLoader, FiAward, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { getLatestAnalysisResult, saveInterviewSession } from '../services/resumeStorage';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// Data repository for interview questions
const QUESTIONS_REPO = {
  frontend: [
    {
      id: 1,
      question: "Explain the virtual DOM in React and how reconciliation works.",
      optimalKeywords: ["reconciliation", "diff", "virtual dom", "render", "update"],
      sampleAnswer: "The virtual DOM is a lightweight JS representation of the real DOM. React compares changes using a diffing algorithm (reconciliation) and updates only the modified parts in the real DOM to maximize rendering efficiency."
    },
    {
      id: 2,
      question: "What is the difference between client-side rendering (CSR) and server-side rendering (SSR)?",
      optimalKeywords: ["ssr", "csr", "seo", "render", "load", "html"],
      sampleAnswer: "In CSR, the browser downloads a minimal HTML page and JS files, rendering content client-side. In SSR, the server pre-renders pages into full HTML, enhancing SEO and initial load speed."
    },
    {
      id: 3,
      question: "Explain closures in JavaScript and provide a common use case.",
      optimalKeywords: ["scope", "outer", "inner", "function", "lexical", "encapsulation"],
      sampleAnswer: "A closure is the combination of a function bundled together with references to its surrounding state (lexical environment), allowing an inner function to access variables from an outer scope even after the outer function has executed."
    },
    {
      id: 4,
      question: "What is CSS specificity, and how does it affect style hierarchy?",
      optimalKeywords: ["specificity", "inline", "id", "class", "element", "weight"],
      sampleAnswer: "Specificity is a weight calculation applied by browsers to decide which CSS property values are most relevant to an element. Inline styles have highest weight, followed by IDs, classes/attributes, and element tags."
    },
    {
      id: 5,
      question: "How do you optimize performance in a large-scale React application?",
      optimalKeywords: ["memo", "lazy", "splitting", "render", "usememo", "usecallback"],
      sampleAnswer: "Optimizations include code splitting with React.lazy, using React.memo to prevent unnecessary re-renders, caching values with useMemo, and debouncing expensive calculations."
    }
  ],
  backend: [
    {
      id: 1,
      question: "What are ACID properties in a database transaction? Explain each briefly.",
      optimalKeywords: ["atomicity", "consistency", "isolation", "durability", "transaction"],
      sampleAnswer: "ACID stands for Atomicity (all or nothing), Consistency (preserves database rules), Isolation (independent concurrent runs), and Durability (transactions persist even during crashes)."
    },
    {
      id: 2,
      question: "Explain the difference between SQL and NoSQL databases. When would you use NoSQL?",
      optimalKeywords: ["schema", "relational", "nosql", "structured", "scale", "document"],
      sampleAnswer: "SQL databases are relational and table-based with strict schemas, while NoSQL are non-relational (document, key-value) with dynamic schemas. Use NoSQL for rapid development, scale, or unstructured data."
    },
    {
      id: 3,
      question: "What is load balancing, and what are common routing algorithms?",
      optimalKeywords: ["traffic", "server", "distribution", "round robin", "least connections", "balancing"],
      sampleAnswer: "Load balancing distributes network traffic across multiple servers. Common algorithms include Round Robin, Least Connections, and IP Hash."
    },
    {
      id: 4,
      question: "How do REST APIs differ from GraphQL APIs?",
      optimalKeywords: ["endpoint", "query", "overfetching", "underfetching", "schema"],
      sampleAnswer: "REST utilizes multiple endpoints returning fixed data structures, leading to over/under-fetching. GraphQL uses a single endpoint enabling clients to query exactly the fields they need."
    },
    {
      id: 5,
      question: "What is a message queue, and how does it improve system reliability?",
      optimalKeywords: ["asynchronous", "queue", "producer", "consumer", "decoupling", "buffer"],
      sampleAnswer: "Message queues allow asynchronous communication between services. Decoupling producers and consumers buffers traffic spikes and protects down-stream services from failures."
    }
  ],
  'data-scientist': [
    {
      id: 1,
      question: "Explain the difference between supervised and unsupervised learning.",
      optimalKeywords: ["labeled", "unlabeled", "regression", "classification", "clustering"],
      sampleAnswer: "Supervised learning trains models on labeled training inputs (e.g. classification, regression). Unsupervised learning detects hidden structures in unlabeled datasets (e.g. clustering)."
    },
    {
      id: 2,
      question: "What is overfitting in machine learning, and how do you prevent it?",
      optimalKeywords: ["overfitting", "noise", "validation", "regularization", "dropout", "cross"],
      sampleAnswer: "Overfitting happens when a model learns the training data's noise rather than general patterns, performing poorly on new data. Prevent it using cross-validation, regularization (L1/L2), and dropout."
    },
    {
      id: 3,
      question: "Explain SQL window functions and provide an example.",
      optimalKeywords: ["window", "over", "partition", "rank", "row_number"],
      sampleAnswer: "Window functions execute calculations across a set of table rows related to the current row. Unlike aggregate functions, they retain row identity. Syntax includes: ROW_NUMBER() OVER(PARTITION BY category ORDER BY sales DESC)."
    },
    {
      id: 4,
      question: "What are precision and recall? How do they balance in binary classification?",
      optimalKeywords: ["precision", "recall", "true positive", "false positive", "false negative", "f1"],
      sampleAnswer: "Precision measures true positives relative to all predicted positives (quality). Recall measures true positives relative to all actual positives (quantity). They are often balanced using the F1-score."
    },
    {
      id: 5,
      question: "What is a random forest model, and how does it work?",
      optimalKeywords: ["ensemble", "decision tree", "bagging", "bootstrap", "voting"],
      sampleAnswer: "Random Forest is an ensemble classifier that constructs multiple decision trees during training. It utilizes bagging (bootstrap aggregation) and feature randomness to output the average class prediction."
    }
  ]
};

const DEFAULT_QUESTIONS = [
  {
    id: 1,
    question: "Explain your process for debugging a complex runtime error.",
    optimalKeywords: ["logs", "breakpoint", "stack trace", "isolate", "reproduce"],
    sampleAnswer: "Isolate the issue by reproducing it in a sandbox. Check console logs and stack traces, set breakpoints in source files, and review code additions systematically."
  },
  {
    id: 2,
    question: "What are best practices for code reviews and team collaboration?",
    optimalKeywords: ["constructive", "feedback", "pr", "standards", "communication", "respect"],
    sampleAnswer: "Keep reviews constructive and aligned with style rules. Focus on code structure and test coverage rather than syntax styling, and maintain open, respectful communication channels."
  },
  {
    id: 3,
    question: "How do you manage software dependencies and security vulnerabilities?",
    optimalKeywords: ["audit", "version", "update", "patch", "package", "vulnerability"],
    sampleAnswer: "Run npm audit regular checks, update deprecated packages to secure patch versions, lock configuration structures, and minimize reliance on undocumented modules."
  },
  {
    id: 4,
    question: "How do you design scalable applications with user privacy in mind?",
    optimalKeywords: ["encryption", "privacy", "gdpr", "sanitize", "rbac", "secure"],
    sampleAnswer: "Sanitize all user inputs, restrict endpoints using Role-Based Access Control, encrypt stored passwords and credentials, and comply with standards like GDPR."
  },
  {
    id: 5,
    question: "Explain the importance of version control systems in production projects.",
    optimalKeywords: ["git", "branch", "conflict", "merge", "rollback", "commit"],
    sampleAnswer: "VCS tracking permits isolated branch updates, facilitates seamless code merging, preserves a clear log of modifications, and enables fast rollbacks when software bugs breach production."
  }
];

const InterviewSession = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [answersLog, setAnswersLog] = useState([]);
  
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  // Initialize questions
  useEffect(() => {
    const list = QUESTIONS_REPO[role] || DEFAULT_QUESTIONS;
    
    // Customize questions list dynamically if user has resume details
    // For example, if user has Firebase / Python, we insert 1 custom question!
    const fetchUserSkills = async () => {
      try {
        const analysis = await getLatestAnalysisResult(user?.uid);
        if (analysis && analysis.skills) {
          const userSkills = analysis.skills;
          const updatedList = [...list];
          
          if (userSkills.includes('Firebase') && role === 'frontend') {
            updatedList[2] = {
              id: 3,
              question: "Your resume lists Firebase. How do you handle secure read/write rules in Firestore?",
              optimalKeywords: ["security rules", "auth", "firestore", "allow", "request.auth"],
              sampleAnswer: "Firestore security rules enforce access controls. Ensure matches restrict read/write access based on auth tokens, e.g., 'allow write: if request.auth != null && request.auth.uid == userId'."
            };
          } else if (userSkills.includes('Python') && role === 'data-scientist') {
            updatedList[2] = {
              id: 3,
              question: "Your resume highlights Python. Explain list comprehensions vs map() filters in performance.",
              optimalKeywords: ["comprehension", "map", "filter", "iterator", "generator"],
              sampleAnswer: "List comprehensions are generally faster and cleaner in Python. Map returns an iterator, saving memory for massive arrays but taking marginally longer for basic array mapping."
            };
          }
          setQuestions(updatedList);
        } else {
          setQuestions(list);
        }
      } catch (e) {
        setQuestions(list);
      }
    };

    if (user?.uid) {
      fetchUserSkills();
    } else {
      setQuestions(list);
    }
  }, [role, user]);

  useEffect(() => {
    if (!sessionCompleted || sessionSaved || !user?.uid || answersLog.length === 0) return;

    const persistSession = async () => {
      try {
        const scores = answersLog.map((entry) => entry.score);
        const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        const topScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const strongAnswers = answersLog.filter((entry) => entry.score >= 75).length;
        const weakAnswers = answersLog.filter((entry) => entry.score < 50).length;

        let grade = 'C';
        let performance = 'Needs Improvement';
        if (avgScore >= 90) {
          grade = 'A+';
          performance = 'Excellent';
        } else if (avgScore >= 80) {
          grade = 'A';
          performance = 'Strong';
        } else if (avgScore >= 70) {
          grade = 'B';
          performance = 'Good';
        } else if (avgScore >= 60) {
          grade = 'C+';
          performance = 'Fair';
        }

        await saveInterviewSession(user.uid, {
          role,
          avgScore,
          topScore,
          lowestScore,
          grade,
          performance,
          answeredCount: answersLog.length,
          strongAnswers,
          weakAnswers,
          answers: answersLog,
          durationSeconds: 0,
        });
        setSessionSaved(true);
      } catch (error) {
        console.error('Failed to save interview session:', error);
      }
    };

    persistSession();
  }, [sessionCompleted, sessionSaved, user, answersLog, role]);

  const handleNext = () => {
    setFeedback(null);
    setUserAnswer('');
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const submitAnswer = () => {
    if (!userAnswer.trim()) {
      toast.error("Please enter your response before submitting.");
      return;
    }

    setEvaluating(true);
    const questionObj = questions[currentIdx];

    // Local AI response scorer
    setTimeout(() => {
      const normalizedAnswer = userAnswer.toLowerCase();
      let matchedCount = 0;
      
      questionObj.optimalKeywords.forEach(kw => {
        if (normalizedAnswer.includes(kw)) matchedCount++;
      });

      const keywordRatio = matchedCount / questionObj.optimalKeywords.length;
      let score = 30; // base score if they wrote something

      if (userAnswer.length > 200) score += 20;
      else if (userAnswer.length > 100) score += 10;

      score += Math.round(keywordRatio * 50);
      if (score > 100) score = 100;

      let scoreFeedback = "Good attempt! Add more key terminology to improve.";
      if (score >= 90) scoreFeedback = "Outstanding answer! You hit all primary technical requirements.";
      else if (score >= 75) scoreFeedback = "Strong response. Nice detail and appropriate structure.";
      else if (score < 50) scoreFeedback = "Your response is brief. Try adding definitions, structure, and real-world examples.";

      const report = {
        questionNum: currentIdx + 1,
        question: questionObj.question,
        score,
        userAnswer,
        feedback: scoreFeedback,
        optimal: questionObj.sampleAnswer
      };

      setFeedback(report);
      setAnswersLog(prev => [...prev, report]);
      setEvaluating(false);
      toast.success("Answer graded successfully!");
    }, 1500);
  };

  const getAvgScore = () => {
    if (answersLog.length === 0) return 0;
    const total = answersLog.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(total / answersLog.length);
  };

  const chartData = answersLog.map(log => ({
    name: `Q${log.questionNum}`,
    Score: log.score
  }));

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <FiLoader className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeQuestion = questions[currentIdx];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Back to Prep */}
      <Link to="/interview-prep" className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 font-medium">
        <FiArrowLeft />
        <span>Cancel Interview</span>
      </Link>

      <AnimatePresence mode="wait">
        {!sessionCompleted ? (
          <motion.div
            key={`question-${currentIdx}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Session Info Bar */}
            <div className="flex items-center justify-between bg-white/40 dark:bg-gray-800/40 border border-white/20 dark:border-gray-700/50 rounded-2xl p-4 backdrop-blur-xl">
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Interview Practice</span>
                <h2 className="text-sm font-black text-gray-900 dark:text-white capitalize">{role.replace('-', ' ')}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Progress</span>
                <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                  Question {currentIdx + 1} of {questions.length}
                </p>
              </div>
            </div>

            {/* Main Question Card */}
            <div className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
              <div className="space-y-2">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">Question prompt</span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-relaxed">
                  {activeQuestion.question}
                </h3>
              </div>

              {!feedback ? (
                <div className="space-y-4">
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your response here... (Write at least 1-2 detailed sentences for better feedback)"
                    rows={6}
                    disabled={evaluating}
                    className="w-full p-4 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-sm leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={submitAnswer}
                      disabled={evaluating || !userAnswer.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg transition-all"
                    >
                      {evaluating ? (
                        <>
                          <FiLoader className="w-5 h-5 animate-spin" />
                          <span>Evaluating answer...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Response</span>
                          <FiSend />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 border-t border-gray-200 dark:border-gray-700/50 pt-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${feedback.score >= 75 ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-600'}`}>
                        {feedback.score >= 75 ? <FiCheck size={24} /> : <FiAlertCircle size={24} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">AI Feedback Generated</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Response evaluation result</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-3xl font-black text-gray-900 dark:text-white">{feedback.score}</span>
                      <span className="text-sm font-bold text-gray-500">/ 100</span>
                    </div>
                  </div>

                  <div className="space-y-4 bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-200/50 dark:border-gray-700/30 text-sm">
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Assessment</span>
                      <p className="text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{feedback.feedback}</p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Model Answer / Key Elements</span>
                      <p className="text-gray-700 dark:text-gray-300 mt-1 leading-relaxed italic">{feedback.optimal}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 font-bold rounded-xl shadow-md transition"
                    >
                      <span>{currentIdx + 1 === questions.length ? "Finish Session" : "Next Question"}</span>
                      <FiChevronRight />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Interview Complete Summary Dashboard */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-8"
          >
            {/* Header Result */}
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl">
                <FiAward size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Interview Complete!</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm">
                Congratulations on finishing your practice session for the <strong className="capitalize">{role.replace('-', ' ')}</strong> role.
              </p>
            </div>

            {/* Score Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/30 text-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Average Score</span>
                <p className="text-4xl font-black text-blue-600 dark:text-blue-400 mt-2">{getAvgScore()}%</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/30 text-center md:col-span-2 flex flex-col justify-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Progress Graph</span>
                <div className="w-full h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar dataKey="Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Answer Breakdown Accordions */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Session Questions Log</h3>
              <div className="space-y-3">
                {answersLog.map((log) => (
                  <div key={log.questionNum} className="border border-gray-200 dark:border-gray-700/50 rounded-2xl p-5 bg-white/40 dark:bg-gray-900/20">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                        {log.questionNum}. {log.question}
                      </h4>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs font-bold shrink-0">
                        {log.score}/100
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                      <strong>Your Answer: </strong>{log.userAnswer}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 leading-relaxed border-t border-gray-200 dark:border-gray-800 pt-2">
                      <strong>AI Tip: </strong>{log.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Finish Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/interview-prep" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg text-center hover:opacity-95 transition">
                Return to Interview Hub
              </Link>
              <button onClick={() => window.location.reload()} className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Try Session Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InterviewSession;
