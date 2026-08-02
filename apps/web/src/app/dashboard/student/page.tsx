'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Classroom } from '../../../types';
import ClassroomCard from '../../../components/classroom/ClassroomCard';
import JoinClassroomModal from '../../../components/classroom/JoinClassroomModal';
import Button from '../../../components/ui/Button';

export default function StudentDashboard() {
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
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Stitch Lumina Hero Banner */}
      <div className="hero-gradient-card relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Jarvis Coding Assistant Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Ready to code today? 💻
            </h1>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
              Join your classes, complete AI-assisted assignments, and get 24/7 guidance from Your Jarvis AI Assistant.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-indigo-600 hover:bg-slate-100 border-0 font-bold shadow-lg shadow-black/10 rounded-xl px-5 py-3 text-sm"
            >
              🤝 Join Class
            </Button>
            <Link href="/dashboard/chat">
              <Button
                variant="ghost"
                className="bg-black/20 hover:bg-black/30 border border-white/20 text-white font-semibold rounded-xl px-5 py-3 text-sm backdrop-blur-md"
              >
                ✨ Chat with Your Jarvis
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Classes Grid Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold tracking-tight">My Enrolled Classes</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {classrooms.length} Active
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="glass-card-light dark:glass-card flex h-64 flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 p-8 text-center">
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold">No classes joined yet</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400 max-w-md">
              Ask your teacher for a join code to enroll in a classroom and start your AI coding journey.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="mt-2 rounded-xl">
              Join Your First Class
            </Button>
          </div>
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
    </div>
  );
}
