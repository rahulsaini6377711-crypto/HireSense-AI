import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { FiMenu, FiX, FiLogOut, FiUser, FiSun, FiMoon, FiShield, FiBell, FiSettings, FiCheckCircle, FiInfo, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="text-emerald-500 w-4 h-4 shrink-0 mt-0.5" />;
      case 'error':
        return <FiAlertTriangle className="text-red-500 w-4 h-4 shrink-0 mt-0.5" />;
      default:
        return <FiInfo className="text-blue-500 w-4 h-4 shrink-0 mt-0.5" />;
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">HS</span>
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              HireSense AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl text-gray-500 dark:text-gray-450 hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-sm border border-gray-150 dark:border-gray-700/60"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <FiSun size={18} className="text-yellow-500" /> : <FiMoon size={18} />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications Center */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2.5 rounded-xl text-gray-500 dark:text-gray-450 hover:bg-gray-100 dark:hover:bg-gray-800 transition relative shadow-sm border border-gray-150 dark:border-gray-700/60"
                    aria-label="Notifications"
                  >
                    <FiBell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden z-50"
                      >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Notifications</h3>
                          <div className="flex gap-2">
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Mark all read
                              </button>
                            )}
                            {notifications.length > 0 && (
                              <button
                                onClick={clearAll}
                                className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-0.5"
                              >
                                <FiTrash2 /> Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* List */}
                        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-750/30">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-xs italic">
                              No notifications yet.
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => markAsRead(n.id)}
                                className={`p-4 text-left cursor-pointer transition ${
                                  n.read ? 'bg-white hover:bg-gray-50 dark:bg-gray-850 dark:hover:bg-gray-800' : 'bg-blue-50/40 hover:bg-blue-50/70 dark:bg-blue-950/10 dark:hover:bg-blue-950/20'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  {getNotifIcon(n.type)}
                                  <div className="space-y-1">
                                    <h4 className={`text-xs font-bold text-gray-900 dark:text-white ${!n.read && 'text-blue-600 dark:text-blue-400'}`}>
                                      {n.title}
                                    </h4>
                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-normal">
                                      {n.message}
                                    </p>
                                    <span className="text-[9px] text-gray-400 dark:text-gray-500 block">
                                      {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(n.createdAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition"
                >
                  Dashboard
                </Link>
                
                <Link
                  to="/profile"
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition inline-flex items-center gap-1.5"
                >
                  <FiUser size={15} />
                  Profile
                </Link>

                <Link
                  to="/settings"
                  className="p-2.5 rounded-xl text-gray-500 dark:text-gray-450 hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-sm border border-gray-150 dark:border-gray-700/60"
                  aria-label="Settings"
                >
                  <FiSettings size={17} />
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 rounded-xl text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition inline-flex items-center gap-1.5"
                  >
                    <FiShield size={14} />
                    Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-705 transition shadow shadow-red-500/10"
                >
                  <FiLogOut className="mr-1.5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-750 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition shadow-md shadow-blue-500/10"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <FiSun size={18} className="text-yellow-500" /> : <FiMoon size={18} />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? 'auto' : 0 }}
          transition={{ duration: 0.25 }}
          className="md:hidden overflow-hidden"
        >
          <div className="px-2 pt-2 pb-4 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-xl text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-xl text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-xl text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Settings
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-base font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 transition shadow-md shadow-red-500/15"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-xl text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition shadow-md shadow-blue-500/15"
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
