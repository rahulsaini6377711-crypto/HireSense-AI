import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiFile, FiX, FiCheck } from 'react-icons/fi';
import { parseResumePDF, validateResumeFile, formatFileSize } from '../services/resumeParser';

const ResumeUploadZone = ({ onFileSelect, onParseComplete, isLoading = false }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Only PDF files are accepted');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file
    const validation = validateResumeFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    // Set uploaded file
    setUploadedFile(file);
    onFileSelect?.(file);

    // Parse resume
    setParsing(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 500);

      const parsedData = await parseResumePDF(file);

      clearInterval(progressInterval);
      setProgress(100);

      toast.success('Resume parsed successfully!');
      onParseComplete?.(parsedData);

      // Reset after 1 second
      setTimeout(() => {
        setParsing(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      toast.error(error.message || 'Failed to parse resume');
      setParsing(false);
      setProgress(0);
      setUploadedFile(null);
    }
  }, [onFileSelect, onParseComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: parsing || isLoading,
  });

  const handleRemove = () => {
    setUploadedFile(null);
    setProgress(0);
  };

  return (
    <div className="w-full">
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
          } ${parsing || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <FiUploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isDragActive ? 'Drop your resume here' : 'Drag and drop your resume'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                or click to browse from your computer
              </p>
            </div>

            <div className="flex gap-4 flex-wrap justify-center text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FiFile className="w-4 h-4" />
                PDF only
              </span>
              <span>Max 10 MB</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-300 dark:border-gray-600 rounded-3xl p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                <FiFile className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {uploadedFile.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>

              {parsing ? (
                <div className="flex-shrink-0">
                  <div className="animate-spin">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-blue-600 rounded-full" />
                  </div>
                </div>
              ) : (
                <FiCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
              )}
            </div>

            {!parsing && (
              <button
                onClick={handleRemove}
                className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>

          {parsing && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Parsing resume...</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeUploadZone;
