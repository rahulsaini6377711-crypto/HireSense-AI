import { 
  generateQuestionsWithGemini, 
  evaluateAnswerWithGemini 
} from './geminiService';

/**
 * Generate interview questions based on resume text, company, and career level
 * @param {string} resumeText - The extracted text of the resume
 * @param {Object} options - Custom options: { company: string, level: string }
 * @returns {Promise<Object>} Object containing question lists grouped by category
 */
export const generateInterviewQuestions = async (resumeText, options = {}) => {
  return generateQuestionsWithGemini(resumeText, options);
};

/**
 * Evaluate user-typed response for a specific question
 * @param {string} question - The question asked
 * @param {string} expectedAnswer - The expected target answer
 * @param {string} userAnswer - The user's typed response
 * @param {string} difficulty - The difficulty level of the question
 * @returns {Promise<Object>} Grade metrics and qualitative feedback
 */
export const evaluateInterviewAnswer = async (question, expectedAnswer, userAnswer, difficulty) => {
  return evaluateAnswerWithGemini(question, expectedAnswer, userAnswer, difficulty);
};
