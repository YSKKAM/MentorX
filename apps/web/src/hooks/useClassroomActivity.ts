import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../lib/socket';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

export interface StudentActivity {
  studentId: string;
  displayName: string;
  email: string;
  language: string | null;
  status: string;
  currentFile: string | null;
  errors: any[] | null;
  timestamp: string;
}

export function useClassroomActivity(classroomId: string) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Record<string, StudentActivity>>({});
  const [loading, setLoading] = useState(true);

  // Initial fetch of activity history
  const fetchInitialActivity = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get(`/activity/classroom/${classroomId}`);
      
      const activityMap: Record<string, StudentActivity> = {};
      data.forEach((act: any) => {
        activityMap[act.student_id] = {
          studentId: act.student_id,
          displayName: act.display_name,
          email: act.email,
          language: act.language,
          status: act.status,
          currentFile: act.current_file,
          errors: act.errors,
          timestamp: act.timestamp
        };
      });
      setActivities(activityMap);
    } catch (error: any) {
      console.warn('Classroom activity fetch warning:', error?.message || error);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchInitialActivity();
  }, [fetchInitialActivity]);

  // Socket.IO real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || user?.role !== 'teacher') return;

    const socket = socketService.connect(token);
    
    // Join classroom room
    socket.emit('classroom:join', { classroomId });

    // Listen for status changes (online/offline)
    const handleStatusChange = (data: { studentId: string; status: string }) => {
      setActivities(prev => {
        const studentActivity = prev[data.studentId];
        if (!studentActivity) return prev;
        
        return {
          ...prev,
          [data.studentId]: {
            ...studentActivity,
            status: data.status,
            timestamp: new Date().toISOString()
          }
        };
      });
    };

    // Listen for activity updates (coding, errors, language change)
    const handleActivityUpdate = (data: { studentId: string; activity: any }) => {
      const act = data.activity;
      setActivities(prev => {
        // Need to preserve displayName and email which aren't in the raw activity event
        const existing = prev[data.studentId] || { 
          displayName: 'Unknown', 
          email: '' 
        };
        
        return {
          ...prev,
          [data.studentId]: {
            ...existing,
            studentId: act.student_id,
            language: act.language,
            status: act.status,
            currentFile: act.current_file,
            errors: act.errors,
            timestamp: act.timestamp
          }
        };
      });
    };

    socket.on('student:status-change', handleStatusChange);
    socket.on('classroom:activity-update', handleActivityUpdate);

    return () => {
      socket.emit('classroom:leave', { classroomId });
      socket.off('student:status-change', handleStatusChange);
      socket.off('classroom:activity-update', handleActivityUpdate);
      // We don't disconnect the entire socket service here in case other components use it,
      // but we could if this is the only page using sockets.
    };
  }, [classroomId, user]);

  return { activities: Object.values(activities), loading };
}
