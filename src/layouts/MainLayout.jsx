import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
