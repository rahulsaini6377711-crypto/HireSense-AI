import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Full name is required');
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signup(formData.email, formData.password, formData.name.trim());
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/30 bg-white/70 dark:bg-gray-900/60 backdrop-blur-2xl shadow-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">HS</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Join thousands of successful job seekers
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-white/50 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white/80"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-white/50 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white/80"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-white/50 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white/80"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-white/50 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white/80"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mt-1"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Privacy Policy
                </a>
              </span>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </motion.button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
