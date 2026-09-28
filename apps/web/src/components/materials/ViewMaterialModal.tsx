'use client';

import React from 'react';
import { LearningMaterial } from '../../types';
import Button from '../ui/Button';

interface ViewMaterialModalProps {
  material: LearningMaterial;
  onClose: () => void;
  onOpenGenerate: (material: LearningMaterial) => void;
}

export default function ViewMaterialModal({ material, onClose, onOpenGenerate }: ViewMaterialModalProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ready':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black">✓ Ready</span>;
      case 'Failed':
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black">✕ Failed</span>;
      default:
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
            <span className="h-2 w-2 animate-ping rounded-full bg-amber-400"></span>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl border-4 border-black dark:border-white bg-[#0f111a] text-white p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)] relative my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl">
              {material.file_name.endsWith('.pdf') ? '📄' : '📝'}
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase">{material.title}</h2>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                <span>{material.file_name}</span>
                <span>•</span>
                <span>{formatFileSize(material.file_size)}</span>
                <span>•</span>
                <span>{new Date(material.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg">
            ✕
          </button>
        </div>

        {/* Status & Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-[10px] font-black uppercase text-gray-400">Status</div>
            <div className="mt-1">{getStatusBadge(material.processing_status)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-[10px] font-black uppercase text-gray-400">Identified Topics</div>
            <div className="text-xl font-black text-[#00FF66] mt-1">{material.topics?.length || material.topic_count || 0} Topics</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-[10px] font-black uppercase text-gray-400">Generated Questions</div>
            <div className="text-xl font-black text-[#FF66C4] mt-1">{material.question_count || 0} Questions</div>
          </div>
        </div>

        {/* Extracted Topics */}
        <div className="mb-6">
          <h3 className="text-sm font-black uppercase text-gray-300 tracking-wider mb-3">Extracted Core Topics</h3>
          {material.topics && material.topics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {material.topics.map((t) => (
                <div key={t.id} className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                  <div className="font-bold text-sm text-indigo-300 flex items-center gap-1.5">
                    <span>📌</span>
                    <span>{t.name}</span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-gray-400">
              No topics extracted yet or processing in progress.
            </div>
          )}
        </div>

        {/* Content Preview */}
        {material.extracted_text && (
          <div className="mb-6">
            <h3 className="text-sm font-black uppercase text-gray-300 tracking-wider mb-2">Content Preview</h3>
            <div className="rounded-xl border border-white/10 bg-black/50 p-4 max-h-40 overflow-y-auto text-xs text-gray-300 font-mono leading-relaxed select-none">
              {material.extracted_text.slice(0, 1200)}...
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            Close
          </Button>

          {material.processing_status === 'Ready' && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onOpenGenerate(material);
              }}
              className="font-black bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/25"
            >
              ⚡ Generate Questions
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
