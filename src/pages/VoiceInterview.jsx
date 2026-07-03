import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiMic, FiMicOff, FiVolume2, FiVolumeX, FiLoader, FiCheckCircle, FiAlertCircle, FiAward, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { evaluateAnswerWithGemini } from '../services/geminiService';
import { useSEO } from '../hooks/useSEO';

const VoiceInterview = () => {
  useSEO('AI Voice Interview', 'Participate in hands-free mock voice interviews with Speech-to-Text and vocal playback.');
  const { user } = useAuth();

  // Questions set (Voice specific)
  const voiceQuestions = [
    { id: 1, question: "Can you tell me about your background and highlight your core technical projects?", difficulty: "Medium", expectedAnswer: "Clear overview of skills, framework depth, and dynamic engineering problems solved." },
    { id: 2, question: "Explain the difference between synchronous and asynchronous code. When would you use which?", difficulty: "Medium", expectedAnswer: "Definitions of blocking vs non-blocking execution, event loop mechanics, and async/await syntax usage." },
    { id: 3, question: "How do you handle disagreement in technical direction with a senior teammate?", difficulty: "Easy", expectedAnswer: "Conflict resolution skills, active listening, focus on data/benchmarks, and compromise." }
  ];

  // Session state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [scores, setScores] = useState([]);

  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(prev => prev + ' ' + finalTranscript);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          toast.error('Microphone permission denied.');
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    } else {
      console.warn('Speech recognition not supported in this browser.');
    }
  }, []);

  // Vocalize question on transition
  useEffect(() => {
    if (ttsEnabled && !sessionCompleted) {
      speakQuestion(voiceQuestions[currentIdx].question);
    }
  }, [currentIdx, sessionCompleted]);

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any pending vocalization
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleRecord = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser. Please type your response.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.success('Microphone active. Start speaking!');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmitResponse = async () => {
    if (!transcript.trim()) {
      toast.error('Please record or type a response first.');
      return;
    }

    const currentQ = voiceQuestions[currentIdx];

    try {
      setEvaluating(true);
      toast.loading('Gemini is listening and grading...', { id: 'grading' });
      
      const evaluation = await evaluateAnswerWithGemini(
        currentQ.question,
        currentQ.expectedAnswer,
        transcript,
        currentQ.difficulty
      );

      setCurrentEvaluation(evaluation);
      setScores(prev => [...prev, evaluation.score]);
      
      toast.success('Answer graded!', { id: 'grading' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to evaluate answer.', { id: 'grading' });
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = async () => {
    // Reset states
    setCurrentEvaluation(null);
    setTranscript('');

    if (currentIdx < voiceQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setSessionCompleted(true);
      // Save full session summary to Firestore
      try {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        await addDoc(collection(db, 'interview_sessions'), {
          userId: user?.uid || 'guest',
          type: 'Voice',
          averageScore: Math.round(avgScore),
          questionsCount: voiceQuestions.length,
          createdAt: serverTimestamp()
        });
        toast.success('Voice interview session saved to logs!');
      } catch (e) {
        console.error('Failed to log voice session to database:', e);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">AI Voice Interview Prep</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Practice responses vocally and get graded by Gemini AI.</p>
        </div>
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          className={`p-3 rounded-xl border transition ${
            ttsEnabled
              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400'
              : 'bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
          }`}
          title={ttsEnabled ? 'Mute AI voice output' : 'Enable AI voice output'}
        >
          {ttsEnabled ? <FiVolume2 size={18} /> : <FiVolumeX size={18} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!sessionCompleted ? (
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Question card */}
            <div className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Question {currentIdx + 1} of {voiceQuestions.length}</span>
                <span className="px-2 py-0.5 border border-amber-200 text-amber-600 dark:border-amber-900/40 rounded uppercase font-bold text-[9px]">{voiceQuestions[currentIdx].difficulty}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
                {voiceQuestions[currentIdx].question}
              </h2>
              <button
                onClick={() => speakQuestion(voiceQuestions[currentIdx].question)}
                className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 dark:text-blue-450 hover:underline"
              >
                <FiVolume2 /> Replay Audio
              </button>
            </div>

            {/* Speaking / Transcription box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              <div className="md:col-span-8 flex flex-col justify-between bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 p-6 rounded-3xl shadow-lg min-h-[220px]">
                <textarea
                  rows={4}
                  placeholder="Your voice transcription will populate here. You can also edit/type directly."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="w-full bg-transparent outline-none resize-none border-none text-xs leading-relaxed text-gray-800 dark:text-white"
                />
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-850">
                  <button
                    onClick={handleToggleRecord}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${
                      isRecording
                        ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                    }`}
                  >
                    {isRecording ? <><FiMicOff /> Stop Mic</> : <><FiMic /> Record Answer</>}
                  </button>

                  <button
                    onClick={handleSubmitResponse}
                    disabled={evaluating || !transcript.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-500/10"
                  >
                    {evaluating ? <FiLoader className="animate-spin" /> : 'Evaluate Answer'}
                  </button>
                </div>
              </div>

              {/* Bouncing audio wave indicator */}
              <div className="md:col-span-4 bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-250 dark:border-gray-800 rounded-3xl p-6 flex flex-col justify-center items-center text-center">
                {isRecording ? (
                  <div className="space-y-4">
                    <div className="flex justify-center items-end gap-1 h-12">
                      <span className="w-1 bg-blue-500 h-8 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 bg-blue-500 h-12 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 bg-blue-500 h-6 rounded-full animate-bounce" />
                      <span className="w-1 bg-blue-500 h-10 rounded-full animate-bounce [animation-delay:-0.2s]" />
                      <span className="w-1 bg-blue-500 h-4 rounded-full animate-bounce [animation-delay:-0.4s]" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Listening...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FiMic className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto" />
                    <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">Microphone Standby</p>
                  </div>
                )}
              </div>
            </div>

            {/* Evaluation Results Drawer */}
            {currentEvaluation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white dark:bg-gray-850 border border-emerald-100 dark:border-emerald-950/20 p-6 rounded-3xl shadow-xl space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-emerald-500 w-5 h-5" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Grading Performance Breakdown</h3>
                  </div>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450">{currentEvaluation.score}/100</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 uppercase text-[10px]">Communication Strengths</h4>
                    <ul className="list-disc pl-4 text-gray-700 dark:text-gray-300 space-y-1">
                      {currentEvaluation.strengths?.map((s, i) => <li key={i}>{s}</li>) || <li>Readable metrics</li>}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 uppercase text-[10px]">Identified Gaps / Weaknesses</h4>
                    <ul className="list-disc pl-4 text-gray-700 dark:text-gray-300 space-y-1">
                      {currentEvaluation.weaknesses?.map((w, i) => <li key={i}>{w}</li>) || <li>Omissions of scale patterns</li>}
                    </ul>
                  </div>

                  <div className="md:col-span-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1 uppercase text-[10px]">Speech Improvement Advice</h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">{currentEvaluation.improvementSuggestions}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1.5 px-5 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-950 font-bold rounded-xl text-xs transition shadow"
                  >
                    Next Question <FiArrowRight />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 dark:bg-gray-800/60 border border-gray-250 dark:border-gray-700/50 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl max-w-xl mx-auto space-y-6"
          >
            <FiAward className="text-amber-500 w-16 h-16 mx-auto animate-bounce" />
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Voice Session Complete!</h2>
              <p className="text-xs text-gray-500 mt-2">
                Congratulations on wrapping up the vocal coding interview drills.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Average Session Grade</span>
              <h3 className="text-5xl font-black text-blue-600 mt-2">
                {Math.round(scores.reduce((a, b) => a + b, 0) / scores.length || 0)}%
              </h3>
            </div>

            <button
              onClick={() => {
                setCurrentIdx(0);
                setScores([]);
                setSessionCompleted(false);
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition text-xs"
            >
              Restart Vocal Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInterview;
