'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Classroom, ClassroomStudent } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { useClassroomActivity } from '../../../hooks/useClassroomActivity';
import StudentLiveCard from '../../../components/classroom/StudentLiveCard';
import ActivityCharts from '../../../components/classroom/ActivityCharts';
import ClassroomChat from '../../../components/chat/ClassroomChat';
import AssignmentsList from '../../../components/classroom/AssignmentsList';

export default function ClassroomDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'live' | 'assignments'>('live');
  
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isTeacher = user?.role === 'teacher';
  const { activities, loading: activityLoading } = useClassroomActivity(params.id as string);

  useEffect(() => {
    const fetchClassroomDetails = async () => {
      try {
        const id = params.id as string;
        const res = await api.get(`/classrooms/${id}`);
        
        setClassroom({
          id: res.id,
          name: res.name,
          description: res.description,
          joinCode: res.join_code,
          teacherId: res.teacher_id,
          teacherName: res.teacher_name,
          isActive: res.is_active,
          studentCount: res.students?.length || 0,
          createdAt: res.created_at,
          updatedAt: res.updated_at
        });
        
        if (res.students) {
          setStudents(res.students.map((s: any) => ({
            id: s.id,
            studentName: s.display_name,
            studentEmail: s.email,
            joinedAt: s.joined_at
          })));
        }
      } catch (error: any) {
        if (error?.status !== 404) {
          console.error('Failed to fetch classroom', error);
        }
        addToast('Failed to load classroom details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchClassroomDetails();
    }
  }, [params.id, addToast]);

  const copyJoinCode = () => {
    if (classroom?.joinCode) {
      navigator.clipboard.writeText(classroom.joinCode);
      addToast('Join code copied to clipboard!', 'success');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0f] p-4 text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Classroom not found</h2>
        <p className="mb-6 text-gray-400">The classroom you're looking for doesn't exist or you don't have access.</p>
        <Button onClick={() => router.back()} variant="primary">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl animate-fade-in space-y-6">
        <button 
          onClick={() => router.back()}
          className="group mb-6 flex items-center text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          <svg className="mr-2 h-4 w-4 transform transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        <div className="glass-card overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]/80 backdrop-blur-xl">
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-8 sm:p-10">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{classroom.name}</h1>
            {classroom.description && (
              <p className="mt-4 text-lg text-gray-300 max-w-3xl">{classroom.description}</p>
            )}
            
            <div className="mt-8 flex flex-wrap items-center gap-6">
              {isTeacher ? (
                <div className="flex items-center gap-3 rounded-lg bg-black/40 p-3 backdrop-blur-md border border-white/10">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Join Code</div>
                    <div className="font-mono text-xl font-bold tracking-widest text-emerald-400">{classroom.joinCode}</div>
                  </div>
                  <button 
                    onClick={copyJoinCode}
                    className="ml-2 rounded bg-white/10 p-2 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
                    title="Copy Code"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {classroom.teacherName?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Teacher</div>
                    <div className="text-lg font-medium text-white">{classroom.teacherName || 'Unknown'}</div>
                  </div>
                </div>
              )}
              
              <div className="ml-auto flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 border border-white/10">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="font-medium text-white">{students.length} Students</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]/80 backdrop-blur-xl p-8">
              
              <div className="flex space-x-4 mb-6 border-b border-white/10 pb-4">
                <button
                  onClick={() => setActiveTab('live')}
                  className={`pb-2 text-xl font-semibold transition-colors ${activeTab === 'live' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Live Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className={`pb-2 text-xl font-semibold transition-colors ${activeTab === 'assignments' ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Assignments
                </button>
              </div>

              {activeTab === 'assignments' ? (
                <AssignmentsList classroomId={classroom.id} isTeacher={isTeacher} />
              ) : isTeacher ? (
                <>
                  
                  {activityLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
                      <p className="text-gray-400">No students have joined this classroom yet.</p>
                      <p className="mt-2 text-sm text-gray-500">Share the join code <span className="font-mono text-emerald-400">{classroom.joinCode}</span> with your students.</p>
                    </div>
                  ) : (
                    <>
                      <ActivityCharts activities={activities} />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {activities.map(act => (
                          <StudentLiveCard key={act.studentId} activity={act} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <h3 className="mb-6 text-xl font-semibold text-white border-b border-white/10 pb-4">Classmates</h3>
                  
                  {students.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
                      <p className="text-gray-400">No students have joined this classroom yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-xs uppercase text-gray-300">
                          <tr>
                            <th scope="col" className="px-6 py-4 font-medium rounded-tl-lg">Student Name</th>
                            <th scope="col" className="px-6 py-4 font-medium rounded-tr-lg">Joined At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {students.map((student) => (
                            <tr key={student.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                    {student.studentName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-white">{student.studentName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {new Date(student.joinedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <ClassroomChat classroomId={classroom.id} currentUser={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
