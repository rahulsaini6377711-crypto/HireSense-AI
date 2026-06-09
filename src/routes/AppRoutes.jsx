import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import ResumeAnalysis from '../pages/ResumeAnalysis';
import InterviewPrep from '../pages/InterviewPrep';
import InterviewSession from '../pages/InterviewSession';
import JobMatcher from '../pages/JobMatcher';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminActivityLogs from '../pages/admin/AdminActivityLogs';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Main Routes */}
      <Route
        path="/"
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        }
      />

      <Route
        path="/login"
        element={
          <MainLayout>
            <Login />
          </MainLayout>
        }
      />

      <Route
        path="/register"
        element={
          <MainLayout>
            <Register />
          </MainLayout>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/resume-analysis"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ResumeAnalysis />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/interview-prep"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <InterviewPrep />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/interview-prep/:role"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <InterviewSession />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/job-matcher"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <JobMatcher />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/activity"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminActivityLogs />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* 404 Route */}
      <Route
        path="*"
        element={
          <MainLayout>
            <NotFound />
          </MainLayout>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
