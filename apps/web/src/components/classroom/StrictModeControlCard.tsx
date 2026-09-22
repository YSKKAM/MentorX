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
    <div className="rounded-3xl border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)] p-6 bg-[#FDFBF7] dark:bg-[#181824] text-slate-950 dark:text-white transition-all overflow-hidden">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-black dark:border-white pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <h3 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">MentorX Strict Mode</h3>
            <span className={`px-3.5 py-1 rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              strictModeEnabled 
                ? 'bg-[#00FF66] text-black animate-pulse' 
                : 'bg-[#FF6666] text-black'
            }`}>
              {strictModeEnabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-gray-300 mt-1">
            Enforce editor-level copy/paste restriction and receive real-time monitoring alerts.
          </p>
        </div>

        {/* Master Toggle Switch */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
            {strictModeEnabled ? 'Strict Mode Enabled' : 'Strict Mode Disabled'}
          </span>
          <button
            type="button"
            onClick={() => toggleMasterSwitch(!strictModeEnabled)}
            className={`relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer rounded-full border-3 border-black dark:border-white transition-colors duration-200 ease-in-out focus:outline-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.9)] ${
              strictModeEnabled ? 'bg-[#5800FF]' : 'bg-slate-300 dark:bg-gray-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#FFDE59] border-2 border-black shadow ring-0 transition duration-200 ease-in-out mt-0.5 ${
                strictModeEnabled ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Checkbox Option Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className={`flex items-start gap-3 p-4 rounded-2xl border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] transition-all ${
          strictModeEnabled 
            ? 'bg-white dark:bg-[#222234] text-slate-950 dark:text-white cursor-pointer hover:-translate-y-0.5' 
            : 'bg-gray-100 dark:bg-gray-800/60 opacity-60 text-gray-500 cursor-not-allowed'
        }`}>
          <input
            type="checkbox"
            checked={blockPaste}
            disabled={!strictModeEnabled}
            onChange={(e) => {
              setBlockPaste(e.target.checked);
              handleSave({ blockPaste: e.target.checked });
            }}
            className="mt-1 h-5 w-5 rounded-md border-2 border-black text-[#5800FF] focus:ring-0 accent-[#5800FF] cursor-pointer"
          />
          <div>
            <div className="text-sm font-black text-slate-950 dark:text-white">Block Paste (Ctrl+V)</div>
            <div className="text-xs font-bold text-slate-700 dark:text-gray-300 mt-0.5">Restricts pasting external code inside VS Code</div>
          </div>
        </label>

        <label className={`flex items-start gap-3 p-4 rounded-2xl border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] transition-all ${
          strictModeEnabled 
            ? 'bg-white dark:bg-[#222234] text-slate-950 dark:text-white cursor-pointer hover:-translate-y-0.5' 
            : 'bg-gray-100 dark:bg-gray-800/60 opacity-60 text-gray-500 cursor-not-allowed'
        }`}>
          <input
            type="checkbox"
            checked={blockCopy}
            disabled={!strictModeEnabled}
            onChange={(e) => {
              setBlockCopy(e.target.checked);
              handleSave({ blockCopy: e.target.checked });
            }}
            className="mt-1 h-5 w-5 rounded-md border-2 border-black text-[#5800FF] focus:ring-0 accent-[#5800FF] cursor-pointer"
          />
          <div>
            <div className="text-sm font-black text-slate-950 dark:text-white">Block Copy (Ctrl+C)</div>
            <div className="text-xs font-bold text-slate-700 dark:text-gray-300 mt-0.5">Restricts copying code out of active editor</div>
          </div>
        </label>

        <label className={`flex items-start gap-3 p-4 rounded-2xl border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] transition-all ${
          strictModeEnabled 
            ? 'bg-white dark:bg-[#222234] text-slate-950 dark:text-white cursor-pointer hover:-translate-y-0.5' 
            : 'bg-gray-100 dark:bg-gray-800/60 opacity-60 text-gray-500 cursor-not-allowed'
        }`}>
          <input
            type="checkbox"
            checked={blockCut}
            disabled={!strictModeEnabled}
            onChange={(e) => {
              setBlockCut(e.target.checked);
              handleSave({ blockCut: e.target.checked });
            }}
            className="mt-1 h-5 w-5 rounded-md border-2 border-black text-[#5800FF] focus:ring-0 accent-[#5800FF] cursor-pointer"
          />
          <div>
            <div className="text-sm font-black text-slate-950 dark:text-white">Block Cut (Ctrl+X)</div>
            <div className="text-xs font-bold text-slate-700 dark:text-gray-300 mt-0.5">Restricts cutting code lines within editor</div>
          </div>
        </label>

        <label className={`flex items-start gap-3 p-4 rounded-2xl border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)] transition-all ${
          strictModeEnabled 
            ? 'bg-white dark:bg-[#222234] text-slate-950 dark:text-white cursor-pointer hover:-translate-y-0.5' 
            : 'bg-gray-100 dark:bg-gray-800/60 opacity-60 text-gray-500 cursor-not-allowed'
        }`}>
          <input
            type="checkbox"
            checked={recordEvents}
            disabled={!strictModeEnabled}
            onChange={(e) => {
              setRecordEvents(e.target.checked);
              handleSave({ recordEvents: e.target.checked });
            }}
            className="mt-1 h-5 w-5 rounded-md border-2 border-black text-[#5800FF] focus:ring-0 accent-[#5800FF] cursor-pointer"
          />
          <div>
            <div className="text-sm font-black text-slate-950 dark:text-white">Record Restricted Events</div>
            <div className="text-xs font-bold text-slate-700 dark:text-gray-300 mt-0.5">Logs event alerts to the live dashboard</div>
          </div>
        </label>
      </div>

      {saveSuccess && (
        <div className="mt-4 p-3 rounded-xl bg-[#00FF66] text-black border-2 border-black font-black text-xs flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-fade-in">
          <svg className="h-4 w-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Strict Mode settings saved and synced to student environments!
        </div>
      )}

      {/* Technical Limitation & Security Disclaimer */}
      <div className="mt-6 rounded-2xl bg-[#FFE566] text-black border-3 border-black p-4 text-xs font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] leading-relaxed">
        <div className="font-black text-sm uppercase flex items-center gap-1.5 mb-1 text-black">
          <svg className="h-4 w-4 flex-shrink-0 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Technical Enforcement Disclaimer
        </div>
        MentorX Strict Mode restricts copy/paste operations within the controlled VS Code environment. Complete system-wide enforcement requires institution-managed Windows/device policies.
      </div>
    </div>
  );
}
