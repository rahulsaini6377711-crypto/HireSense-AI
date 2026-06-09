import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiTrash2, FiEye, FiRefreshCw, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminUserReportsModal from './AdminUserReportsModal';
import { useAuth } from '../../hooks/useAuth';
import { getAllUsers, deleteUser, getUserReport } from '../../services/userService';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = value.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (userId) => {
    try {
      setReportLoading(true);
      const report = await getUserReport(userId);
      setSelectedReport(report);
    } catch (err) {
      toast.error('Failed to load user report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === user.uid) {
      toast.error('You cannot delete your own account');
      return;
    }

    const confirmed = window.confirm(
      `Delete user ${userEmail}? This removes all their resumes, analyses, sessions, and job matches.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(userId);
      await deleteUser(userId, user);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.name?.toLowerCase().includes(term) ||
      u.id?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-gray-400">View, report on, and manage platform users.</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition border border-gray-700"
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wide">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{u.name || 'Unnamed User'}</p>
                        <p className="text-gray-500 text-sm">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {u.role === 'admin' && <FiShield size={12} />}
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewReport(u.id)}
                          disabled={reportLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition disabled:opacity-50"
                        >
                          <FiEye size={14} />
                          Report
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            disabled={deletingId === u.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50"
                          >
                            <FiTrash2 size={14} />
                            {deletingId === u.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReport && (
        <AdminUserReportsModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
};

export default AdminUsers;
