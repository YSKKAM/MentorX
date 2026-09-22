'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { socketService } from '../../lib/socket';

interface StrictModeControlCardProps {
  classroomId: string;
  initialSettings?: {
    strict_mode_enabled?: boolean;
    block_paste?: boolean;
    block_copy?: boolean;
    block_cut?: boolean;
    record_restricted_events?: boolean;
  };
}

export default function StrictModeControlCard({ classroomId, initialSettings }: StrictModeControlCardProps) {
  const [strictModeEnabled, setStrictModeEnabled] = useState(initialSettings?.strict_mode_enabled ?? false);
  const [blockPaste, setBlockPaste] = useState(initialSettings?.block_paste ?? true);
  const [blockCopy, setBlockCopy] = useState(initialSettings?.block_copy ?? true);
  const [blockCut, setBlockCut] = useState(initialSettings?.block_cut ?? true);
  const [recordEvents, setRecordEvents] = useState(initialSettings?.record_restricted_events ?? true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setStrictModeEnabled(initialSettings.strict_mode_enabled ?? false);
      setBlockPaste(initialSettings.block_paste ?? true);
      setBlockCopy(initialSettings.block_copy ?? true);
      setBlockCut(initialSettings.block_cut ?? true);
      setRecordEvents(initialSettings.record_restricted_events ?? true);
    }
  }, [initialSettings]);

  const handleSave = async (updatedValues?: {
    strictModeEnabled?: boolean;
    blockPaste?: boolean;
    blockCopy?: boolean;
    blockCut?: boolean;
    recordEvents?: boolean;
  }) => {
    setIsSaving(true);
    setSaveSuccess(false);

    const payload = {
      strictModeEnabled: updatedValues?.strictModeEnabled ?? strictModeEnabled,
      blockPaste: updatedValues?.blockPaste ?? blockPaste,
      blockCopy: updatedValues?.blockCopy ?? blockCopy,
      blockCut: updatedValues?.blockCut ?? blockCut,
      recordEvents: updatedValues?.recordEvents ?? recordEvents,
    };

    try {
      // 1. Update backend REST API
      await api.put(`/classrooms/${classroomId}/strict-mode`, payload);

      // 2. Emit real-time WebSocket event to connected VS Code student instances
      const token = localStorage.getItem('token');
      if (token) {
        const socket = socketService.connect(token);
        if (socket) {
          socket.emit('teacher:toggle-strict-mode', {
            classroomId,
            settings: {
              strict_mode_enabled: payload.strictModeEnabled,
              block_paste: payload.blockPaste,
              block_copy: payload.blockCopy,
              block_cut: payload.blockCut,
              record_restricted_events: payload.recordEvents,
            },
          });
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update strict mode settings:', err);
      alert('Error updating Strict Mode settings: ' + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMasterSwitch = (enabled: boolean) => {
    setStrictModeEnabled(enabled);
    handleSave({ strictModeEnabled: enabled });
  };

  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-xl bg-white/80 dark:bg-[#12121a]/80 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h3 className="text-xl font-black text-slate-950 dark:text-white">MentorX Strict Mode</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              strictModeEnabled 
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse' 
                : 'bg-slate-200 dark:bg-gray-800 text-slate-600 dark:text-gray-400'
            }`}>
              {strictModeEnabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-gray-400 mt-1">
            Enforce editor-level copy/paste restriction and receive real-time monitoring alerts.
          </p>
        </div>

        {/* Master Toggle Switch */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-gray-300">
            {strictModeEnabled ? 'Strict Mode Enabled' : 'Strict Mode Disabled'}
          </span>
          <button
            type="button"
            onClick={() => toggleMasterSwitch(!strictModeEnabled)}
            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              strictModeEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-gray-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                strictModeEnabled ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Checkbox Options */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
          strictModeEnabled ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40' : 'bg-slate-50 dark:bg-gray-900/30 border-slate-200 dark:border-white/5 opacity-60'
        }`}>
          <input
            type="checkbox"
            checked={blockPaste}
            disabled={!strictModeEnabled}
            onChange={(e) => {
              setBlockPaste(e.target.checked);
              handleSave({ blockPaste: e.target.checked });
            }}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Block Paste (Ctrl+V)</div>
            <div className="text-xs text-slate-600 dark:text-gray-400">Restricts pasting external code inside VS Code</div>
          </div>
        </label>

        <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
          strictModeEnabled ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40' : 'bg-slate-50 dark:bg-gray-900/30 border-slate-200 dark:border-white/5 opacity-60'
        }`}>
          <input
            type="checkbox"
            checked={blockCopy}
            disabled={!strictModeEnabled}
            onChange={(e) => {
              setBlockCopy(e.target.checked);
              handleSave({ blockCopy: e.target.checked });
            }}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Block Copy (Ctrl+C)</div>
            <div className="text-xs text-slate-600 dark:text-gray-400">Restricts copying code out of active editor</div>
          </div>
        </label>

        <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
          strictModeEnabled ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40' : 'bg-slate-50 dark:bg-gray-900/30 border-slate-200 dark:border-white/5 opacity-60'
        }`}>
          <input
            type="checkbox"
            checked={blockCut}
            disabled={!strictModeEnabled}
            onChange={(e) => {
              setBlockCut(e.target.checked);
              handleSave({ blockCut: e.target.checked });
            }}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Block Cut (Ctrl+X)</div>
            <div className="text-xs text-slate-600 dark:text-gray-400">Restricts cutting code lines within editor</div>
          </div>
        </label>

        <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
          strictModeEnabled ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40' : 'bg-slate-50 dark:bg-gray-900/30 border-slate-200 dark:border-white/5 opacity-60'
        }`}>
          <input
            type="checkbox"
            checked={recordEvents}
            disabled={!strictModeEnabled}
            onChange={(e) => {
              setRecordEvents(e.target.checked);
              handleSave({ recordEvents: e.target.checked });
            }}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Record Restricted Events</div>
            <div className="text-xs text-slate-600 dark:text-gray-400">Logs event alerts to the live dashboard</div>
          </div>
        </label>
      </div>

      {saveSuccess && (
        <div className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Strict Mode settings saved and synced to student environments!
        </div>
      )}

      {/* Mandatory Technical Limitation & Security Disclaimer */}
      <div className="mt-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-300">
        <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-800 dark:text-amber-200">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Technical Enforcement Disclaimer
        </div>
        MentorX Strict Mode restricts copy/paste operations within the controlled VS Code environment. Complete system-wide enforcement requires institution-managed Windows/device policies.
      </div>
    </div>
  );
}
