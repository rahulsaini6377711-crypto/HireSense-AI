// Constants for the application
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  RESUME_ANALYSIS: '/resume-analysis',
  INTERVIEW_PREP: '/interview-prep',
  JOB_MATCHER: '/job-matcher',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_ACTIVITY: '/admin/activity',
};

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USER: '/api/user',
  RESUME: '/api/resume',
  INTERVIEW: '/api/interview',
  JOBS: '/api/jobs',
};

export const TOAST_MESSAGES = {
  SUCCESS: 'Success!',
  ERROR: 'Something went wrong!',
  LOADING: 'Loading...',
  UPLOAD_SUCCESS: 'File uploaded successfully!',
  UPLOAD_ERROR: 'Error uploading file.',
  LOGIN_SUCCESS: 'Welcome back!',
  LOGIN_ERROR: 'Login failed. Please try again.',
  REGISTER_SUCCESS: 'Account created successfully!',
  REGISTER_ERROR: 'Registration failed.',
};

export const RESUME_FEATURES = {
  ANALYSIS: 'Resume Analysis',
  ATS_SCORE: 'ATS Score',
  INTERVIEW: 'Interview Questions',
  JOB_MATCH: 'Job Match Score',
};
