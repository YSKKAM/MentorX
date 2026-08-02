import { useState } from 'react';
import { api } from '../../lib/api';

interface GeminiReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (payload: any) => void;
  replyToMessageId: string | null;
}

export default function GeminiReplyModal({ isOpen, onClose, onSend, replyToMessageId }: GeminiReplyModalProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'code' | 'image'>('text');
  const [prompt, setPrompt] = useState('');
  const [previewData, setPreviewData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePreview = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setHasPreview(false);
    
    try {
      const data = await api.post('/ai/chat/preview', { prompt, type: activeTab });
      
      if (data.result) {
        setPreviewData(data.result);
        setHasPreview(true);
      } else {
        alert(data.error || 'Failed to generate preview');
      }
    } catch (error: any) {
      console.error('Error generating preview', error);
      alert(error?.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!hasPreview) return;
    
    onSend({
      content: activeTab === 'image' ? 'Image generated successfully' : previewData,
      isAi: true,
      aiProvider: 'gemini',
      replyToId: replyToMessageId,
      prompt: prompt,
      generatedImage: activeTab === 'image' ? previewData : null,
      messageType: activeTab
    });
    
    onClose();
    resetState();
  };

  const resetState = () => {
    setPrompt('');
    setPreviewData('');
    setHasPreview(false);
    setActiveTab('text');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl flex flex-col rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-blue-400">🤖</span> Reply with Gemini
          </h2>
          <button onClick={() => { onClose(); resetState(); }} className="text-gray-400 hover:text-white transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
            {(['text', 'code', 'image'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setHasPreview(false); setPreviewData(''); }}
                className={`flex-1 capitalize py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Generate {tab}
              </button>
            ))}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Your Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Ask Gemini to generate ${activeTab}...`}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition min-h-[100px] resize-y"
            />
          </div>

          {/* Generate Button */}
          {!hasPreview && (
            <button 
              onClick={handleGeneratePreview}
              disabled={isLoading || !prompt.trim()}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                'Generate Preview'
              )}
            </button>
          )}

          {/* Preview Area */}
          {hasPreview && (
            <div className="space-y-2 animate-fade-in flex-1 overflow-hidden flex flex-col">
              <label className="text-sm font-medium text-emerald-400 flex justify-between">
                Preview (You can edit before sending)
                <button onClick={() => setHasPreview(false)} className="text-xs text-blue-400 hover:underline">
                  Regenerate
                </button>
              </label>
              
              <div className="flex-1 bg-black/40 border border-emerald-500/30 rounded-xl overflow-hidden relative group max-h-[300px] overflow-y-auto">
                {activeTab === 'image' ? (
                  <img src={previewData} alt="Generated" className="w-full h-full object-contain" />
                ) : activeTab === 'code' ? (
                  <textarea 
                    value={previewData}
                    onChange={(e) => setPreviewData(e.target.value)}
                    className="w-full h-full bg-transparent p-4 text-sm font-mono text-gray-300 focus:outline-none resize-none min-h-[200px]"
                  />
                ) : (
                  <textarea 
                    value={previewData}
                    onChange={(e) => setPreviewData(e.target.value)}
                    className="w-full h-full bg-transparent p-4 text-sm text-gray-200 focus:outline-none resize-none min-h-[200px]"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
          <button 
            onClick={() => { onClose(); resetState(); }}
            className="px-6 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={!hasPreview}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            Send to Chat
          </button>
        </div>

      </div>
    </div>
  );
}
