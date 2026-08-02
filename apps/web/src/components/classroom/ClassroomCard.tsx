'use client';

import Link from 'next/link';
import { Classroom } from '../../types';

interface ClassroomCardProps {
  classroom: Classroom;
  isTeacherView?: boolean;
  onDelete?: (id: string) => void;
}

export default function ClassroomCard({ classroom, isTeacherView = false, onDelete }: ClassroomCardProps) {
  return (
    <Link href={`/classroom/${classroom.id}`}>
      <div className="glass-card group flex h-full flex-col p-6 transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] bg-[#12121a]/80 backdrop-blur-xl border border-white/10 rounded-2xl cursor-pointer">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center">
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{classroom.name}</h3>
            <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-blue-300 border border-blue-500/20 whitespace-nowrap ml-4">
              {classroom.studentCount || 0} {(classroom.studentCount === 1) ? 'Student' : 'Students'}
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
              className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
              title="Delete Classroom"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        {classroom.description && (
          <p className="mb-6 flex-grow text-sm text-gray-400 line-clamp-3">
            {classroom.description}
          </p>
        )}
        
        <div className="mt-auto border-t border-white/10 pt-4 flex items-center justify-between">
          {isTeacherView ? (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Join Code</span>
              <span className="font-mono text-sm font-semibold tracking-wider text-emerald-400">{classroom.joinCode}</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Teacher</span>
              <span className="text-sm font-medium text-gray-300">{classroom.teacherName || 'Unknown'}</span>
            </div>
          )}
          
          <div className="flex flex-col text-right">
            <span className="text-xs text-gray-500">Created</span>
            <span className="text-xs text-gray-400">{new Date(classroom.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
