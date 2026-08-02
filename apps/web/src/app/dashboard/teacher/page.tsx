'use client';

import { useState, useEffect } from 'react';
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
      // Map snake_case to camelCase
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
      // Refresh the list after successful deletion
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
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Classrooms</h2>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Create Classroom
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="glass-card flex h-64 flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-white/20 p-8 text-center bg-[#12121a]/50">
          <div className="rounded-full bg-blue-500/10 p-4 text-blue-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white">No classrooms yet</h3>
          <p className="text-gray-400 max-w-md">Create your first classroom to invite students and start managing your AI-powered lessons.</p>
          <Button variant="secondary" onClick={() => setIsModalOpen(true)} className="mt-2">
            Create Your First Classroom
          </Button>
        </div>
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

      <CreateClassroomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={fetchClassrooms} 
      />
    </div>
  );
}
