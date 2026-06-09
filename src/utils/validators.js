// Validation functions
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const validateForm = (formData, fields) => {
  const errors = {};

  fields.forEach((field) => {
    if (!formData[field] || formData[field].trim() === '') {
      errors[field] = `${field} is required`;
    }
  });

  if (formData.email && !validateEmail(formData.email)) {
    errors.email = 'Invalid email address';
  }

  if (formData.password && !validatePassword(formData.password)) {
    errors.password =
      'Password must be at least 8 characters with uppercase, lowercase, and number';
  }

  return errors;
};

export const validateFileType = (file, allowedTypes = ['application/pdf']) => {
  return allowedTypes.includes(file.type);
};

export const validateFileSize = (file, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};
