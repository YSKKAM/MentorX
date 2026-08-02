'use client';

import { useState, useEffect } from 'react';
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

  const fetchClassrooms = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/classrooms');
      const mappedData = data.map((c: any) => ({
        ...c,
        joinCode: c.join_code,
        teacherId: c.teacher_id,
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
  };

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
  }, []);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Stitch Design Hero Card Banner */}
      <div className="hero-gradient-card relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Jarvis Assistant Active & Monitoring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome to Your Teaching Hub! 🚀
            </h1>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
              Manage your classrooms, monitor real-time student coding activity, and collaborate using Your Jarvis AI Assistant.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-indigo-600 hover:bg-slate-100 border-0 font-bold shadow-lg shadow-black/10 rounded-xl px-5 py-3 text-sm"
            >
              + Create Classroom
            </Button>
            <Link href="/dashboard/chat">
              <Button
                variant="ghost"
                className="bg-black/20 hover:bg-black/30 border border-white/20 text-white font-semibold rounded-xl px-5 py-3 text-sm backdrop-blur-md"
              >
                ✨ Ask Your Jarvis
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid + Jarvis Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Classrooms Section (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold tracking-tight">My Active Classrooms</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {classrooms.length} Total
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            </div>
          ) : classrooms.length === 0 ? (
            <div className="glass-card-light dark:glass-card flex h-64 flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 p-8 text-center">
              <div className="rounded-2xl bg-indigo-500/10 p-4 text-indigo-600 dark:text-indigo-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">No classrooms created yet</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 max-w-md">
                Create your first classroom to share your join code and start tracking real-time student activity.
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="mt-2 rounded-xl">
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

        {/* Right Sidebar: Jarvis AI Insights & Real-time Stream */}
        <div className="space-y-6">
          <div className="glass-card-light dark:glass-card rounded-2xl p-6 border space-y-5">
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-white/10">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span>🤖</span> Your Jarvis Insights
              </h3>
              <span className="spark-chip text-[10px]">Live Sync</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">✨ Real-time Tracking</span>
                <p className="text-slate-600 dark:text-gray-300 leading-relaxed">
                  Jarvis tracks active coding sessions from VS Code extension users automatically.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">💡 AI Multi-Group Lounge</span>
                <p className="text-slate-600 dark:text-gray-300 leading-relaxed">
                  Join private chat rooms to invoke Jarvis on demand for code reviews & debugging.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <span className="font-bold text-rose-600 dark:text-rose-400">⚡ Code Execution Engine</span>
                <p className="text-slate-600 dark:text-gray-300 leading-relaxed">
                  Automated test cases and hints generated with 1-click AI assistance.
                </p>
              </div>
            </div>

            <Link href="/dashboard/chat" className="block w-full">
              <button className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md transition-all">
                Open Jarvis Suite →
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
