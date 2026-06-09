import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(
    () => location.state?.from?.pathname || '/dashboard',
    [location.state],
  );

  const validateEmail = (email) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetChange = (e) => {
    setResetEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!formData.password) {
      toast.error('Password is required');
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!validateEmail(resetEmail)) {
      toast.error('Enter the email address for password reset');
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword(resetEmail);
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(error.message || 'Could not send reset email');
    } finally {
      setIsResetting(false);
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
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between gap-3 text-sm flex-wrap">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => {
                  if (!resetEmail && formData.email) setResetEmail(formData.email);
                  document.getElementById('forgot-password')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <div id="forgot-password" className="mt-6 rounded-2xl border border-white/30 bg-white/60 dark:bg-gray-800/60 p-4">
            <div className="flex items-center gap-2 mb-3 text-gray-900 dark:text-white font-semibold">
              <FiRefreshCw />
              <span>Forgot Password</span>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                value={resetEmail}
                onChange={handleResetChange}
                placeholder="Enter your email to reset password"
                className="w-full px-4 py-3 border border-white/50 dark:border-gray-700 dark:bg-gray-900/60 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white/80"
              />
              <button
                type="submit"
                disabled={isResetting}
                className="w-full py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {isResetting ? 'Sending reset email...' : 'Send Reset Link'}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
            <span className="px-2 text-sm text-gray-500 dark:text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Sign up here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
