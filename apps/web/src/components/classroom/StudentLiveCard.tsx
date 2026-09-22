'use client';

import { useState } from 'react';
import { StudentActivity } from '../../hooks/useClassroomActivity';
import ErrorDetailModal from './ErrorDetailModal';

export default function StudentLiveCard({ activity }: { activity: StudentActivity }) {
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'coding': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'debugging': return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]';
      case 'idle': return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
      case 'online': return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      case 'offline': default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'coding': return 'Coding';
      case 'debugging': return 'Debugging';
      case 'idle': return 'Idle';
      case 'online': return 'Online';
      case 'offline': default: return 'Offline';
    }
  };

  const hasErrors = activity.errors && activity.errors.length > 0;
  const isOffline = activity.status === 'offline' || !activity.status;
  const restrictedAction = activity.lastRestrictedAction;

  const getRestrictedBadge = (eventType?: string) => {
    switch (eventType) {
      case 'multiple_attempts':
        return { label: 'Multiple Attempts', style: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'paste_used':
        return { label: '📋 Paste Detected', style: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      case 'copy_used':
        return { label: '📄 Copy Detected', style: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
      case 'cut_used':
        return { label: '✂️ Cut Detected', style: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'blocked_paste':
        return { label: 'Paste Blocked', style: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'blocked_copy':
        return { label: 'Copy Blocked', style: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'blocked_cut':
        return { label: 'Cut Blocked', style: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      default:
        return { label: 'Activity Alert', style: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    }
  };

  return (
    <div className={`glass-card relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${
      isOffline 
        ? 'border-white/5 bg-[#12121a]/40 opacity-75' 
        : hasErrors 
          ? 'border-red-500/30 bg-[#1a1212]/80' 
          : restrictedAction
            ? 'border-indigo-500/40 bg-[#12121a]/80 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
            : 'border-white/10 bg-[#12121a]/80 hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]'
    }`}>
      
      {/* Status indicator line at top */}
      <div className={`absolute left-0 top-0 h-1 w-full ${isOffline ? 'bg-gray-700' : hasErrors ? 'bg-red-500' : restrictedAction ? 'bg-indigo-500' : 'bg-emerald-500'}`} />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 text-white font-bold border border-white/10">
              {activity.displayName.charAt(0).toUpperCase()}
            </div>
            <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#12121a] ${getStatusColor(activity.status)}`} />
            {/* Copy/paste notification dot on avatar */}
            {restrictedAction && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-[#12121a] animate-pulse" title="Copy/paste activity detected" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">{activity.displayName}</h3>
            <div className="text-xs text-gray-400">{getStatusText(activity.status)}</div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {hasErrors && (
            <div className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 border border-red-500/20 animate-pulse">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {activity.errors!.length} Error{activity.errors!.length > 1 ? 's' : ''}
            </div>
          )}

          {restrictedAction && (
            <div className="flex flex-col items-end gap-0.5">
              <div className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border ${getRestrictedBadge(restrictedAction.eventType).style}`}>
                {getRestrictedBadge(restrictedAction.eventType).label}
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {new Date(restrictedAction.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Language</span>
          <span className="font-medium text-gray-300 flex items-center gap-1.5">
            {activity.language ? (
              <>
                <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                {activity.language}
              </>
            ) : (
              <span className="text-gray-600">None</span>
            )}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">File</span>
          <span className="font-mono text-xs text-gray-300 truncate max-w-[150px]" title={activity.currentFile || ''}>
            {activity.currentFile ? activity.currentFile.split('/').pop() : 'No active file'}
          </span>
        </div>
      </div>
      



      {hasErrors && (
        <button 
          onClick={() => setIsErrorModalOpen(true)}
          className="mt-4 w-full text-left rounded-lg bg-red-950/30 p-2.5 border border-red-900/50 hover:bg-red-900/40 hover:border-red-500/50 transition-all group"
        >
          <div className="text-xs text-red-400 font-mono truncate mb-1">
            {activity.errors![0].message}
          </div>
          <div className="text-[10px] text-red-300/70 uppercase tracking-wider flex justify-between items-center">
            <span>Click to view code & AI analysis</span>
            <svg className="h-3 w-3 transform transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      )}

      <ErrorDetailModal 
        isOpen={isErrorModalOpen} 
        onClose={() => setIsErrorModalOpen(false)} 
        error={activity.errors ? activity.errors[0] : null}
        studentName={activity.displayName}
      />
    </div>
  );
}
