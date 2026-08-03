'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { socketService } from '../../lib/socket';

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
  prompt?: string;
  generated_image?: string;
  message_type?: string;
  created_at: string;
}

interface ClassroomChatProps {
  classroomId: string;
  currentUser: any;
}

export default function ClassroomChat({ classroomId, currentUser }: ClassroomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiProvider, setAiProvider] = useState('gemini'); // gemini, mock, etc.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [classroomId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = socketService.connect(token);
    if (!socket) return;

    // Join classroom socket room
    socket.emit('classroom:join', { classroomId });

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.classroom_id === classroomId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.is_ai_response) {
          setIsAiTyping(false);
        }
      }
    };

    const handleAiTyping = (data: { classroomId: string; provider: string; isTyping: boolean }) => {
      if (data.classroomId === classroomId) {
        setIsAiTyping(data.isTyping);
      }
    };

    socket.on('chat:new-message', handleNewMessage);
    socket.on('chat:ai-typing', handleAiTyping);

    return () => {
      socket.off('chat:new-message', handleNewMessage);
      socket.off('chat:ai-typing', handleAiTyping);
    };
  }, [classroomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/classroom/${classroomId}`);
      setMessages(res.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const token = localStorage.getItem('token');
    const socket = socketService.connect(token || '');
    if (!socket) {
      console.warn('Socket connection unavailable.');
      return;
    }

    const textToSend = inputValue.trim();
    setInputValue('');

    // Optimistic UI update
    const tempId = Date.now().toString();
    const tempMessage: ChatMessage = {
      id: tempId,
      classroom_id: classroomId,
      sender_id: currentUser?.id || 'me',
      sender_name: currentUser?.displayName || 'You',
      sender_role: currentUser?.role || 'student',
      content: textToSend,
      is_ai_response: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    socket.emit('chat:send-message', {
      classroomId,
      content: textToSend,
      isAi: false,
    });
  };

  const handleAskAI = async () => {
    if (!inputValue.trim()) return;
    
    setIsEnhancing(true);
    try {
      const res = await api.post('/ai/enhance', {
        text: inputValue.trim(),
        provider: aiProvider
      });
      if (res && res.enhancedText) {
        setInputValue(res.enhancedText);
      }
    } catch (error) {
      console.error('Failed to enhance text', error);
      alert('Failed to enhance text.');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-slate-900/10 dark:border-white/10 glass-card-light dark:glass-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/40 p-4 backdrop-blur-md">
        <h3 className="font-bold text-slate-950 dark:text-white flex items-center gap-2">
          <span>💬</span> Classroom Chat
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-gray-400">AI Provider:</span>
          <select 
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value)}
            className="rounded-lg bg-slate-100 dark:bg-white/5 px-2 py-1 text-xs font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 outline-none focus:border-indigo-500"
          >
            <option value="gemini">Gemini (AI)</option>
            <option value="mock">Mock AI</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-gray-400">
            <svg className="mb-2 h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm font-semibold">No messages yet.<br/>Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id || msg.sender_name === 'You';

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full relative group`}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-gray-400">
                    {isMe ? 'You' : msg.sender_name} {msg.sender_role === 'teacher' && !isMe ? '(Teacher)' : ''}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-gray-500">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-sm font-medium shadow-sm leading-relaxed ${
                    isMe 
                      ? 'rounded-tr-none bg-gradient-to-r from-indigo-600 to-violet-600 text-white' 
                      : 'rounded-tl-none bg-white dark:bg-[#1e1e2d] text-slate-950 dark:text-gray-200 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        
        {isAiTyping && (
          <div className="flex flex-col items-start w-full max-w-[90%]">
             <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md">
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-indigo-400">AI Assistant Thinking...</span>
            </div>
            <div className="rounded-2xl rounded-tl-none border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1e1e2d] p-4 shadow-sm">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-indigo-500"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 p-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message to the class..."
            className="flex-1 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-950 dark:text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          
          <button
            onClick={handleAskAI}
            disabled={!inputValue.trim() || isEnhancing}
            className="group flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white transition-all hover:scale-105 disabled:opacity-40"
            title="Enhance message with AI"
          >
            {isEnhancing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white transition-all hover:scale-105 disabled:opacity-40"
            title="Send Message"
          >
            <svg className="h-4 w-4 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
