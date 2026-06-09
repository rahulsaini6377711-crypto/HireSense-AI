// API service for general API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const headers = {
  'Content-Type': 'application/json',
};

export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

export const GET = (endpoint, options = {}) => {
  return apiCall(endpoint, {
    ...options,
    method: 'GET',
  });
};

export const POST = (endpoint, data, options = {}) => {
  return apiCall(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const PUT = (endpoint, data, options = {}) => {
  return apiCall(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const DELETE = (endpoint, options = {}) => {
  return apiCall(endpoint, {
    ...options,
    method: 'DELETE',
  });
};
