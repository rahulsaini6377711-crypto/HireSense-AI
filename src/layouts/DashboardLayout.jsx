import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
