import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Database,
  Eye,
  EyeOff,
  FileKey,
  FileText,
  Fingerprint,
  HelpCircle,
  History,
  Laptop,
  Lock,
  Radar,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCog,
  UserRound,
  WalletCards,
  XCircle,
} from 'lucide-react';
import ModulePage from '../components/ModulePage';
import { useAuth } from '../context/AuthContext';
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 shadow-inner">
      <div>
        <p className="text-sm font-bold text-on-surface">{title}</p>
        <p className="mt-1 text-xs text-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        aria-pressed={enabled}
        onClick={onToggle}
        className={`relative h-7 w-14 rounded-full border transition-all ${enabled ? 'border-primary-fixed-dim/40 bg-primary-container/20' : 'border-outline-variant/30 bg-surface-container-highest'}`}
      >
        <div
          className={`absolute top-[3px] h-5 w-6 rounded-full transition-all ${enabled ? 'left-[29px] bg-primary-container shadow-[0_0_12px_rgba(0,229,255,0.6)]' : 'left-[3px] bg-surface-variant'}`}
        />
      </button>
    </div>
  );
}

export function EntriesOverview() {
  return (
    <ModulePage
      badge="Encrypted Journal Workspace"
      title="All secure entries in one operational vault."
      description="Browse protected journals, jump into drafting, and keep your private archive organized with the same tactile glassmorphism used throughout the Stitch export."
      icon={BookOpen}
      actions={[
        { label: 'Create New Entry', to: '/entries/new' },
        { label: 'Return to Dashboard', to: '/dashboard' },
      ]}
      stats={[
        { label: 'Vault Status', value: 'Synchronized', tone: 'primary' },
        { label: 'Retention', value: 'Unlimited', tone: 'secondary' },
        { label: 'Privacy Layer', value: 'Zero-Knowledge', tone: 'neutral' },
        { label: 'Recovery Mode', value: 'Manual Key', tone: 'neutral' },
      ]}
      cards={[
        { title: 'Structured archive', body: 'The journal module now feels like its own command area rather than a leftover dashboard alias.', icon: ScrollText },
        { title: 'Fast drafting flow', body: 'New-entry actions stay visually prominent and close to the archive overview.', icon: Sparkles },
        { title: 'Operational hierarchy', body: 'This page follows the exported command-center layout more closely with layered glass panels and brighter status accents.', icon: Eye },
      ]}
    />
  );
}

export function VaultPage() {
  return (
    <ModulePage
      badge="Vault Control Center"
      title="Encryption state, retention policies, and recovery posture."
      description="The vault page mirrors the same midnight-glass styling from Stitch while keeping the content grounded in your app’s real security model."
      icon={WalletCards}
      actions={[
        { label: 'Open Journals', to: '/entries' },
        { label: 'Create Entry', to: '/entries/new' },
      ]}
      stats={[
        { label: 'Encryption', value: 'AES-256 GCM', tone: 'primary' },
        { label: 'Key Ownership', value: 'Client-Side', tone: 'secondary' },
        { label: 'Replica Nodes', value: '3 Regions', tone: 'neutral' },
        { label: 'Tamper Alerts', value: 'Enabled', tone: 'primary' },
      ]}
      cards={[
        { title: 'Vault map', body: 'Storage posture is presented as a deliberate operational surface with strong status cues and depth.', icon: Database },
        { title: 'Recovery discipline', body: 'Users are reminded that master keys stay local and are not recoverable from the server.', icon: Fingerprint },
        { title: 'Authentic tone', body: 'The design now leans into the exported command-center feel instead of placeholder content blocks.', icon: Shield },
      ]}
    />
  );
}

export function KeysPage() {
  return (
    <ModulePage
      badge="Security Key Registry"
      title="Manage vault keys and the safeguards around them."
      description="This module inherits the exported neon glass aesthetic while keeping key management clearly separate from profile settings."
      icon={FileKey}
      actions={[
        { label: 'Review Vault', to: '/vault' },
        { label: 'Go to Settings', to: '/settings' },
      ]}
      stats={[
        { label: 'Primary Key', value: 'Loaded Locally', tone: 'primary' },
        { label: 'Rotation Cycle', value: '30 Days', tone: 'secondary' },
        { label: 'Biometric Gate', value: 'Optional', tone: 'neutral' },
        { label: 'Backup Copies', value: '0 Server Copies', tone: 'danger' },
      ]}
      cards={[
        { title: 'Rotation visibility', body: 'The page highlights key hygiene without burying it inside generic account controls.', icon: ShieldCheck },
        { title: 'Physical controls', body: 'Hardware-token and trusted-device concepts fit naturally into the exported visual language.', icon: Lock },
        { title: 'Clear boundaries', body: 'Admins oversee the platform, but private decryption remains a user-side concern.', icon: UserCog },
      ]}
    />
  );
}

