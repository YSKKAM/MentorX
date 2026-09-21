'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Classroom } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms?: Classroom[];
  onOpenCreateModal?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  classrooms = [],
  onOpenCreateModal,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Handle Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open triggered by global listener in layout/page
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset query on close
  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'dashboard-teacher',
      title: 'Teacher Dashboard',
      subtitle: 'View and manage all active classrooms',
      icon: '🏫',
      action: () => {
        router.push('/dashboard/teacher');
        onClose();
      },
    },
    {
      id: 'dashboard-student',
      title: 'Student Dashboard',
      subtitle: 'View enrolled courses and submit assignments',
      icon: '🎓',
      action: () => {
        router.push('/dashboard/student');
        onClose();
      },
    },
    {
      id: 'chat-lounge',
      title: 'MentorX Chat Lounge',
      subtitle: 'Open multiplayer chat and invoke AI Assistant',
      icon: '🤖',
      action: () => {
        router.push('/dashboard/chat');
        onClose();
      },
    },
    ...(onOpenCreateModal
      ? [
          {
            id: 'create-classroom',
            title: 'Create New Classroom',
            subtitle: 'Generate a join code and invite students',
            icon: '✨',
            action: () => {
              onClose();
              onOpenCreateModal();
            },
          },
        ]
      : []),
  ];

  const filteredClassrooms = classrooms.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-900/10 dark:border-white/20 bg-white/95 dark:bg-[#161622]/95 backdrop-blur-2xl shadow-2xl z-10 flex flex-col max-h-[80vh]"
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 border-b border-slate-900/10 dark:border-white/10 px-6 py-4">
            <svg
              className="w-5 h-5 text-indigo-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search classrooms, pages, actions... (ESC to close)"
              autoFocus
              className="w-full bg-transparent text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 outline-none"
            />
            <kbd className="hidden sm:inline-block rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/10">
              ESC
            </kbd>
          </div>

          {/* Search Results List */}
          <div className="overflow-y-auto p-4 space-y-4 flex-1">
            {/* Classrooms */}
            {filteredClassrooms.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 px-3">
                  Classrooms ({filteredClassrooms.length})
                </span>
                <div className="space-y-1">
                  {filteredClassrooms.map((c) => (
                    <motion.div
                      key={c.id}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        router.push(`/classroom/${c.id}`);
                        onClose();
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/20">
                          📚
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {c.name}
                          </h4>
                          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                            {c.studentCount || 0} enrolled • Code: {c.joinCode}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Jump to →
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {filteredActions.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500 px-3">
                  Quick Navigation & Actions
                </span>
                <div className="space-y-1">
                  {filteredActions.map((a) => (
                    <motion.div
                      key={a.id}
                      whileHover={{ x: 4 }}
                      onClick={a.action}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900/5 dark:bg-white/10 flex items-center justify-center text-lg">
                          {a.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {a.title}
                          </h4>
                          <p className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                            {a.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Open →
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {filteredClassrooms.length === 0 && filteredActions.length === 0 && (
              <div className="py-12 text-center text-slate-400 dark:text-gray-500 font-semibold text-sm">
                No matching classrooms or commands found.
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="border-t border-slate-900/10 dark:border-white/10 px-6 py-3 bg-slate-50/50 dark:bg-black/20 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-gray-500">
            <span>Tip: Type to filter results dynamically</span>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300">
                ⌘K
              </kbd>
              <span>to toggle anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
