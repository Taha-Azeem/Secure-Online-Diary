import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout, AdminLayout } from './components/Layout';
import { Lock, Key, History, Shield, Database } from 'lucide-react';

// Base Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import ViewEntry from './pages/ViewEntry';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminLogs from './pages/Admin/Logs';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Routes (Protected) */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/entries" element={<Dashboard />} />
            <Route path="/entries/new" element={<NewEntry />} />
            <Route path="/entries/:entryId" element={<ViewEntry />} />
            <Route path="/settings" element={<div className="p-12 text-on-surface-variant font-mono uppercase tracking-[0.3em] flex flex-col items-center justify-center min-h-[60vh] gap-4"><Lock size={48} className="opacity-20"/><p>SECURE PROFILE COMMAND: MODULE OFFLINE</p></div>} />
            <Route path="/vault" element={<div className="p-12 text-on-surface-variant font-mono uppercase tracking-[0.3em] flex flex-col items-center justify-center min-h-[60vh] gap-4"><Lock size={48} className="opacity-20"/><p>VAULT OVERVIEW: OFFLINE</p></div>} />
            <Route path="/keys" element={<div className="p-12 text-on-surface-variant font-mono uppercase tracking-[0.3em] flex flex-col items-center justify-center min-h-[60vh] gap-4"><Key size={48} className="opacity-20"/><p>SECURITY KEYS: OFFLINE</p></div>} />
            <Route path="/logs" element={<div className="p-12 text-on-surface-variant font-mono uppercase tracking-[0.3em] flex flex-col items-center justify-center min-h-[60vh] gap-4"><History size={48} className="opacity-20"/><p>ACCESS LOGS: OFFLINE</p></div>} />
          </Route>

          {/* Admin Routes (Security Check) */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/diaries" element={<div className="p-12 text-on-surface-variant font-mono uppercase tracking-[0.3em] flex flex-col items-center justify-center min-h-[60vh] gap-4"><Lock size={48} className="opacity-20"/><p>DIARY MONITORING: OFFLINE</p></div>} />
            <Route path="/admin/security" element={<div className="p-12 text-on-surface-variant font-mono uppercase tracking-[0.3em] flex flex-col items-center justify-center min-h-[60vh] gap-4"><Shield size={48} className="opacity-20"/><p>SECURITY CENTER: OFFLINE</p></div>} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/database" element={<div className="p-12 text-on-surface-variant font-mono uppercase tracking-[0.3em] flex flex-col items-center justify-center min-h-[60vh] gap-4"><Database size={48} className="opacity-20"/><p>DATABASE MANAGEMENT: OFFLINE</p></div>} />
            <Route path="/admin/notifications" element={<div className="p-12 text-on-surface-variant font-mono uppercase tracking-[0.3em]">NOTIFICATIONS: OFFLINE</div>} />
            <Route path="/admin/reports" element={<div className="p-12 text-on-surface-variant font-mono uppercase tracking-[0.3em]">REPORTS: OFFLINE</div>} />
            <Route path="/admin/settings" element={<div className="p-12 text-on-surface-variant font-mono uppercase tracking-[0.3em]">ADMIN SETTINGS: OFFLINE</div>} />
          </Route>

          <Route path="/forbidden" element={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-12 text-center space-y-8">
              <div className="w-40 h-40 flex items-center justify-center rounded-full border-4 border-error shadow-[0_0_50px_rgba(255,180,171,0.4)]">
                <span className="material-symbols-outlined text-[100px] text-error font-black" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              </div>
              <h1 className="text-4xl font-extrabold text-error">UNAUTHORIZED ACCESS DETECTED</h1>
              <p className="text-on-surface-variant max-w-md">Your security clearance does not permit entry into this sector. IP logged. Protocol 403 active.</p>
              <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-error text-white rounded-full font-bold uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">Return to Secure Checkpoint</button>
            </div>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
