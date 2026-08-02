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
  const [aiProvider, setAiProvider] = useState("Gemini");
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

    // Load room details & history
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
    
    // Join private room channel
    socket.emit('chat_room:join', { chatRoomId: roomId });

    const onNewMessage = (msg: ChatMessage) => {
      // API returns classroom_id representing chat_room_id for now due to alias in getMessages
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
    if (aiProvider !== 'Gemini') {
      alert(`${aiProvider} is currently unavailable. Please select Gemini from the dropdown.`);
      return;
    }

    const socket = socketService.getSocket();
    if (!socket) return;

    setIsAiTyping(true);
    socket.emit('chat:ask-ai', {
      chatRoomId: roomId,
      prompt: `Context: "${targetMsg.content}". Please provide a helpful answer or generate the code requested.`,
      provider: aiProvider.toLowerCase()
    });
  };

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/chat` : '';

  return (
    <div className="relative flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl border border-white/20 bg-[#0a0a0f]/60 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-pulse [animation-duration:8s]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen animate-pulse [animation-duration:10s] [animation-delay:2s]"></div>
        <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px] mix-blend-screen animate-pulse [animation-duration:7s] [animation-delay:4s]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div>
            <h3 className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-xl font-bold text-transparent flex items-center gap-2">
              <span className="text-2xl">✨</span> {room?.name || 'Private Room'}
            </h3>
          </div>
          
          <div className="flex gap-3">
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 backdrop-blur-xl shadow-inner">
               <span className="px-4 py-2 text-xs font-semibold text-gray-300">Room Code: {room?.join_code || '...'}</span>
            </div>
            <button 
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all"
            >
              Share Room
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
              <div className="relative mb-8 group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-700 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] w-24 h-24 rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                  <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🔒</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">{room?.name || 'Your Room'}</h2>
              <p className="text-sm max-w-md leading-relaxed text-gray-400 mb-6">
                This is a private space. Invite others using the Room Code <strong>{room?.join_code}</strong> to start chatting.
              </p>
              <button 
                onClick={() => setShowShareModal(true)}
                className="px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all"
              >
                View Invite QR Code
              </button>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              
              return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full group`}>
                <div className="mb-1.5 text-[11px] font-semibold tracking-wider text-gray-500 uppercase px-2 flex items-center gap-2">
                  {isMe ? (
                    <>You <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span></>
                  ) : msg.is_ai_response ? (
                    <><span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse"></span> {msg.ai_provider} (invoked by {msg.ai_requested_by})</>
                  ) : (
                    <><span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> {msg.sender_name}</>
                  )}
                </div>
                
                <div className="relative group/msg">
                  <div 
                    className={`max-w-2xl rounded-3xl p-5 text-sm shadow-2xl transition-all duration-300 hover:shadow-lg ${
                      isMe 
                        ? 'rounded-tr-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white border border-blue-500/50 shadow-[0_10px_40px_rgba(37,99,235,0.2)]' 
                        : msg.is_ai_response
                        ? 'rounded-tl-sm border border-purple-500/30 bg-purple-900/20 text-gray-200 backdrop-blur-md shadow-[0_10px_40px_rgba(168,85,247,0.1)]'
                        : 'rounded-tl-sm border border-white/10 bg-[#1e1e2d]/80 text-gray-200 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.3)]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                      {msg.content}
                    </div>
                  </div>
                  
                  {/* AI Reply Button (Only on other humans' messages) */}
                  {!isMe && !msg.is_ai_response && (
                    <button
                      onClick={() => handleAskAI(msg)}
                      className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-all duration-300 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 shadow-xl backdrop-blur-md hover:scale-110"
                      title={`Reply to ${msg.sender_name} using ${aiProvider}`}
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
              <div className="mb-1.5 text-[11px] font-semibold tracking-wider text-gray-500 uppercase px-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse"></span> {aiProvider}
              </div>
              <div className="rounded-3xl rounded-tl-sm border border-white/10 bg-[#1e1e2d]/80 p-5 shadow-2xl backdrop-blur-md flex items-center gap-3 w-28">
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-gradient-to-r from-blue-400 to-blue-500 [animation-delay:-0.3s] shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-gradient-to-r from-purple-400 to-purple-500 [animation-delay:-0.15s] shadow-[0_0_8px_rgba(192,132,252,0.8)]"></div>
                <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/10 bg-black/40 p-5 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reply With AI:</span>
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161622] border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:border-white/20 transition-all shadow-inner"
                >
                  {aiProvider}
                  <svg className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-white/10 bg-[#1e1e2d] p-1.5 shadow-2xl backdrop-blur-3xl z-50">
                    {['Gemini', 'Claude', 'OpenAI', 'Hercules'].map(ai => (
                      <button
                        key={ai}
                        onClick={() => { setAiProvider(ai); setIsDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                          aiProvider === ai ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {ai}
                        {ai !== 'Gemini' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">Unavailable</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="relative group flex items-end w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
              <div className="relative flex w-full bg-[#161622] rounded-2xl border border-white/10 shadow-inner">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message to the room..."
                  className="flex-1 max-h-32 min-h-[60px] resize-none bg-transparent px-5 py-4 text-[15px] text-white placeholder-gray-500 outline-none transition-all scrollbar-hide"
                  rows={1}
                />
              <div className="p-2 flex items-end">
                <button
                  onClick={handleSend}
                  disabled={!prompt.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                  <svg className="h-5 w-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="text-center mt-4 text-[11px] font-medium tracking-wide text-gray-500/70">
            Hover over anyone's message and click ✨ to generate an AI reply on their behalf!
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1e1e2d] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-xl font-bold text-white mb-6 text-center">Share Room</h3>
            
            <div className="flex justify-center mb-8 bg-white p-4 rounded-xl">
              <QRCodeSVG value={inviteUrl} size={180} level="H" includeMargin={true} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Room Code</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={room?.join_code || ''} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest" />
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Users can go to <strong>{inviteUrl}</strong> and enter this code to join instantly.
              </p>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
