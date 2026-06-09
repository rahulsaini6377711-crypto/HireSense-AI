import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import ErrorBoundary from '../components/ErrorBoundary';
import { PageSkeleton } from '../components/Skeleton';

// Lazy load Pages for Code Splitting and Performance Optimization
const Home = React.lazy(() => import('../pages/Home'));
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const ResumeAnalysis = React.lazy(() => import('../pages/ResumeAnalysis'));
const InterviewPrep = React.lazy(() => import('../pages/InterviewPrep'));
const InterviewSession = React.lazy(() => import('../pages/InterviewSession'));
const JobMatcher = React.lazy(() => import('../pages/JobMatcher'));
const Profile = React.lazy(() => import('../pages/Profile'));
const UserSettings = React.lazy(() => import('../pages/UserSettings'));
const SavedJobMatches = React.lazy(() => import('../pages/SavedJobMatches'));
const InterviewHistory = React.lazy(() => import('../pages/InterviewHistory'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('../pages/admin/AdminUsers'));
const AdminActivityLogs = React.lazy(() => import('../pages/admin/AdminActivityLogs'));

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="p-8 max-w-7xl">
          <PageSkeleton />
        </div>
      }>
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
            path="/interview-history"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <InterviewHistory />
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
            path="/saved-jobs"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SavedJobMatches />
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

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <UserSettings />
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
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
