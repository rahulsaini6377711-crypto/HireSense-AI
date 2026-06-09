import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { validateFileType, validateFileSize } from '../utils/validators';

const ResumeUploader = ({ onUpload }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    processFile(droppedFiles[0]);
  };

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const processFile = (file) => {
    if (!file) return;

    // Validate file type
    if (!validateFileType(file, ['application/pdf'])) {
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (!validateFileSize(file, 5)) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsLoading(true);
    try {
      await onUpload(file);
      toast.success('Resume uploaded successfully!');
      setFile(null);
    } catch (error) {
      toast.error('Error uploading resume');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
        }`}
      >
        <FiUpload className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Upload Your Resume
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Drag and drop your PDF file here or click to browse
        </p>

        <input
          type="file"
          id="resume-upload"
          className="hidden"
          accept=".pdf"
          onChange={handleFileInput}
        />

        <label htmlFor="resume-upload">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            as="span"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer inline-block"
          >
            Select File
          </motion.button>
        </label>

        {/* File info */}
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-center space-x-2 text-green-600 dark:text-green-400"
          >
            <FiCheck size={20} />
            <span className="text-sm font-medium">{file.name}</span>
          </motion.div>
        )}
      </div>

      {/* Upload button */}
      {file && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUpload}
          disabled={isLoading}
          className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Uploading...' : 'Upload Resume'}
        </motion.button>
      )}
    </motion.div>
  );
};

export default ResumeUploader;
