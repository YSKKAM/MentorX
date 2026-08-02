"use client";

import { useState, useRef, useEffect, use } from "react";
import { api } from "../../../../lib/api";
import { socketService } from "../../../../lib/socket";
import { useAuth } from "../../../../hooks/useAuth";
import { QRCodeSVG } from "qrcode.react";

interface ChatMessage {
  id: string;
  classroom_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  is_ai_response: boolean;
  ai_provider?: string;
  ai_requested_by?: string;
  reply_to_id?: string;
  message_type?: "text" | "code" | "image";
  created_at: string;
}

interface ChatRoom {
  id: string;
  name: string;
  join_code: string;
  creator_id: string;
}

export default function PrivateChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { user } = useAuth();
  
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState("Gemini (AI)");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  useEffect(() => {
    if (!user || !roomId) return;

    const loadData = async () => {
      try {
        const roomRes = await api.get(`/chat-rooms/${roomId}`);
        if (roomRes.status === 'success') {
          setRoom(roomRes.data);
        }

        const histRes = await api.get(`/chat-rooms/${roomId}/history`);
        if (histRes.status === 'success' && histRes.data) {
          setMessages(histRes.data);
        }
      } catch (err) {
        console.error('Failed to load chat room data', err);
      }
    };
    
    loadData();

    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = socketService.connect(token);
    
    socket.emit('chat_room:join', { chatRoomId: roomId });

    const onNewMessage = (msg: ChatMessage) => {
      if (msg.classroom_id === roomId) {
        setMessages((prev) => {
           if (prev.some(m => m.id === msg.id)) return prev;
           return [...prev, msg];
        });
        if (msg.is_ai_response) {
          setIsAiTyping(false);
        }
      }
    };

    const onAiTyping = (data: { chatRoomId?: string; classroomId?: string; provider: string; isTyping: boolean }) => {
      if (data.chatRoomId === roomId || data.classroomId === roomId) {
        setIsAiTyping(data.isTyping);
      }
    };

    socket.on('chat:new-message', onNewMessage);
    socket.on('chat:ai-typing', onAiTyping);

    return () => {
      socket.off('chat:new-message', onNewMessage);
      socket.off('chat:ai-typing', onAiTyping);
      socket.emit('chat_room:leave', { chatRoomId: roomId });
    };
  }, [user, roomId]);

  const handleSend = () => {
    if (!prompt.trim() || !user) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    const tempId = Date.now().toString();
    const newMsg: ChatMessage = {
      id: tempId,
      classroom_id: roomId,
      sender_id: user.id,
      sender_name: user.displayName || 'You',
      sender_role: 'student',
      content: prompt,
      is_ai_response: false,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, newMsg]);
    setPrompt("");

    socket.emit('chat:send-message', {
      chatRoomId: roomId,
      content: prompt,
      isAi: false
    });
  };

  const handleAskAI = (targetMsg: ChatMessage) => {
    if (!aiProvider.includes('Gemini')) {
      alert(`${aiProvider} is currently unavailable. Please select Gemini from the dropdown.`);
      return;
    }

    const socket = socketService.getSocket();
    if (!socket) return;

    setIsAiTyping(true);
    socket.emit('chat:ask-ai', {
      chatRoomId: roomId,
      prompt: `Context: "${targetMsg.content}". Please provide a helpful answer or generate the code requested.`,
      provider: 'gemini'
    });
  };

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/chat` : '';

  return (
    <div className="relative flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl border border-slate-900/10 dark:border-white/20 glass-card-light dark:glass-card shadow-2xl transition-colors duration-300">
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 dark:bg-purple-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse [animation-duration:8s]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-violet-500/10 dark:bg-blue-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse [animation-duration:10s] [animation-delay:2s]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4 sm:p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-lg shadow-md">
              💬
            </div>
            <div>
              <h3 className="font-black text-slate-950 dark:text-white text-lg tracking-tight flex items-center gap-2">
                {room?.name || 'Private Room'}
              </h3>
              <span className="text-[11px] font-bold text-slate-700 dark:text-gray-400 block -mt-0.5">
                AI Multiplayer Lounge
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-gray-300">
               <span>Code:</span>
               <span className="font-mono text-indigo-700 dark:text-emerald-400 font-extrabold">{room?.join_code || '...'}</span>
            </div>
            <button 
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 text-xs font-extrabold rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 text-white shadow-md hover:shadow-indigo-500/30 transition-all hover:scale-[1.02]"
            >
              🤝 Share Room
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-700 dark:text-gray-400">
              <div className="relative mb-6 group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 blur-xl opacity-40 animate-pulse"></div>
                <div className="relative bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:to-[#16213e] w-20 h-20 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/20 shadow-2xl text-3xl">
                  🔒
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white mb-2">{room?.name || 'Your Room'}</h2>
              <p className="text-xs sm:text-sm font-semibold max-w-md leading-relaxed text-slate-800 dark:text-gray-400 mb-6">
                This room is ready. Share Room Code <strong className="text-indigo-700 dark:text-emerald-400 font-mono font-extrabold">{room?.join_code}</strong> to start chatting with peers and AI Assistant.
              </p>
              <button 
                onClick={() => setShowShareModal(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-900/10 dark:bg-white/5 border border-slate-900/15 dark:border-white/10 text-slate-900 dark:text-white font-extrabold text-xs hover:bg-slate-900/15 transition-all"
              >
                View Share QR Code
              </button>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              
              return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full group`}>
                <div className="mb-1 text-[11px] font-black tracking-wider text-slate-700 dark:text-gray-400 uppercase px-2 flex items-center gap-1.5">
                  {isMe ? (
                    <>You <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span></>
                  ) : msg.is_ai_response ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse"></span> AI Assistant (requested by {msg.ai_requested_by})</>
                  ) : (
                    <><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> {msg.sender_name}</>
                  )}
                </div>
                
                <div className="relative group/msg">
                  <div 
                    className={`max-w-2xl rounded-2xl p-4 text-sm font-semibold shadow-md transition-all ${
                      isMe 
                        ? 'rounded-tr-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/15' 
                        : msg.is_ai_response
                        ? 'rounded-tl-sm border border-indigo-500/30 bg-indigo-50/90 dark:bg-indigo-900/20 text-slate-950 dark:text-gray-200 backdrop-blur-md'
                        : 'rounded-tl-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1e1e2d]/80 text-slate-950 dark:text-gray-200 backdrop-blur-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {msg.content}
                    </div>
                  </div>
                  
                  {/* AI Reply Button */}
                  {!isMe && !msg.is_ai_response && (
                    <button
                      onClick={() => handleAskAI(msg)}
                      className="absolute -right-11 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-all p-2 rounded-full bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 shadow-lg text-xs hover:scale-110"
                      title={`Invoke AI Assistant to reply to ${msg.sender_name}`}
                    >
                      ✨
                    </button>
                  )}
                </div>
              </div>
            )})
          )}

          {isAiTyping && (
            <div className="flex flex-col items-start w-full">
              <div className="mb-1 text-[11px] font-black tracking-wider text-slate-700 dark:text-gray-400 uppercase px-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> AI Assistant Thinking...
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1e1e2d] p-4 shadow-md backdrop-blur-md flex items-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-violet-600 [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-rose-500"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 p-4 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
            
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-black text-slate-700 dark:text-gray-400 uppercase tracking-wider">Assistant Provider:</span>
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/10 dark:bg-[#161622] border border-slate-900/15 dark:border-white/10 text-xs font-black text-indigo-800 dark:text-indigo-400 hover:border-indigo-500/30 transition-all"
                >
                  🤖 {aiProvider}
                  <svg className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1e1e2d] p-1.5 shadow-2xl backdrop-blur-3xl z-50">
                    {['Gemini (AI)', 'Claude (Offline)', 'OpenAI (Offline)'].map(ai => (
                      <button
                        key={ai}
                        onClick={() => { setAiProvider(ai); setIsDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                          aiProvider === ai ? 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-400' : 'text-slate-800 dark:text-gray-400 hover:bg-slate-900/10 dark:hover:bg-white/5'
                        }`}
                      >
                        {ai}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex items-end w-full">
              <div className="relative flex w-full bg-white dark:bg-[#161622] rounded-2xl border border-slate-900/15 dark:border-white/10 focus-within:border-indigo-600 transition-all shadow-sm">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message to the lounge..."
                  className="flex-1 max-h-32 min-h-[52px] resize-none bg-transparent px-4 py-3.5 text-sm font-semibold text-slate-950 dark:text-white placeholder-slate-500 outline-none"
                  rows={1}
                />
                <div className="p-1.5 flex items-end">
                  <button
                    onClick={handleSend}
                    disabled={!prompt.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 transition-all"
                  >
                    <svg className="h-4 w-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-lg font-black text-slate-950 dark:text-white mb-5 text-center">Share Room Code</h3>
              
              <div className="flex justify-center mb-6 bg-white p-3 rounded-2xl border border-slate-200">
                <QRCodeSVG value={inviteUrl} size={170} level="H" includeMargin={true} />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-1 block">Room Code</label>
                  <input readOnly value={room?.join_code || ''} className="w-full bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-slate-950 dark:text-white font-mono text-center font-black tracking-widest text-base" />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-gray-400 text-center">
                  Share this code with your classmates to join the chat lounge.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
