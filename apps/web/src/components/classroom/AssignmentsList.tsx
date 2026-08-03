import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import Button from '../ui/Button';
import CreateAssignmentModal from './CreateAssignmentModal';

interface AssignmentsListProps {
  classroomId: string;
  isTeacher: boolean;
}

export default function AssignmentsList({ classroomId, isTeacher }: AssignmentsListProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get(`/assignments/classroom/${classroomId}`);
      setAssignments(data || []);
    } catch (error) {
      console.error('Failed to fetch assignments', error);
    } finally {
      setIsLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const publishAssignment = async (id: string) => {
    try {
      await api.post(`/assignments/${id}/publish`, {});
      fetchAssignments();
    } catch (error) {
      console.error('Failed to publish', error);
    }
  };

  const deleteAssignment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      fetchAssignments();
    } catch (error) {
      console.error('Failed to delete', error);
      alert('Failed to delete assignment');
    }
  };

  if (isLoading) {
    return <div className="text-gray-400 py-8 text-center">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Assignments</h3>
        {isTeacher && (
          <Button onClick={() => setShowCreateModal(true)} variant="primary">
            + Create Assignment
          </Button>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
          <p className="text-gray-400">No assignments have been created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map(assignment => (
            <div key={assignment.id} className="rounded-xl border border-white/10 bg-black/40 p-5 hover:bg-black/60 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-medium text-white">{assignment.title}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${assignment.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {assignment.is_published ? 'Published' : 'Draft'}
                  </span>
                  {isTeacher && (
                    <button 
                      onClick={() => deleteAssignment(assignment.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete Assignment"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{assignment.language}</span>
                <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">{assignment.difficulty}</span>
                <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{assignment.marks} Marks</span>
              </div>

              {isTeacher && !assignment.is_published && (
                <div className="flex flex-col gap-2 w-full">
                  <Button onClick={() => publishAssignment(assignment.id)} variant="secondary" className="w-full">
                    Publish to Students
                  </Button>
                  <Button 
                    onClick={() => window.location.href = `/classroom/${classroomId}/assignments/${assignment.id}`} 
                    variant="ghost" 
                    className="w-full text-xs text-slate-400 hover:text-white"
                  >
                    Preview Web Sandbox 💻
                  </Button>
                </div>
              )}
              
              {isTeacher && assignment.is_published && (
                <div className="flex gap-2 w-full">
                  <Button 
                    onClick={() => window.location.href = `/classroom/${classroomId}/assignments/${assignment.id}/analytics`} 
                    variant="primary" 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Analytics
                  </Button>
                  <Button 
                    onClick={() => window.location.href = `/classroom/${classroomId}/assignments/${assignment.id}`} 
                    variant="secondary" 
                    className="flex-1"
                  >
                    Sandbox 💻
                  </Button>
                </div>
              )}

              {!isTeacher && (
                <Button 
                  onClick={() => window.location.href = `/classroom/${classroomId}/assignments/${assignment.id}`} 
                  variant="primary" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Open Web Sandbox 💻
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAssignmentModal 
          classroomId={classroomId} 
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
}
