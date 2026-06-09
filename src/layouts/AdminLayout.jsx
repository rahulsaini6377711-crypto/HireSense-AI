import React from 'react';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
