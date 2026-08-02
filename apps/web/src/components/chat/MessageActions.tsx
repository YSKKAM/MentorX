import React from 'react';

interface MessageActionsProps {
  messageId: string;
  onReply: (messageId: string) => void;
  onReplyWithGemini: (messageId: string) => void;
}

export default function MessageActions({ messageId, onReply, onReplyWithGemini }: MessageActionsProps) {
  return (
    <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1a24] border border-white/10 rounded-lg p-1 shadow-lg z-10">
      <button 
        onClick={() => onReply(messageId)}
        className="text-xs font-medium text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition"
        title="Reply"
      >
        Reply
      </button>
      <div className="w-[1px] h-3 bg-white/10"></div>
      <button 
        onClick={() => onReplyWithGemini(messageId)}
        className="text-xs font-medium text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-500/10 transition flex items-center gap-1"
        title="Reply with Gemini"
      >
        <span>🤖</span> Gemini
      </button>
    </div>
  );
}
