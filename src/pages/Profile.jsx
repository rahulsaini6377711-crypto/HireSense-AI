import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit2, FiSave, FiLogOut, FiMail, FiPhone, FiMapPin, FiBriefcase, FiX, FiPlus, FiCheck } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { updateUserProfile } from '../services/userService';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';

const Profile = () => {
  useSEO('Profile Management', 'Configure your professional developer profile, biography, and technical tags.');
  const { user, userProfile, refreshUserProfile, logout } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    skills: [],
  });

  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || user?.displayName || '',
        email: userProfile.email || user?.email || '',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        skills: userProfile.skills || [],
      });
    }
  }, [userProfile, user]);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await updateUserProfile(user.uid, {
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        skills: profile.skills,
      });

      await refreshUserProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully');
      addNotification('Profile Update', 'Your profile details have been updated successfully.', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    if (!newSkill.trim()) return;
    if (profile.skills.includes(newSkill.trim())) {
      toast.error('Skill already exists');
      return;
    }
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill.trim()]
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
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
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account and professional details</p>
        </div>
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition font-medium shadow-lg"
        >
          {isEditing ? (
            <>
              <FiSave size={20} />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </>
          ) : (
            <>
              <FiEdit2 size={20} />
              <span>Edit Profile</span>
            </>
          )}
        </button>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 border-b border-gray-150 dark:border-gray-700 pb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-inner shrink-0 text-white text-3xl font-black">
            {(profile.name || 'User')
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            {isEditing ? (
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Full Name"
                className="text-2xl font-black bg-transparent border-b-2 border-blue-600 text-gray-900 dark:text-white focus:outline-none w-full max-w-md"
              />
            ) : (
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                {profile.name || 'Your Name'}
              </h2>
            )}
            <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center sm:justify-start gap-2">
              <FiMail className="shrink-0" /> {profile.email}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 rounded-full">
                <FiCheck className="shrink-0" /> Verified Account
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30 rounded-full capitalize">
                👑 {userProfile?.role || 'User'} Tier
              </span>
            </div>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              {isEditing ? (
                <div className="relative">
                  <FiPhone className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              ) : (
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/30 px-4 py-3 rounded-xl border border-gray-200/50 dark:border-gray-750">
                  {profile.phone || <span className="text-gray-400 italic">No phone number set</span>}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Location
              </label>
              {isEditing ? (
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="City, Country"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              ) : (
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/30 px-4 py-3 rounded-xl border border-gray-200/50 dark:border-gray-750">
                  {profile.location || <span className="text-gray-400 italic">No location set</span>}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              Professional Bio
            </label>
            {isEditing ? (
              <textarea
                value={profile.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Share a brief summary of your professional background, goals, and experience..."
                rows={4}
                className="w-full p-4 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-sm leading-relaxed"
              />
            ) : (
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900/30 px-4 py-3 rounded-xl border border-gray-200/50 dark:border-gray-750 text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio || <span className="text-gray-400 italic">No professional bio set</span>}
              </p>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              Technical Skill Tags
            </label>
            
            {isEditing ? (
              <div className="space-y-4">
                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <div className="relative flex-1">
                    <FiBriefcase className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Type a skill (e.g. React, Python) and press enter"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-md transition"
                  >
                    <FiPlus /> Add
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-350 dark:border-gray-700">
                  {profile.skills.length === 0 ? (
                    <span className="text-sm text-gray-400 italic">No skill tags added yet. Type tags above.</span>
                  ) : (
                    profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30 rounded-lg text-sm font-bold"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <FiX size={14} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.length === 0 ? (
                  <span className="text-gray-400 italic">No skills listed yet</span>
                ) : (
                  profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-100/30 dark:border-blue-900/30 text-sm font-bold rounded-lg shadow-sm"
                    >
                      {skill}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Account actions */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition shadow font-semibold"
        >
          <FiLogOut />
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
