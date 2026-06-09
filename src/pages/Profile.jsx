import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit2, FiSave, FiLogOut, FiMail, FiPhone } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: user?.displayName || 'John Doe',
    email: user?.email || 'john@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Passionate developer with 5+ years of experience in web development.',
    skills: ['React', 'Node.js', 'Python', 'AWS', 'PostgreSQL'],
  });

  React.useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      name: user?.displayName || prev.name,
      email: user?.email || prev.email,
    }));
  }, [user]);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Could not log out');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account information</p>
        </div>
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-medium shadow-lg"
        >
          {isEditing ? (
            <>
              <FiSave size={20} />
              <span>Save</span>
            </>
          ) : (
            <>
              <FiEdit2 size={20} />
              <span>Edit</span>
            </>
          )}
        </button>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start space-x-6 mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {(profile.name || 'U')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="text-2xl font-bold bg-transparent border-b-2 border-blue-600 text-gray-900 dark:text-white focus:outline-none"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.name}
              </h2>
            )}
            {isEditing ? (
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="bg-transparent border-b border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 focus:outline-none"
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-2"><FiMail /> {user?.emailVerified ? 'Verified' : 'Email connected'}</span>
              <span className="inline-flex items-center gap-2"><FiPhone /> Auth session active</span>
            </div>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-6">
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{profile.phone}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{profile.location}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={profile.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{profile.bio}</p>
            )}
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8"
      >
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4">
          Danger Zone
        </h3>
        <p className="text-red-600 dark:text-red-400 mb-4">
          Deleting your account is permanent and cannot be undone.
        </p>
        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
          Delete Account
        </button>
      </motion.div>

      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow"
        >
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
