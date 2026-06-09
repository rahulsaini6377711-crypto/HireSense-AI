// OpenAI API service for AI features
// This is a placeholder - implement based on your backend

export const analyzeResume = async (resumeText) => {
  try {
    // Call your backend API instead of directly calling OpenAI
    const response = await fetch('/api/analyze-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resume: resumeText }),
    });

    if (!response.ok) throw new Error('Failed to analyze resume');
    return await response.json();
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
};

export const generateInterviewQuestions = async (jobTitle, resumeText) => {
  try {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobTitle, resume: resumeText }),
    });

    if (!response.ok) throw new Error('Failed to generate questions');
    return await response.json();
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

export const getATSScore = async (resumeText) => {
  try {
    const response = await fetch('/api/ats-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resume: resumeText }),
    });

    if (!response.ok) throw new Error('Failed to get ATS score');
    return await response.json();
  } catch (error) {
    console.error('Error getting ATS score:', error);
    throw error;
  }
};
