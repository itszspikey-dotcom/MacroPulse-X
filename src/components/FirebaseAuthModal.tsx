import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  CheckCircle2, 
  RefreshCw, 
  LogOut, 
  Lock, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  Database,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  registerWithEmail, 
  logoutUser, 
  User 
} from '../lib/firebase';
import { firebaseSyncService, CloudSyncStatus } from '../services/firebaseSyncService';
import { triggerHaptic, playSuccessChime } from '../services/audioFeedback';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncCompleted?: () => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({
  isOpen,
  onClose,
  onSyncCompleted
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('guest');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [manualSyncing, setManualSyncing] = useState(false);

  useEffect(() => {
    const unsub = firebaseSyncService.subscribeStatus((status, user) => {
      setSyncStatus(status);
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    triggerHaptic('light');
    try {
      await signInWithGoogle();
      playSuccessChime();
      triggerHaptic('success');
      if (onSyncCompleted) onSyncCompleted();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError(err?.message || 'Google sign-in failed. Please try again.');
      triggerHaptic('warning');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    triggerHaptic('light');
    try {
      if (tab === 'login') {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName || undefined);
      }
      playSuccessChime();
      triggerHaptic('success');
      if (onSyncCompleted) onSyncCompleted();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in.');
      } else if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err?.message || 'Authentication failed. Check your connection.');
      }
      triggerHaptic('warning');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    setManualSyncing(true);
    triggerHaptic('medium');
    try {
      await firebaseSyncService.syncAllToCloud();
      playSuccessChime();
      triggerHaptic('success');
      if (onSyncCompleted) onSyncCompleted();
    } catch (err) {
      console.error('Sync failed:', err);
      triggerHaptic('warning');
    } finally {
      setManualSyncing(false);
    }
  };

  const handleLogout = async () => {
    triggerHaptic('medium');
    try {
      await logoutUser();
      triggerHaptic('light');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#141416] border border-white/15 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#0e0e10]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center text-[#facc15]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-oswald text-lg tracking-wider text-white">CLOUD CLUSTER</h2>
                <span className="text-[10px] font-mono-meta bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  FIREBASE
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono-meta">Hybrid offline-first synchronization</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#1c1c20] border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono-meta font-bold text-emerald-400 uppercase tracking-wider">
                      CONNECTED & SYNCED
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-meta text-white/40">FIRESTORE DB</span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#facc15] font-oswald text-xl">
                    {(currentUser.displayName || currentUser.email || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-white truncate">
                      {currentUser.displayName || 'Athletic Operator'}
                    </div>
                    <div className="text-xs font-mono-meta text-white/50 truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono-meta text-white/60">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>Cloud Firestore: Active</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Local Cache: Linked</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleManualSync}
                  disabled={manualSyncing || syncStatus === 'syncing'}
                  className="w-full py-3 px-4 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black font-mono-meta font-bold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${manualSyncing || syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>{manualSyncing ? 'SYNCHRONIZING REPOSITORY...' : 'FORCE CLUSTER RE-SYNC'}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 border border-white/10 hover:border-red-500/30 font-mono-meta text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>DISCONNECT ACCOUNT (RETURN TO GUEST)</span>
                </button>
              </div>

              <div className="text-[11px] font-mono-meta text-white/40 text-center leading-relaxed">
                Your profiles, daily nutrition logs, custom recipes, and weekly meal plans are securely backed up and synchronized across devices.
              </div>
            </div>
          ) : (
            /* Guest / Logged out state */
            <div className="space-y-5">
              <div className="p-3.5 rounded-2xl bg-[#1c1c20] border border-white/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#facc15] shrink-0 mt-0.5" />
                <div className="text-xs text-white/70 space-y-1">
                  <div className="font-bold text-white">Hybrid Offline-First Architecture</div>
                  <div className="text-white/50 text-[11px] font-mono-meta leading-relaxed">
                    You are currently in local guest mode. Link a Firebase account to sync meals, weekly meal plans, and profiles across all your mobile & desktop devices.
                  </div>
                </div>
              </div>

              {/* 1-Click Google Sign-In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-white/90 text-black font-mono-meta font-bold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                </svg>
                <span>CONTINUE WITH GOOGLE (1-CLICK)</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 text-white/30 text-[10px] font-mono-meta">
                <div className="flex-1 h-px bg-white/10" />
                <span>OR EMAIL ACCESS</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Auth Tabs */}
              <div className="flex rounded-xl bg-[#0e0e10] p-1 border border-white/10 text-xs font-mono-meta">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                    triggerHaptic('light');
                  }}
                  className={`flex-1 py-2 rounded-lg transition font-bold cursor-pointer ${
                    tab === 'login' ? 'bg-[#facc15] text-black' : 'text-white/50 hover:text-white'
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                    triggerHaptic('light');
                  }}
                  className={`flex-1 py-2 rounded-lg transition font-bold cursor-pointer ${
                    tab === 'register' ? 'bg-[#facc15] text-black' : 'text-white/50 hover:text-white'
                  }`}
                >
                  CREATE ACCOUNT
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 font-mono-meta animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {tab === 'register' && (
                  <div>
                    <label className="block text-[11px] font-mono-meta text-white/60 mb-1">
                      OPERATOR NAME / ALIAS
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Alex Hunter"
                        className="w-full bg-[#18181c] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/25 focus:border-[#facc15] focus:outline-none font-mono-meta"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono-meta text-white/60 mb-1">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@macropulse.app"
                      className="w-full bg-[#18181c] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/25 focus:border-[#facc15] focus:outline-none font-mono-meta"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-meta text-white/60 mb-1">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#18181c] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/25 focus:border-[#facc15] focus:outline-none font-mono-meta"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black font-mono-meta font-bold text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{tab === 'login' ? 'AUTHORIZE & SYNC' : 'INITIALIZE CLUSTER ACCOUNT'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-white/10 bg-[#0e0e10] flex items-center justify-between text-[10px] font-mono-meta text-white/40">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />
            <span>CLOUD STORAGE ENGINE: FIRESTORE</span>
          </div>
          <span>v2.5.0-FIREBASE</span>
        </div>
      </div>
    </div>
  );
};
