'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';
import { Classroom } from '../../../types';
import ClassroomCard from '../../../components/classroom/ClassroomCard';
import CreateClassroomModal from '../../../components/classroom/CreateClassroomModal';
import CommandPalette from '../../../components/ui/CommandPalette';
import MagneticButton from '../../../components/ui/MagneticButton';
import { TextEffect } from '../../../components/ui/TextEffect';

export default function TeacherDashboard() {
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
        studentCount: parseInt(c.student_count) || 0,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }));
      setClassrooms(mappedData);
    } catch (error: any) {
      console.error('Failed to fetch classrooms:', error?.message || error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteClassroom = async (classroomId: string) => {
    try {
      await api.delete(`/classrooms/${classroomId}`);
      fetchClassrooms();
    } catch (error) {
      console.error('Failed to delete classroom', error);
      alert('Failed to delete classroom. Please try again.');
    }
  };

  useEffect(() => {
    fetchClassrooms();
    const handleFocus = () => fetchClassrooms();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
          <span>★</span> TEACHER MODE
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            {/* Neo Status Sticker Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#CCFF00] text-slate-950 text-xs font-black border-2 border-slate-950 shadow-[3px_3px_0px_0px_#0f172a] rotate-[-1deg] w-fit">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse border border-slate-950" />
              <span>MentorX Assistant Active & Monitoring</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[2px_2px_0px_#0f172a] min-h-[48px] flex items-center">
              <TextEffect per="char">
                Welcome to Your Teaching Hub! 🚀
              </TextEffect>
            </h1>

            <p className="text-sm sm:text-base text-indigo-50 font-extrabold leading-relaxed">
              Manage your classrooms, monitor real-time student coding activity, and collaborate using MentorX Assistant features.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <MagneticButton
              onClick={() => setIsModalOpen(true)}
              className="bg-[#FFE600] text-slate-950 hover:bg-[#ffd700] border-3 border-slate-950 font-black rounded-2xl px-6 py-3.5 text-sm shadow-[5px_5px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#0f172a]"
            >
              + Create Classroom
            </MagneticButton>

            <Link href="/dashboard/chat">
              <MagneticButton
                variant="ghost"
                className="bg-white text-slate-950 hover:bg-slate-100 border-3 border-slate-950 font-black rounded-2xl px-6 py-3.5 text-sm shadow-[5px_5px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#0f172a]"
              >
                ✨ Ask MentorX Assistant
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
            <span>Search classrooms, actions, or tools...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/10 text-[11px] font-black text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/10">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="px-3.5 py-1 rounded-full text-xs font-black bg-indigo-500/15 text-indigo-800 dark:text-indigo-400">
            {classrooms.length} Active Classrooms
          </span>
          <button
            onClick={() => fetchClassrooms()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2 rounded-xl border border-indigo-500/20 transition-all disabled:opacity-50"
            title="Refresh classrooms"
          >
            <svg className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Main Classrooms Section */}
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
            <div className="rounded-2xl bg-indigo-500/10 p-4 text-indigo-700 dark:text-indigo-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No classrooms created yet</h3>
            <p className="text-sm font-semibold text-slate-700 dark:text-gray-400 max-w-md">
              Create your first classroom to share your join code and start tracking real-time student activity.
            </p>
            <MagneticButton onClick={() => setIsModalOpen(true)} className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold">
              Create Your First Classroom
            </MagneticButton>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((classroom) => (
              <ClassroomCard 
                key={classroom.id} 
                classroom={classroom} 
                isTeacherView={true} 
                onDelete={handleDeleteClassroom}
              />
            ))}
          </div>
        )}
      </div>

      <CreateClassroomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={fetchClassrooms} 
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        classrooms={classrooms}
        onOpenCreateModal={() => setIsModalOpen(true)}
      />
    </div>
  );
}
