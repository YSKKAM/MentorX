import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';

interface ErrorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: any;
  studentName: string;
}

export default function ErrorDetailModal({ isOpen, onClose, error, studentName }: ErrorDetailModalProps) {
  const [topic, setTopic] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [suggestedError, setSuggestedError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && error) {
      setIsLoading(true);
      setTopic(null);
      setInsight(null);
      setSuggestedError(null);
      
      api.post('/ai/analyze-error', { 
        errorMessage: error.message, 
        codeSnippet: error.codeSnippet 
      })
      .then(res => {
        if (res) {
          setTopic(res.topic);
          setInsight(res.insight);
          setSuggestedError(res.suggestedError || null);
        }
      })
      .catch(err => {
        console.error('Failed to get AI analysis', err);
        setTopic('Analysis Failed');
        setInsight('Could not load AI insight for this error.');
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen, error]);

  if (!isOpen || !error || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="glass-card relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]/90 shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="border-b border-white/10 bg-black/40 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Error Analysis: {studentName}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Error Message */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex justify-between items-center">
              Error Message
              {suggestedError && (
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">AI Corrected</span>
              )}
            </h3>
            
            <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-red-400 font-mono text-sm shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              {suggestedError || error.message}
            </div>
            
            {suggestedError && (
              <div className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                <span className="text-gray-600">Compiler:</span>
                <span className="text-gray-500/80 line-through">{error.message}</span>
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>File: <span className="text-gray-300">{error.file || 'unknown'}</span></span>
              <span>Line: <span className="text-gray-300">{error.line || 'unknown'}</span></span>
            </div>
          </div>

          {/* Code Snippet */}
          {error.codeSnippet && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Code Context</h3>
              <div className="rounded-xl border border-white/10 bg-[#0a0a0f] p-4 font-mono text-sm text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
                <pre><code>{error.codeSnippet}</code></pre>
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              AI Concept Analysis
            </h3>
            
            <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 p-5 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              {isLoading ? (
                <div className="flex items-center gap-3 text-blue-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  Analyzing error concept...
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-blue-400/80 uppercase font-semibold">Topic Identified:</span>
                    <div className="text-lg font-medium text-white">{topic}</div>
                  </div>
                  <div>
                    <span className="text-xs text-blue-400/80 uppercase font-semibold">Teaching Insight:</span>
                    <p className="text-gray-300 leading-relaxed mt-1">{insight}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
        
        {/* Footer */}
        <div className="border-t border-white/10 bg-black/40 px-6 py-4 flex justify-end">
          <button 
            onClick={onClose}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
