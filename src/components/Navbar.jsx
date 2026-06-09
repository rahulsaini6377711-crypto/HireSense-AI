import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiMenu, FiX, FiLogOut, FiUser, FiSun, FiMoon, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">HS</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              HireSense AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition mr-2"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <FiSun size={20} className="text-yellow-500" /> : <FiMoon size={20} />}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    <FiUser size={14} />
                    Profile
                  </span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 rounded-md text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FiShield size={14} />
                      Admin
                    </span>
                  </Link>
                )}
                <div className="px-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:block">
                  {user?.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 transition shadow-md"
                >
                  <FiLogOut className="mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? 'auto' : 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300">
              <span>Dark Mode</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {darkMode ? <FiSun size={20} className="text-yellow-500" /> : <FiMoon size={20} />}
              </button>
            </div>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10"
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 transition shadow-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-lg text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

export default Navbar;
