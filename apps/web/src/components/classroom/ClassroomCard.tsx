'use client';

import Link from 'next/link';
import { Classroom } from '../../types';
import InteractiveCard from '../ui/InteractiveCard';

interface ClassroomCardProps {
  classroom: Classroom;
  isTeacherView?: boolean;
  onDelete?: (id: string) => void;
}

export default function ClassroomCard({ classroom, isTeacherView = false, onDelete }: ClassroomCardProps) {
  return (
    <Link href={`/classroom/${classroom.id}`}>
      <InteractiveCard className="glass-card-light dark:glass-card group flex h-full flex-col p-6 rounded-2xl cursor-pointer relative overflow-hidden border border-slate-900/10 dark:border-white/15 shadow-xl hover:border-indigo-500/50 hover:shadow-[0_15px_35px_rgba(79,70,229,0.18)]">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-rose-500 opacity-90" />
        
        <div className="mb-4 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {classroom.name}
            </h3>
            <span className="inline-flex items-center w-fit rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              👥 {classroom.studentCount || 0} {(classroom.studentCount === 1) ? 'Student' : 'Students'}
            </span>
          </div>
          
          {isTeacherView && onDelete && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this classroom? All student activity and chat logs will be permanently deleted.')) {
                  onDelete(classroom.id);
                }
              }}
              className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors"
              title="Delete Classroom"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        {classroom.description ? (
          <p className="mb-6 flex-grow text-sm font-semibold text-slate-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
            {classroom.description}
          </p>
        ) : (
          <p className="mb-6 flex-grow text-sm font-medium text-slate-400 dark:text-gray-500 italic">
            No description provided.
          </p>
        )}
        
        <div className="mt-auto border-t border-slate-200 dark:border-white/10 pt-4 flex items-center justify-between">
          {isTeacherView ? (
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider">Join Code</span>
              <span className="font-mono text-sm font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400">{classroom.joinCode}</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider">Instructor</span>
              <span className="text-sm font-bold text-slate-700 dark:text-gray-300">{classroom.teacherName || 'Unknown'}</span>
            </div>
          )}
          
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider">Created</span>
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400">{new Date(classroom.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </InteractiveCard>
    </Link>
  );
}
