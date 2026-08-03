'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Classroom } from '../../../types';
import ClassroomCard from '../../../components/classroom/ClassroomCard';
import CreateClassroomModal from '../../../components/classroom/CreateClassroomModal';
import Button from '../../../components/ui/Button';

export default function TeacherDashboard() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    // Refresh classrooms whenever user comes back to this tab
    const handleFocus = () => fetchClassrooms();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchClassrooms]);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Stitch Design Hero Card Banner */}
      <div className="hero-gradient-card relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>AI Assistant Active & Monitoring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome to Your Teaching Hub! 🚀
            </h1>
            <p className="text-sm sm:text-base text-white/95 leading-relaxed font-semibold">
              Manage your classrooms, monitor real-time student coding activity, and collaborate using AI Assistant features.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-indigo-700 hover:bg-slate-100 border-0 font-extrabold shadow-lg shadow-black/10 rounded-xl px-5 py-3 text-sm"
            >
              + Create Classroom
            </Button>
            <Link href="/dashboard/chat">
              <Button
                variant="ghost"
                className="bg-black/20 hover:bg-black/30 border border-white/30 text-white font-bold rounded-xl px-5 py-3 text-sm backdrop-blur-md"
              >
                ✨ Ask AI Assistant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid + AI Classroom Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Classrooms Section (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">My Active Classrooms</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/15 text-indigo-800 dark:text-indigo-400">
                {classrooms.length} Total
              </span>
            </div>
            <button
              onClick={() => fetchClassrooms()}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-500/20 transition-all disabled:opacity-50"
              title="Refresh classrooms"
            >
              <svg className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : classrooms.length === 0 ? (
            <div className="glass-card-light dark:glass-card flex h-64 flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 p-8 text-center">
              <div className="rounded-2xl bg-indigo-500/10 p-4 text-indigo-700 dark:text-indigo-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">No classrooms created yet</h3>
              <p className="text-sm font-semibold text-slate-700 dark:text-gray-400 max-w-md">
                Create your first classroom to share your join code and start tracking real-time student activity.
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="mt-2 rounded-xl font-bold">
                Create Your First Classroom
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

        {/* Right Sidebar: AI Classroom Insights & Real-time Stream */}
        <div className="space-y-6">
          <div className="glass-card-light dark:glass-card rounded-2xl p-6 border border-slate-900/10 dark:border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-white/10">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <span>🤖</span> AI Classroom Insights
              </h3>
              <span className="spark-chip text-[10px] text-rose-700 dark:text-rose-400 font-extrabold">Live Sync</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <span className="font-extrabold text-indigo-900 dark:text-indigo-400">✨ Real-time Tracking</span>
                <p className="text-slate-800 dark:text-gray-300 font-semibold leading-relaxed">
                  Track active student coding sessions from VS Code extension users automatically.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="font-extrabold text-emerald-900 dark:text-emerald-400">💡 AI Multi-Group Lounge</span>
                <p className="text-slate-800 dark:text-gray-300 font-semibold leading-relaxed">
                  Join private chat rooms to invoke AI Assistant on demand for code reviews & debugging.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <span className="font-extrabold text-rose-900 dark:text-rose-400">⚡ Automated Evaluation</span>
                <p className="text-slate-800 dark:text-gray-300 font-semibold leading-relaxed">
                  Automated test cases and hints generated with 1-click AI assistance.
                </p>
              </div>
            </div>

            <Link href="/dashboard/chat" className="block w-full">
              <button className="w-full py-3 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 hover:from-indigo-700 hover:to-rose-600 shadow-md transition-all">
                Open AI Chat Suite →
              </button>
            </Link>
          </div>
        </div>

      </div>

      <CreateClassroomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={fetchClassrooms} 
      />
    </div>
  );
}
