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
      <InteractiveCard className="group flex h-full flex-col p-6 rounded-3xl cursor-pointer relative overflow-hidden bg-white dark:bg-[#181826] border-3 border-slate-950 dark:border-white shadow-[7px_7px_0px_0px_#0f172a] dark:shadow-[7px_7px_0px_0px_#818cf8] hover:shadow-[10px_10px_0px_0px_#0f172a] dark:hover:shadow-[10px_10px_0px_0px_#818cf8] transition-all">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
              {classroom.name}
            </h3>
            <span className="inline-flex items-center w-fit rounded-xl bg-[#FFE600] text-slate-950 px-3 py-1 text-xs font-black border-2 border-slate-950 shadow-[2px_2px_0px_0px_#0f172a] rotate-[-0.5deg]">
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
              className="bg-[#FF0055] text-white hover:bg-red-600 p-2 rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_#0f172a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#0f172a] transition-all shrink-0"
              title="Delete Classroom"
            >
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        {classroom.description ? (
          <p className="mb-6 flex-grow text-sm font-extrabold text-slate-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
            {classroom.description}
          </p>
        ) : (
          <p className="mb-6 flex-grow text-sm font-bold text-slate-400 dark:text-gray-500 italic">
            No description provided.
          </p>
        )}
        
        <div className="mt-auto border-t-2 border-slate-950/20 dark:border-white/20 pt-4 flex items-center justify-between gap-2">
          {isTeacherView ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider">Join Code</span>
              <span className="inline-block px-3 py-1 rounded-xl bg-slate-950 text-[#CCFF00] dark:bg-white dark:text-slate-950 border-2 border-slate-950 font-mono font-black text-sm tracking-widest shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#818cf8]">
                {classroom.joinCode}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider">Instructor</span>
              <span className="text-sm font-black text-slate-950 dark:text-white">{classroom.teacherName || 'Unknown'}</span>
            </div>
          )}
          
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider">Created</span>
            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/25 border-2 border-slate-950 dark:border-white text-xs font-black text-slate-950 dark:text-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#818cf8]">
              {new Date(classroom.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </InteractiveCard>
    </Link>
  );
}
