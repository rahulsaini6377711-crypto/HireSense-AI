import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiBarChart2,
  FiUsers,
  FiActivity,
  FiShield,
  FiArrowLeft,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { ROUTES } from '../utils/constants';

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Overview', path: ROUTES.ADMIN, icon: FiBarChart2, exact: true },
    { name: 'User Management', path: ROUTES.ADMIN_USERS, icon: FiUsers },
    { name: 'Activity Logs', path: ROUTES.ADMIN_ACTIVITY, icon: FiActivity },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 text-amber-400">
          <FiShield size={18} />
          <span className="text-sm font-bold uppercase tracking-wider">Admin Panel</span>
        </div>
      </div>

      <nav className="p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);

          return (
            <motion.div key={item.path} whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
                  active
                    ? 'bg-amber-500/10 text-amber-400 border-l-4 border-amber-500'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            </motion.div>
          );
        })}

        <div className="mt-8 pt-4 border-t border-gray-800">
          <Link
            to={ROUTES.DASHBOARD}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition"
          >
            <FiArrowLeft size={20} />
            <span className="font-medium">Back to App</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