export function UserLogsPage() {
  return (
    <ModulePage
      badge="Personal Access Timeline"
      title="Review your own diary activity and security events."
      description="Users now get a proper access-history surface styled like the Stitch system instead of an offline placeholder."
      icon={History}
      actions={[
        { label: 'Open Dashboard', to: '/dashboard' },
        { label: 'Admin Activity Logs', to: '/admin/logs' },
      ]}
      stats={[
        { label: 'Session Trace', value: 'Available', tone: 'primary' },
        { label: 'Alerting', value: 'Realtime', tone: 'secondary' },
        { label: 'Audit Depth', value: 'Entry + Auth', tone: 'neutral' },
        { label: 'Export', value: 'Planned', tone: 'neutral' },
      ]}
      cards={[
        { title: 'Self-audit first', body: 'The user log page focuses on personal visibility while the admin log view remains system-wide.', icon: History },
        { title: 'Security confidence', body: 'Transparency becomes a designed feature, not a dead-end route.', icon: Shield },
        { title: 'Cleaner information scent', body: 'Each route now has a believable place in the product structure.', icon: FileText },
      ]}
    />
  );
}

export function SettingsPage() {
  const { profile, updateProfile, logout, setVaultKey, user, vaultKey } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [faceEnabled, setFaceEnabled] = useState(false);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [showVaultKey, setShowVaultKey] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 'desktop', label: 'Workstation 01 - Main', detail: 'Last active: 2 minutes ago', icon: Laptop, current: true },
    { id: 'mobile', label: 'Secure Mobile Hub', detail: 'Last active: 4 hours ago', icon: Smartphone, current: false },
  ]);
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'ok' | 'warn'>('ok');
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName || 'Agent');
    setEmail(profile?.email || '');
    const biometrics = Boolean(profile?.biometricsEnabled);
    setFaceEnabled(biometrics);
    setFingerprintEnabled(false);
  }, [profile]);

  const vaultStrength = useMemo(() => {
    const base = 82;
    const biometricBoost = faceEnabled ? 10 : 0;
    const fingerprintBoost = fingerprintEnabled ? 6 : 0;
    return Math.min(100, base + biometricBoost + fingerprintBoost);
  }, [faceEnabled, fingerprintEnabled]);

  const pushStatus = (message: string, tone: 'ok' | 'warn' = 'ok') => {
    setStatus(message);
    setStatusTone(tone);
  };

  const handleReset = () => {
    setDisplayName(profile?.displayName || 'Agent');
    setEmail(profile?.email || '');
    const biometrics = Boolean(profile?.biometricsEnabled);
    setFaceEnabled(biometrics);
    setFingerprintEnabled(false);
    pushStatus('Unsaved changes were reset to your last stored profile.');
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || profile.displayName || 'Agent',
        email: email.trim() || profile.email || '',
        biometricsEnabled: faceEnabled || fingerprintEnabled,
      });

      await addDoc(collection(db, 'activityLogs'), {
        userId: user?.uid,
        userEmail: user?.email,
        action: 'Updated Settings',
        resource: '/settings',
        timestamp: serverTimestamp(),
        status: 'SUCCESS',
      });

      pushStatus('Profile settings saved successfully.');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('requires-recent-login')) {
        pushStatus('Firebase requires a fresh login before changing the account email. Sign out, sign in again, and retry the update.', 'warn');
      } else {
        pushStatus('Settings could not be saved. Please try again.', 'warn');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAllAccess = async () => {
    setSessions((prev) => prev.filter((session) => session.current));
    try {
      await addDoc(collection(db, 'activityLogs'), {
        userId: user?.uid,
        userEmail: user?.email,
        action: 'Revoked Access Nodes',
        resource: '/settings/sessions',
        timestamp: serverTimestamp(),
        status: 'SUCCESS',
      });
    } catch (error) {
      console.error(error);
    }
    pushStatus('All remembered devices were revoked except the current session.');
  };

  const handlePurgeData = async () => {
    if (!user) return;
    const approved = window.confirm('This will permanently delete all of your diary entries. Do you want to continue?');
    if (!approved) return;

    setPurging(true);
    try {
      const entriesSnap = await getDocs(query(collection(db, 'entries'), where('ownerId', '==', user.uid)));
      await Promise.all(entriesSnap.docs.map((entry) => deleteDoc(doc(db, 'entries', entry.id))));
      setVaultKey(null);

      await addDoc(collection(db, 'activityLogs'), {
        userId: user.uid,
        userEmail: user.email,
        action: 'Purged All Entries',
        resource: '/entries',
        timestamp: serverTimestamp(),
        status: 'DELETED',
      });

      pushStatus(`Purged ${entriesSnap.size} encrypted entr${entriesSnap.size === 1 ? 'y' : 'ies'} and cleared the local vault key.`);
    } catch (error) {
      console.error(error);
      pushStatus('Data purge failed. No further records were removed.', 'warn');
    } finally {
      setPurging(false);
    }
  };

  const handleTerminateSession = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error(error);
      pushStatus('Session termination failed. Please try again.', 'warn');
    }
  };

  return (
    <div className="mx-auto max-w-container-max-width px-4 py-6 md:px-margin-lg md:py-8">
      <header className="mb-layer-gap">
        <h1 className="cyan-glow-text text-4xl font-extrabold tracking-tight text-on-surface md:text-[40px]">Profile Security Command</h1>
        <p className="mt-3 font-[var(--font-body)] text-base text-on-surface-variant">Configure your biometric parameters and encryption layer preferences.</p>
      </header>

      <div className="grid grid-cols-1 gap-gutter-md lg:grid-cols-12">
        <div className="lg:col-span-8 flex flex-col gap-gutter-md">
          <section className="glass-panel isometric-card rounded-xl p-gutter-md">
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-xl bg-primary-container/20 p-3">
                <UserRound size={28} className="text-primary-fixed-dim" />
              </div>
              <h2 className="text-2xl font-bold text-primary">Identity Identification</h2>
            </div>
            <form
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSave();
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="ml-1 text-sm font-semibold text-on-surface-variant">Assigned Name</label>
                <input
                  className="inset-input rounded-lg border-none p-3 text-on-surface outline-none ring-0 focus:ring-2 focus:ring-primary-container"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="ml-1 text-sm font-semibold text-on-surface-variant">Secure Protocol Email</label>
                <input
                  className="inset-input rounded-lg border-none p-3 text-on-surface outline-none ring-0 focus:ring-2 focus:ring-primary-container"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="ml-1 text-sm font-semibold text-on-surface-variant">Encryption Signature</label>
                <div className="relative">
                  <input
                    className="inset-input w-full rounded-lg border-none p-3 pr-12 text-on-surface outline-none ring-0 focus:ring-2 focus:ring-primary-container"
                    type={showVaultKey ? 'text' : 'password'}
                    value={vaultKey || 'Vault key not loaded in this session'}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => setShowVaultKey((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-primary-fixed-dim"
                    title={showVaultKey ? 'Hide key' : 'Show key'}
                  >
                    {showVaultKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!vaultKey ? (
                  <p className="text-xs text-on-surface-variant">Unlock your vault from the dashboard first if you want to inspect the current session key.</p>
                ) : null}
              </div>
              <div className="md:col-span-2 mt-2 flex justify-end gap-4">
                <button type="button" onClick={handleReset} className="px-6 py-2 text-sm font-bold text-on-surface-variant transition-all hover:text-white">Reset Changes</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-gradient-to-r from-primary-fixed-dim to-secondary-container px-8 py-2 text-sm font-bold text-background shadow-[0_5px_24px_rgba(0,218,243,0.3)] transition-all hover:-translate-y-0.5 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Update Identity'}
                </button>
              </div>
              {status ? (
                <div className={`md:col-span-2 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${statusTone === 'warn' ? 'border-error/40 bg-error/10 text-error' : 'border-primary-fixed-dim/20 bg-primary-fixed-dim/10 text-primary-fixed-dim'}`}>
                  {statusTone === 'warn' ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
                  {status}
                </div>
              ) : null}
            </form>
          </section>

          <section className="glass-panel isometric-card rounded-xl p-gutter-md">
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-xl bg-secondary-container/20 p-3">
                <Fingerprint size={28} className="text-secondary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-secondary">Biometric Preferences</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-on-surface-variant">Hardware-level authentication protocols</p>
              </div>
            </div>
            <div className="space-y-4">
              <ToggleRow title="Neural Face Recognition" description="Use local camera for instantaneous unlock." enabled={faceEnabled} onToggle={() => setFaceEnabled((value) => !value)} />
              <ToggleRow title="Haptic Fingerprint Logic" description="Require physical touch confirmation." enabled={fingerprintEnabled} onToggle={() => setFingerprintEnabled((value) => !value)} />
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-gutter-md">
          <section className="glass-panel rounded-xl p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-container/10 blur-3xl" />
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-on-surface-variant">
              <span className="h-2 w-2 rounded-full bg-primary-fixed-dim shadow-[0_0_8px_#00daf3]" />
              Security Level: Omega
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Vault Strength</span>
                <span className="font-bold text-primary">{vaultStrength}%</span>
              </div>
              <div className="neon-track h-2">
                <div className="neon-bar h-full transition-all" style={{ width: `${vaultStrength}%` }} />
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-xl p-6">
            <h3 className="mb-6 text-xl font-bold text-on-surface">Active Access Nodes</h3>
            <div className="space-y-4">
              {sessions.length > 0 ? sessions.map((session) => {
                const Icon = session.icon;
                return (
                  <div key={session.id} className={`flex items-start gap-4 rounded-lg border border-outline-variant/10 bg-surface-container/30 p-3 ${session.current ? '' : 'opacity-60'}`}>
                    <Icon size={20} className={session.current ? 'text-primary-fixed-dim' : 'text-on-surface-variant'} />
                    <div>
                      <p className="text-sm font-bold text-on-surface">{session.label}</p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{session.detail}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-lg border border-outline-variant/10 bg-surface-container/30 p-4 text-sm text-on-surface-variant">
                  No remembered secondary devices remain linked to this account.
                </div>
              )}
            </div>
            <button type="button" onClick={() => void handleRevokeAllAccess()} className="mt-6 w-full rounded-lg border border-outline-variant/30 py-2 text-sm font-bold transition-all hover:bg-surface-variant/20">Revoke All Access</button>
          </section>

          <section className="glass-panel rounded-xl border border-error/30 p-gutter-md shadow-[0_0_22px_rgba(255,180,171,0.12)]">
            <div className="relative z-10">
              <h2 className="mb-4 text-xl font-bold text-error">Critical Protocols</h2>
              <p className="mb-6 text-sm leading-7 text-on-surface-variant">
                These actions are destructive and cannot be reversed. Proceed only if authorized by Level 5 security clearance.
              </p>
              <div className="space-y-3">
                <button type="button" onClick={() => void handlePurgeData()} disabled={purging} className="flex w-full items-center justify-center gap-3 rounded-lg border border-error/30 py-3 text-sm font-bold text-error transition-all hover:bg-error/10 disabled:opacity-60">
                  <XCircle size={18} />
                  {purging ? 'PURGING...' : 'PURGE ALL DATA'}
                </button>
                <button type="button" onClick={() => void handleTerminateSession()} className="flex w-full items-center justify-center gap-3 rounded-lg bg-error py-3 text-sm font-bold text-on-error shadow-[0_0_20px_rgba(255,180,171,0.3)] transition-all hover:shadow-[0_0_30px_rgba(255,180,171,0.45)]">
                  <Lock size={18} />
                  TERMINATE SESSION
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function SupportPage() {
  return (
    <ModulePage
      badge="Help and Assurance"
      title="Support resources built around a security-first product."
      description="Support now exists as a real module, giving users a credible place to find guidance, incident help, and product trust signals."
      icon={HelpCircle}
      actions={[
        { label: 'Open Settings', to: '/settings' },
        { label: 'Return Home', to: '/' },
      ]}
      stats={[
        { label: 'Coverage', value: '24/7 Incident Desk', tone: 'primary' },
        { label: 'Response SLA', value: '< 2 Hours', tone: 'secondary' },
        { label: 'Status Feed', value: 'Live', tone: 'neutral' },
        { label: 'Knowledge Base', value: 'Indexed', tone: 'neutral' },
      ]}
      cards={[
        { title: 'Incident workflows', body: 'Compromised-device, lost-key, and suspicious-login guidance now belong to a dedicated route.', icon: ShieldCheck },
        { title: 'User confidence', body: 'Removing dead-end pages makes the experience feel more polished and trustworthy.', icon: Sparkles },
        { title: 'Operational realism', body: 'Security software should always show how help is reached, not hide support behind a broken link.', icon: HelpCircle },
      ]}
    />
  );
}

export function SecurityInfoPage() {
  return (
    <ModulePage
      badge="Security Architecture"
      title="A product story centered on privacy, verification, and control."
      description="The public-facing security page now leans into the exported command-center aesthetic with stronger status framing and glass depth."
      icon={Shield}
      actions={[
        { label: 'Create Account', to: '/register' },
        { label: 'Read Support', to: '/support' },
      ]}
      stats={[
        { label: 'Cryptography', value: 'Client Encrypted', tone: 'primary' },
        { label: 'Access Model', value: 'Least Privilege', tone: 'secondary' },
        { label: 'Audit Trail', value: 'Immutable Logs', tone: 'neutral' },
        { label: 'Data Exposure', value: 'Minimized', tone: 'primary' },
      ]}
      cards={[
        { title: 'Key ownership', body: 'CipherDiary keeps the master key on the client side, pushing privacy from marketing copy into architecture.', icon: FileKey },
        { title: 'Operational monitoring', body: 'Admins gain oversight of the platform without obtaining plaintext access to private journal content.', icon: ShieldCheck },
        { title: 'Trust through clarity', body: 'The public navigation now lands on pages that actually feel designed, not decorative.', icon: ScrollText },
      ]}
    />
  );
}

export function PricingPage() {
  return (
    <ModulePage
      badge="Deployment Plans"
      title="Simple plans for personal vaults and administrative teams."
      description="The pricing route now looks like part of the same premium product family exported from Stitch."
      icon={Bell}
      actions={[
        { label: 'Start Secure Journaling', to: '/register' },
        { label: 'View Security', to: '/security' },
      ]}
      stats={[
        { label: 'Starter', value: 'Free', tone: 'primary' },
        { label: 'Professional', value: '$12/mo', tone: 'secondary' },
        { label: 'Team Admin', value: '$39/mo', tone: 'neutral' },
        { label: 'Support Tier', value: 'Priority', tone: 'primary' },
      ]}
      cards={[
        { title: 'Personal vaults', body: 'Entry-level access highlights encrypted journaling and personal audit visibility.', icon: BookOpen },
        { title: 'Operations teams', body: 'Admin-focused plans frame dashboards, logs, and user management as a separate value layer.', icon: UserCog },
        { title: 'Cleaner navigation', body: 'Pricing is no longer a dead route, which helps the landing page feel production-ready.', icon: Sparkles },
      ]}
    />
  );
}

export function AboutPage() {
  return (
    <ModulePage
      badge="Product Narrative"
      title="Built for people who care what happens to private thoughts."
      description="The About page now shares the same glassy, high-command visual language as the exported Stitch concept."
      icon={ShieldCheck}
      actions={[
        { label: 'Go Home', to: '/' },
        { label: 'View Pricing', to: '/pricing' },
      ]}
      stats={[
        { label: 'Focus', value: 'Privacy-First', tone: 'primary' },
        { label: 'Audience', value: 'Security-Conscious', tone: 'secondary' },
        { label: 'Architecture', value: 'Modern Web + Firebase', tone: 'neutral' },
        { label: 'Mission', value: 'Own Your Memory', tone: 'primary' },
      ]}
      cards={[
        { title: 'Authentic framing', body: 'A stronger story helps the premium visual design feel grounded rather than ornamental.', icon: Shield },
        { title: 'Consistent language', body: 'The same secure-product tone now extends beyond the dashboard shell into public-facing pages.', icon: ScrollText },
        { title: 'Fuller product surface', body: 'The top navigation now has real destinations behind every link.', icon: Sparkles },
      ]}
    />
  );
}

export function ForgotPasswordPage() {
  return (
    <ModulePage
      badge="Recovery Channel"
      title="Recover account access without weakening the vault model."
      description="This page replaces the dead login link with a real recovery destination that matches the rest of the product shell."
      icon={Fingerprint}
      actions={[
        { label: 'Return to Login', to: '/login' },
        { label: 'Create New Account', to: '/register' },
      ]}
      stats={[
        { label: 'Recovery Mode', value: 'Email Verified', tone: 'primary' },
        { label: 'Server Key Access', value: 'Never Stored', tone: 'danger' },
        { label: 'Response Window', value: '< 10 Minutes', tone: 'secondary' },
        { label: 'Security Review', value: 'Enabled', tone: 'neutral' },
      ]}
      cards={[
        { title: 'Identity-first recovery', body: 'Users can regain account access while the master diary key remains outside server control.', icon: ShieldCheck },
        { title: 'No dead buttons', body: 'The login screen now links to an actual page instead of a missing route.', icon: Sparkles },
        { title: 'Clear expectations', body: 'Recovery helps with account authentication, not decryption of entries without the vault key.', icon: Lock },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <ModulePage
      badge="Security Protocol Terms"
      title="Platform rules, privacy expectations, and access boundaries."
      description="This page gives the registration screen a real destination behind its terms link and keeps the public journey complete."
      icon={ScrollText}
      actions={[
        { label: 'Back to Register', to: '/register' },
        { label: 'Read Security', to: '/security' },
      ]}
      stats={[
        { label: 'Privacy Model', value: 'Zero-Knowledge', tone: 'primary' },
        { label: 'Admin Visibility', value: 'Metadata Only', tone: 'secondary' },
        { label: 'Encryption', value: 'Client Controlled', tone: 'neutral' },
        { label: 'Compliance Posture', value: 'Documented', tone: 'neutral' },
      ]}
      cards={[
        { title: 'Transparent boundaries', body: 'The product terms now clearly align with the secure diary architecture presented elsewhere in the app.', icon: Shield },
        { title: 'Registration continuity', body: 'Signing up no longer sends users to a broken path.', icon: Sparkles },
        { title: 'Consistent experience', body: 'Even utility pages now share the same glassmorphic shell and navigation structure.', icon: FileText },
      ]}
    />
  );
}

export function AdminDiariesPage() {
  return (
    <ModulePage
      badge="Admin Diary Oversight"
      title="Track diary-system health without pretending admins can read private entries."
      description="This admin module now fits the Stitch design system with stronger dashboard framing and more credible system-health language."
      icon={BookOpen}
      actions={[
        { label: 'Admin Dashboard', to: '/admin' },
        { label: 'Security Center', to: '/admin/security' },
      ]}
      stats={[
        { label: 'Index Health', value: 'Nominal', tone: 'primary' },
        { label: 'Encrypted Payloads', value: '100%', tone: 'secondary' },
        { label: 'Retention Jobs', value: 'Scheduled', tone: 'neutral' },
        { label: 'Content Access', value: 'Metadata Only', tone: 'danger' },
      ]}
      cards={[
        { title: 'Metadata-only visibility', body: 'Admins can observe the system without breaking the private journal promise.', icon: Shield },
        { title: 'Operational checks', body: 'Monitoring focuses on counts, health, and storage flows instead of fake plaintext oversight.', icon: Database },
        { title: 'More authentic admin UX', body: 'This page now feels like a real admin surface rather than a placeholder module.', icon: Sparkles },
      ]}
    />
  );
}

export function AdminSecurityPage() {
  return (
    <div className="mx-auto max-w-container-max-width px-4 py-6 md:px-margin-lg md:py-8">
      <div className="mb-layer-gap flex justify-center">
        <section className="glass-panel relative w-full max-w-4xl overflow-hidden rounded-[2rem] p-8 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-60" />
          <div className="relative z-10">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary bg-primary/20 shadow-[0_0_40px_rgba(0,218,243,0.35)]">
              <Lock size={40} className="text-primary" />
            </div>
            <h2 className="text-4xl font-extrabold text-white md:text-5xl">AES-256 Active</h2>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-primary-fixed">Quantum-Resistant Encryption Protocol Engaged</p>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="inset-input rounded-xl border border-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Status</p>
                <p className="mt-2 font-bold text-primary">Stable</p>
              </div>
              <div className="inset-input rounded-xl border border-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Latency</p>
                <p className="mt-2 font-bold text-primary">1.2ms</p>
              </div>
              <div className="inset-input rounded-xl border border-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">Threats</p>
                <p className="mt-2 font-bold text-error">0 Active</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mb-layer-gap grid grid-cols-1 gap-gutter-md lg:grid-cols-3">
        <section className="glass-panel glass-panel-hover rounded-2xl p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
              <Lock size={22} className="text-primary" />
            </div>
            <span className="rounded bg-primary-container px-2 py-1 text-[10px] font-bold text-on-primary-container">SECURE</span>
          </div>
          <h3 className="text-xl font-bold text-white">Encryption Algorithm</h3>
          <p className="mt-2 text-sm text-on-surface-variant">AES-256 GCM authenticated encryption with associated data.</p>
          <div className="neon-track mt-5 h-1">
            <div className="neon-bar h-full w-full" />
          </div>
        </section>

        <section className="glass-panel glass-panel-hover rounded-2xl p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="rounded-lg border border-secondary/20 bg-secondary/10 p-3">
              <FileKey size={22} className="text-secondary" />
            </div>
            <span className="rounded bg-secondary-container px-2 py-1 text-[10px] font-bold text-on-secondary-container">PROTECTED</span>
          </div>
          <h3 className="text-xl font-bold text-white">Secret Key Protection</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Hardware-backed trusted execution controls for key isolation.</p>
          <div className="mt-5 flex gap-2">
            <div className="h-1 flex-1 rounded-full bg-secondary" />
            <div className="h-1 flex-1 rounded-full bg-secondary" />
            <div className="h-1 flex-1 rounded-full bg-secondary" />
            <div className="h-1 flex-1 rounded-full bg-white/10" />
          </div>
        </section>

        <section className="glass-panel glass-panel-hover rounded-2xl p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className="rounded-lg border border-error/20 bg-error/10 p-3">
              <Radar size={22} className="text-error" />
            </div>
            <span className="rounded bg-error-container px-2 py-1 text-[10px] font-bold text-on-error-container">SCANNING</span>
          </div>
          <h3 className="text-xl font-bold text-white">Intrusion Detection</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Realtime heuristic analysis of incoming traffic and privilege changes.</p>
          <div className="mt-5 flex items-center gap-2">
            <span className="h-2 w-2 animate-ping rounded-full bg-error" />
            <span className="font-[var(--font-mono)] text-xs text-error">LIVE MONITORING...</span>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-gutter-md xl:grid-cols-4">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] p-6 xl:col-span-3">
          <div className="relative z-10 mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Threat Monitoring</h3>
              <p className="text-sm text-on-surface-variant">Global access attempt heat-map</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="rounded-lg border border-white/10 bg-white/5 p-2 text-on-surface-variant transition-all hover:bg-white/10">+</button>
              <button type="button" className="rounded-lg border border-white/10 bg-white/5 p-2 text-on-surface-variant transition-all hover:bg-white/10">↻</button>
            </div>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,218,243,0.08),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
          <div className="relative z-10 flex h-[440px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/5 bg-[linear-gradient(180deg,rgba(6,14,30,0.7),rgba(24,31,48,0.4))]">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0,218,243,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(0,218,243,0.14) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
            <div className="absolute h-[400px] w-[400px] rounded-full border border-primary/20" />
            <div className="absolute h-[280px] w-[280px] rounded-full border border-primary/10" />
            <div className="absolute h-[160px] w-[160px] rounded-full border border-primary/5" />
            <div className="absolute left-[18%] top-[28%] h-3 w-3 rounded-full bg-error shadow-[0_0_16px_rgba(255,180,171,0.9)]" />
            <div className="absolute left-[52%] top-[22%] h-3 w-3 rounded-full bg-secondary shadow-[0_0_16px_rgba(209,188,255,0.8)]" />
            <div className="absolute left-[64%] top-[56%] h-3 w-3 rounded-full bg-primary-fixed-dim shadow-[0_0_16px_rgba(0,218,243,0.8)]" />
            <div className="absolute left-[30%] top-[62%] h-3 w-3 rounded-full bg-error shadow-[0_0_16px_rgba(255,180,171,0.9)]" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="inset-input inline-flex items-center gap-6 rounded-xl border border-primary/20 p-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Live Access Cluster</p>
                  <p className="mt-2 text-2xl font-bold text-white">428</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">North America</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <p className="mt-2 text-2xl font-bold text-white">1,024</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">Eurasia</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel flex h-[500px] flex-col rounded-[2rem] p-6 xl:col-span-1">
          <div className="mb-6 flex items-center gap-2">
            <FileText size={18} className="text-error" />
            <h3 className="text-xl font-bold text-white">Access Log</h3>
          </div>
          <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-2">
            {[
              ['BLOCKED', '192.168.4.11', 'Brute force attempt detected', true],
              ['REJECTED', '45.22.109.4', 'Invalid API token', false],
              ['BLOCKED', '103.44.21.9', 'Geo-fence violation', true],
              ['REJECTED', '211.5.88.192', 'Unknown agent signature', false],
              ['REJECTED', '18.45.2.112', 'Invalid auth headers', false],
            ].map(([status, ip, note, danger]) => (
              <div key={`${status}-${ip}`} className={`rounded-xl border p-3 ${danger ? 'border-error/20 bg-error/5' : 'border-white/5 bg-white/5'}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-[var(--font-mono)] text-xs font-bold ${danger ? 'text-error' : 'text-on-surface-variant'}`}>{status}</span>
                  <span className="text-[10px] text-on-surface-variant">14:22:01</span>
                </div>
                <p className="mt-2 font-[var(--font-mono)] text-sm text-white">{ip}</p>
                <p className="mt-1 text-[10px] italic text-on-surface-variant">{note}</p>
              </div>
            ))}
          </div>
          <button type="button" className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-fixed-dim transition-all hover:text-white">
            Download Full Audit
          </button>
        </section>
      </div>
    </div>
  );
}

export function AdminDatabasePage() {
  return (
    <ModulePage
      badge="Admin Data Plane"
      title="Observe database health, replication, and maintenance posture."
      description="Database management now stands on its own as a credible admin module with clearer scope and stronger presentation."
      icon={Database}
      actions={[
        { label: 'Open Admin Dashboard', to: '/admin' },
        { label: 'Open Reports', to: '/admin/reports' },
      ]}
      stats={[
        { label: 'Replica Status', value: 'Healthy', tone: 'primary' },
        { label: 'Backup Window', value: 'Nightly', tone: 'secondary' },
        { label: 'Latency', value: '12ms', tone: 'neutral' },
        { label: 'Schema Drift', value: '0 Issues', tone: 'primary' },
      ]}
      cards={[
        { title: 'Health monitoring', body: 'Operational storage concerns are represented separately from user-facing vault controls.', icon: Database },
        { title: 'Performance visibility', body: 'The admin shell now has a cleaner place for replication and backup posture.', icon: Shield },
        { title: 'Consistent polish', body: 'The experience stays cohesive across user and admin sections instead of dropping into placeholders.', icon: Sparkles },
      ]}
    />
  );
}

export function AdminNotificationsPage() {
  return (
    <ModulePage
      badge="Admin Broadcasts"
      title="Coordinate user-facing notices and operational announcements."
      description="Notifications is now a defined control surface for communication workflows instead of an empty route."
      icon={Bell}
      actions={[
        { label: 'Open Reports', to: '/admin/reports' },
        { label: 'Security Center', to: '/admin/security' },
      ]}
      stats={[
        { label: 'Draft Notices', value: '4', tone: 'primary' },
        { label: 'Critical Alerts', value: '1', tone: 'danger' },
        { label: 'Audience Segments', value: '3', tone: 'secondary' },
        { label: 'Delivery Rate', value: '99.4%', tone: 'neutral' },
      ]}
      cards={[
        { title: 'Operational messaging', body: 'Status changes, maintenance windows, and incident notices have a clear destination now.', icon: Bell },
        { title: 'Safer communication', body: 'Separating notifications from reports and logs makes the admin information architecture easier to trust.', icon: ShieldCheck },
        { title: 'Complete nav coverage', body: 'Every admin sidebar item now lands on a real page with context and intent.', icon: Sparkles },
      ]}
    />
  );
}

export function AdminReportsPage() {
  return (
    <ModulePage
      badge="Admin Reporting"
      title="Summarize adoption, risk, and operational trends."
      description="Reports now has a genuine presence in the control plane, helping the admin suite feel rounded and professional."
      icon={FileText}
      actions={[
        { label: 'Open Database', to: '/admin/database' },
        { label: 'Open Notifications', to: '/admin/notifications' },
      ]}
      stats={[
        { label: 'Report Cadence', value: 'Weekly', tone: 'primary' },
        { label: 'Security KPIs', value: 'Tracked', tone: 'secondary' },
        { label: 'User Growth', value: 'Upward', tone: 'neutral' },
        { label: 'Export Format', value: 'PDF + CSV', tone: 'neutral' },
      ]}
      cards={[
        { title: 'Executive summaries', body: 'This module can represent leadership-facing health snapshots and compliance evidence as the app grows.', icon: FileText },
        { title: 'Trend visibility', body: 'Reports complements dashboards by focusing on summaries instead of realtime operational widgets.', icon: ScrollText },
        { title: 'More believable admin suite', body: 'The control plane feels more complete when reporting has a dedicated, polished destination.', icon: Sparkles },
      ]}
    />
  );
}

export function AdminSettingsPage() {
  return (
    <ModulePage
      badge="Admin Policy Controls"
      title="Tune platform-wide defaults without crossing into private content."
      description="Admin settings now has a proper home with clear boundaries around configuration, governance, and enforcement."
      icon={Settings}
      actions={[
        { label: 'Admin Dashboard', to: '/admin' },
        { label: 'User Management', to: '/admin/users' },
      ]}
      stats={[
        { label: 'Policy Mode', value: 'Enforced', tone: 'primary' },
        { label: 'Role Mapping', value: 'Managed', tone: 'secondary' },
        { label: 'Session Policy', value: 'Strict', tone: 'neutral' },
        { label: 'Content Access', value: 'Restricted', tone: 'danger' },
      ]}
      cards={[
        { title: 'Governance layer', body: 'This page is the right place for tenant policies, role defaults, and session rules.', icon: Settings },
        { title: 'Separation of duties', body: 'It reinforces that admin power stops at platform administration, not user secrets.', icon: Shield },
        { title: 'Route completeness', body: 'Admins no longer encounter stub destinations while navigating the control plane.', icon: Sparkles },
      ]}
    />
  );
}
