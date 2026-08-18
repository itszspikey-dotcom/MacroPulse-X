import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Server,
  Layers,
  Code,
} from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseSchema';
import { syncEngine } from '../services/syncEngine';
import { triggerHaptic } from '../services/audioFeedback';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'sql' | 'queue' | 'rls'>('sql');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const queue = syncEngine.getSyncQueue();

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    triggerHaptic('success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFlushQueue = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const res = await syncEngine.flushSyncQueue();
    setIsSyncing(false);
    setSyncResult(`Resolved ${res.resolved} items, ${res.failed} remaining in retry queue.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Supabase PostgreSQL Database & Sync</h3>
              <p className="text-[11px] text-slate-400">Production RLS policies, schemas & offline sync engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-4 pt-3 border-b border-slate-800 flex items-center gap-2 bg-slate-850">
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'sql'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            PostgreSQL DDL & Schema
          </button>

          <button
            onClick={() => setActiveTab('rls')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'rls'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            RLS & Security
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-2.5 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'queue'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Sync Queue ({queue.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3 text-white flex-1 font-mono text-xs">
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans text-xs">
                  Copy and paste into your Supabase SQL Editor:
                </span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-sans font-bold text-xs transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}
                </button>
              </div>

              <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px] leading-relaxed max-h-96">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {activeTab === 'rls' && (
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <h4 className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Strict Row Level Security (RLS) Policy Specifications
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  All user data is isolated per authenticated user ID (<code className="text-emerald-400 font-mono">auth.uid()</code>). Users can only read, write, and mutate their own meal records.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="font-bold text-slate-200">1. profiles</div>
                  <div className="text-slate-400 text-[11px] mt-0.5 font-mono">
                    SELECT/UPDATE/INSERT WHERE auth.uid() = id
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="font-bold text-slate-200">2. meal_logs</div>
                  <div className="text-slate-400 text-[11px] mt-0.5 font-mono">
                    ALL ON meal_logs FOR EACH ROW USING (auth.uid() = user_id)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div className="font-bold text-slate-200">3. recipes & ingredients</div>
                  <div className="text-slate-400 text-[11px] mt-0.5 font-mono">
                    ON DELETE CASCADE ensures dependent ingredients are cleaned up instantly.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Offline Sync Queue Status</h4>
                  <p className="text-[11px] text-slate-400">
                    Optimistic mutations queued locally until network connectivity is resolved.
                  </p>
                </div>
                <button
                  onClick={handleFlushQueue}
                  disabled={isSyncing || queue.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Flush Sync Queue
                </button>
              </div>

              {syncResult && (
                <div className="p-2.5 rounded-xl bg-slate-800 text-amber-300 text-[11px]">
                  {syncResult}
                </div>
              )}

              <div className="space-y-2">
                {queue.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    Sync queue is completely empty. All meal logs and water logs are synced!
                  </div>
                ) : (
                  queue.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-200">
                          {item.action.toUpperCase()} on <span className="font-mono text-amber-400">{item.table}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {item.id} • Retries: {item.retryCount}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        Pending
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
