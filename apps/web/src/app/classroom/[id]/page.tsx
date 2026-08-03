'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Classroom, ClassroomStudent } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import StudentLiveCard from '../../../components/classroom/StudentLiveCard';
import ActivityCharts from '../../../components/classroom/ActivityCharts';
import AssignmentsList from '../../../components/classroom/AssignmentsList';
import Button from '../../../components/ui/Button';
import ClassroomChat from '../../../components/chat/ClassroomChat';
import { useClassroomActivity } from '../../../hooks/useClassroomActivity';

export default function ClassroomDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'assignments'>('live');

  const { activities, loading: activityLoading } = useClassroomActivity(id);

  const totalOnline = activities.filter(a => a.status === 'coding' || a.status === 'online').length;
  const activeLanguages = Array.from(new Set(activities.map(a => a.language).filter(Boolean))) as string[];

  const [accessError, setAccessError] = useState<string | null>(null);

  const fetchClassroomDetails = async () => {
    setIsLoading(true);
    setAccessError(null);
    try {
      const roomData = await api.get(`/classrooms/${id}`);
      setClassroom({
        ...roomData,
        joinCode: roomData.join_code,
        teacherId: roomData.teacher_id,
        teacherName: roomData.teacher_name,
        studentCount: roomData.student_count,
        createdAt: roomData.created_at,
        updatedAt: roomData.updated_at
      });

      const studentsData = await api.get(`/classrooms/${id}/students`);
      setStudents(studentsData.map((s: any) => ({
        id: s.id,
        studentName: s.student_name,
        studentEmail: s.student_email,
        joinedAt: s.joined_at
      })));
    } catch (error: any) {
      console.warn('Classroom details fetch warning:', error?.message || error);
      if (error?.status === 403) {
        setAccessError('Access Denied: You do not have permission to view this classroom or are not enrolled in it yet.');
      } else {
        setAccessError('Classroom Not Found: This classroom ID may have been deleted or does not exist.');
      }
      setClassroom(null);
    } finally {
      setIsLoading(false);
    }
  };

  const copyJoinCode = () => {
    if (classroom?.joinCode) {
      navigator.clipboard.writeText(classroom.joinCode);
      alert('Join code copied to clipboard!');
    }
  };

  useEffect(() => {
    fetchClassroomDetails();
  }, [id]);

  const isTeacher = user?.role === 'teacher' && user?.id === classroom?.teacherId;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="glass-card-light dark:glass-card flex min-h-[40vh] flex-col items-center justify-center space-y-4 rounded-3xl border border-slate-900/10 dark:border-white/10 p-8 text-center m-6 shadow-xl">
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">
          {accessError?.startsWith('Access Denied') ? 'Access Denied' : 'Classroom Not Found'}
        </h2>
        <p className="text-sm font-bold text-slate-700 dark:text-gray-400 max-w-md">
          {accessError || 'This classroom ID may have been deleted or does not exist. Please return to your active classrooms dashboard.'}
        </p>
        <Button 
          onClick={() => router.push(user?.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student')}
          className="font-extrabold px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
        >
          Go to My Active Classrooms
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <button 
        onClick={() => router.back()}
        className="group flex items-center text-sm font-bold text-slate-700 hover:text-slate-950 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <svg className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      {/* Classroom Header Banner */}
      <div className="hero-gradient-card overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-2xl relative">
        <h1 className="text-3xl font-black sm:text-4xl tracking-tight">{classroom.name}</h1>
        {classroom.description && (
          <p className="mt-3 text-base text-white/95 max-w-3xl font-semibold leading-relaxed">{classroom.description}</p>
        )}
        
        <div className="mt-8 flex flex-wrap items-center gap-6">
          {isTeacher ? (
            <div className="flex items-center gap-3 rounded-2xl bg-black/30 p-3.5 backdrop-blur-md border border-white/20">
              <div>
                <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Join Code</div>
                <div className="font-mono text-xl font-black tracking-widest text-emerald-300">{classroom.joinCode}</div>
              </div>
              <button 
                onClick={copyJoinCode}
                className="ml-2 rounded-xl bg-white/20 p-2 text-white hover:bg-white/30 transition-all"
                title="Copy Code"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold">
                {classroom.teacherName?.charAt(0) || 'T'}
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Instructor</div>
                <div className="text-base font-bold text-white">{classroom.teacherName || 'Unknown'}</div>
              </div>
            </div>
          )}
          
          <div className="ml-auto flex items-center gap-2 rounded-2xl bg-white/20 px-4 py-2 border border-white/20 backdrop-blur-md font-bold text-sm">
            <span>👥 {students.length} Enrolled Students</span>
          </div>
        </div>
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card-light dark:glass-card overflow-hidden rounded-3xl border border-slate-900/10 dark:border-white/10 p-6 sm:p-8 shadow-xl">
            
            <div className="flex space-x-6 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
              <button
                onClick={() => setActiveTab('live')}
                className={`pb-2 text-lg font-black transition-all ${activeTab === 'live' ? 'text-indigo-600 dark:text-white border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900 dark:text-gray-400'}`}
              >
                ⚡ Live Dashboard
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`pb-2 text-lg font-black transition-all ${activeTab === 'assignments' ? 'text-indigo-600 dark:text-white border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900 dark:text-gray-400'}`}
              >
                📚 Assignments
              </button>
            </div>

            {activeTab === 'assignments' ? (
              <AssignmentsList classroomId={classroom.id} isTeacher={isTeacher} />
            ) : isTeacher ? (
              <>
                <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-5">
                    <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase">Live Active Students</div>
                    <div className="text-3xl font-black text-slate-950 dark:text-white mt-1">{totalOnline} Online</div>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Active Languages</div>
                    <div className="text-xl font-black text-slate-950 dark:text-white mt-1 truncate">
                      {activeLanguages.length > 0 ? activeLanguages.join(', ') : 'None'}
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <ActivityCharts activities={activities} />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white">Student Real-Time Feeds</h3>
                  {activities.length === 0 ? (
                    <div className="p-8 text-center text-sm font-semibold text-slate-600 dark:text-gray-400 border border-dashed rounded-2xl">
                      No active student activity detected yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activities.map((act) => (
                        <StudentLiveCard key={act.studentId} activity={act} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">Classroom Activity Stream</h3>
                <p className="text-sm font-semibold text-slate-700 dark:text-gray-400">
                  Open your VS Code extension to auto-sync your coding activity with this classroom!
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Classroom Live Chat Sidebar */}
        <div className="space-y-6">
          <ClassroomChat classroomId={classroom.id} currentUser={user} />
        </div>
      </div>
    </div>
  );
}
