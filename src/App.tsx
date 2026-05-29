import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout, AdminLayout, PublicLayout } from './components/Layout';

// Base Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import EditEntry from './pages/EditEntry';
import ViewEntry from './pages/ViewEntry';
import Vault from './pages/Vault';
import SecurityMonitor from './pages/SecurityMonitor';
import Notifications from './pages/Notifications';

import {
  AboutPage,
  AdminDatabasePage,
  AdminDiariesPage,
  AdminNotificationsPage,
  AdminReportsPage,
  AdminSecurityPage,
  AdminSettingsPage,
  ForgotPasswordPage,
  PricingPage,
  SettingsPage,
  SupportPage,
  TermsPage,
} from './pages/ModulePages';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminLogs from './pages/Admin/Logs';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<PublicLayout />}>
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Route>

            {/* User Routes (Protected) */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/entry/new" element={<NewEntry />} />
              <Route path="/entry/:id" element={<ViewEntry />} />
              <Route path="/entry/:id/edit" element={<EditEntry />} />
              <Route path="/security" element={<SecurityMonitor />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Route>

            {/* Admin Routes (Security Check) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/diaries" element={<AdminDiariesPage />} />
              <Route path="/admin/security" element={<AdminSecurityPage />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/database" element={<AdminDatabasePage />} />
              <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="/forbidden" element={
              <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center space-y-6 sm:p-12 sm:space-y-8">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-error shadow-[0_0_50px_rgba(255,180,171,0.4)] sm:h-40 sm:w-40">
                  <span className="material-symbols-outlined text-[72px] text-error font-black sm:text-[100px]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                </div>
                <h1 className="text-2xl font-extrabold text-error sm:text-4xl">UNAUTHORIZED ACCESS DETECTED</h1>
                <p className="max-w-md text-sm text-on-surface-variant sm:text-base">Your security clearance does not permit entry into this sector. IP logged. Protocol 403 active.</p>
                <button onClick={() => window.location.href = import.meta.env.BASE_URL} className="rounded-full bg-error px-6 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-xl transition-all hover:scale-105 active:scale-95 sm:px-8 sm:py-4">Return to Secure Checkpoint</button>
              </div>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
