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
  lastRestrictedAction?: {
    eventType: string;
    timestamp: string;
    currentFile?: string;
    attemptCount?: number;
  };
}

export interface ClassroomAlert {
  id: string;
  studentId: string;
  studentName?: string;
  eventType: string;
  currentFile?: string;
  timestamp: string;
}

export function useClassroomActivity(classroomId: string) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Record<string, StudentActivity>>({});
  const [recentAlerts, setRecentAlerts] = useState<ClassroomAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        setLoading(true);
        const data = await api.get(`/activity/classroom/${classroomId}`);
        
        if (!isMounted) return;
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
        if (isMounted) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [classroomId]);

  // Socket.IO real-time updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || user?.role !== 'teacher') return;

    const socket = socketService.connect(token);
    if (!socket) return;
    
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

    // Listen for restricted action alerts (copy/paste attempts)
    const handleRestrictedActionAlert = (data: {
      studentId: string;
      studentName?: string;
      eventType: string;
      fileContext?: string;
      currentFile?: string;
      attemptCount?: number;
      timestamp?: string;
    }) => {
      // Use studentName from server payload directly — avoids stale closure issue
      const studentName = data.studentName || 'Student';
      const currentFile = data.fileContext || data.currentFile;

      setActivities(prev => {
        const existing = prev[data.studentId] || {
          studentId: data.studentId,
          displayName: studentName,
          email: '',
          language: null,
          status: 'coding',
          currentFile: currentFile || null,
          errors: null,
          timestamp: new Date().toISOString()
        };

        return {
          ...prev,
          [data.studentId]: {
            ...existing,
            lastRestrictedAction: {
              eventType: data.eventType,
              timestamp: data.timestamp || new Date().toISOString(),
              currentFile: currentFile,
              attemptCount: data.attemptCount || 1
            }
          }
        };
      });

      // Add to recent alerts feed — studentName from server payload, not from state
      const newAlert: ClassroomAlert = {
        id: Math.random().toString(36).substring(2, 9),
        studentId: data.studentId,
        studentName,
        eventType: data.eventType,
        currentFile,
        timestamp: data.timestamp || new Date().toISOString()
      };

      setRecentAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
    };

    socket.on('student:status-change', handleStatusChange);
    socket.on('classroom:activity-update', handleActivityUpdate);
    socket.on('classroom:restricted-action-alert', handleRestrictedActionAlert);

    return () => {
      socket.emit('classroom:leave', { classroomId });
      socket.off('student:status-change', handleStatusChange);
      socket.off('classroom:activity-update', handleActivityUpdate);
      socket.off('classroom:restricted-action-alert', handleRestrictedActionAlert);
    };
  }, [classroomId, user]);

  return { activities: Object.values(activities), recentAlerts, loading };
}
