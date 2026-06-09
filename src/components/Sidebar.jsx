import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiFileText, FiBriefcase, FiUsers, FiSettings, FiUser, FiBookmark, FiAward } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome },
    { name: 'Resume Analysis', path: '/resume-analysis', icon: FiFileText },
    { name: 'Interview Prep', path: '/interview-prep', icon: FiBriefcase },
    { name: 'Interview Logs', path: '/interview-history', icon: FiAward },
    { name: 'Job Matcher', path: '/job-matcher', icon: FiUsers },
    { name: 'Saved Jobs', path: '/saved-jobs', icon: FiBookmark },
    { name: 'Profile', path: '/profile', icon: FiUser },
    { name: 'Settings', path: '/settings', icon: FiSettings },
  ];

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-16 overflow-y-auto shrink-0 hidden md:block">
      <nav className="p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.div
              key={item.path}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-l-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
