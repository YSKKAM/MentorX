'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';
import { Classroom } from '../../../types';
import ClassroomCard from '../../../components/classroom/ClassroomCard';
import JoinClassroomModal from '../../../components/classroom/JoinClassroomModal';
import CommandPalette from '../../../components/ui/CommandPalette';
import MagneticButton from '../../../components/ui/MagneticButton';
import { TextEffect } from '../../../components/ui/TextEffect';

export default function StudentDashboard() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const fetchClassrooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/classrooms');
      const mappedData = data.map((c: any) => ({
        ...c,
        joinCode: c.join_code,
        teacherId: c.teacher_id,
        teacherName: c.teacher_name,
        studentCount: c.student_count,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }));
      setClassrooms(mappedData);
    } catch (error) {
      console.error('Failed to fetch classrooms', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Neo-Brutalist Hero Banner with Bold Animated Gradient */}
      <motion.div 
        initial={{ opacity: 0, y: 15, rotate: -0.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border-4 border-slate-950 dark:border-white bg-gradient-to-r from-violet-700 via-rose-600 via-indigo-600 to-purple-800 animate-bold-gradient text-white shadow-[10px_10px_0px_0px_#0f172a] dark:shadow-[10px_10px_0px_0px_#818cf8]"
      >
        {/* Decorative Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Neo Brutalist Floating Corner Sticker */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#FF0055] text-white text-[11px] font-black uppercase tracking-wider border-2 border-slate-950 shadow-[3px_3px_0px_0px_#0f172a] rotate-[3deg] z-20">
          <span>★</span> STUDENT MODE
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            {/* Neo Status Sticker Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#CCFF00] text-slate-950 text-xs font-black border-2 border-slate-950 shadow-[3px_3px_0px_0px_#0f172a] rotate-[-1deg] w-fit">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse border border-slate-950" />
              <span>MentorX Assistant Ready ⚡</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[2px_2px_0px_#0f172a] min-h-[48px] flex items-center">
              <TextEffect per="char">
                Ready to code today? 💻
              </TextEffect>
            </h1>

            <p className="text-sm sm:text-base text-indigo-50 font-extrabold leading-relaxed">
              Join your classes, complete MentorX-assisted assignments, and get 24/7 guidance from your MentorX Assistant.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <MagneticButton
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FFE600] text-slate-950 hover:bg-[#ffd700] border-3 border-slate-950 font-black rounded-2xl px-6 py-3.5 text-sm shadow-[5px_5px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#0f172a]"
            >
              🤝 Join Class
            </MagneticButton>

            <Link href="/dashboard/chat">
              <MagneticButton
                variant="ghost"
                className="bg-white text-slate-950 hover:bg-slate-100 border-3 border-slate-950 font-black rounded-2xl px-6 py-3.5 text-sm shadow-[5px_5px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#0f172a]"
              >
                ✨ Chat with MentorX Assistant
              </MagneticButton>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick Search & Command Palette Trigger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex-1 max-w-lg flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-900/10 dark:border-white/10 bg-white/80 dark:bg-[#161622]/80 backdrop-blur-md text-slate-400 dark:text-gray-400 hover:border-indigo-500/50 hover:text-slate-600 dark:hover:text-white transition-all shadow-sm group"
        >
          <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search enrolled classes, tools, or commands...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/10 text-[11px] font-black text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/10">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-400">
            {classrooms.length} Enrolled Classes
          </span>
          <button
            onClick={() => fetchClassrooms()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2 rounded-xl border border-indigo-500/20 transition-all disabled:opacity-50"
            title="Refresh classes"
          >
            <svg className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Classes Grid Section */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : classrooms.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card-light dark:glass-card flex h-64 flex-col items-center justify-center space-y-4 rounded-3xl border border-dashed border-slate-300 dark:border-white/20 p-8 text-center"
          >
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No classes joined yet</h3>
            <p className="text-sm font-semibold text-slate-700 dark:text-gray-400 max-w-md">
              Ask your teacher for a join code to enroll in a classroom and start your MentorX coding journey.
            </p>
            <MagneticButton onClick={() => setIsModalOpen(true)} className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold">
              Join Your First Class
            </MagneticButton>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((classroom) => (
              <ClassroomCard key={classroom.id} classroom={classroom} isTeacherView={false} />
            ))}
          </div>
        )}
      </div>

      <JoinClassroomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onJoined={fetchClassrooms} 
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        classrooms={classrooms}
      />
    </div>
  );
}
