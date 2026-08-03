"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import { socketService } from "../../lib/socket";

interface ConfusionAlert {
  errorType: string;
  count: number;
  affectedStudents: { id: string; name: string }[];
  aiSuggestion: string;
}

interface ClassroomConfusionRadarProps {
  classroomId: string;
}

export default function ClassroomConfusionRadar({ classroomId }: ClassroomConfusionRadarProps) {
  const [alerts, setAlerts] = useState<ConfusionAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await api.get(`/activity/classroom/${classroomId}/confusion`);
      setAlerts(data || []);
    } catch (err: any) {
      console.error("Failed to fetch confusion alerts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchAlerts();

    const socket = socketService.getSocket();
    if (socket) {
      socket.on("classroom:activity-update", fetchAlerts);
      socket.on("confusion:update", fetchAlerts);
    }

    const interval = setInterval(fetchAlerts, 15000); // 15s refresh

    return () => {
      if (socket) {
        socket.off("classroom:activity-update", fetchAlerts);
        socket.off("confusion:update", fetchAlerts);
      }
      clearInterval(interval);
    };
  }, [classroomId, fetchAlerts]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0d0e15] p-5 animate-pulse">
        <div className="h-5 w-48 bg-slate-800 rounded mb-4"></div>
        <div className="h-20 bg-slate-900 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#0d0e15] p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <div>
            <h3 className="font-black text-slate-100 text-base tracking-tight">
              Classroom Confusion Radar
            </h3>
            <p className="text-[11px] font-bold text-slate-400">
              Real-time AI aggregation of student errors & stumbling blocks
            </p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Alerts Body */}
      {alerts.length === 0 ? (
        <div className="rounded-xl border border-slate-800/60 bg-[#08090e] p-6 text-center">
          <span className="text-2xl mb-1 block">✅</span>
          <p className="text-sm font-bold text-emerald-400">All Clear — No Active Error Clusters</p>
          <p className="text-xs text-slate-400 mt-1">
            Students are coding smoothly without major syntax or runtime stumbling blocks.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 shadow-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-rose-300 flex items-center gap-1.5">
                  <span>🚨</span> {alert.errorType}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {alert.count} {alert.count === 1 ? "Student" : "Students"} Affected
                </span>
              </div>

              {/* Affected Students List */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {alert.affectedStudents.map((st) => (
                  <span
                    key={st.id}
                    className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    👤 {st.name}
                  </span>
                ))}
              </div>

              {/* AI Teaching Suggestion */}
              <div className="mt-2 rounded-lg bg-[#07080d] p-3 border border-slate-800/80 text-xs text-slate-200">
                <span className="font-extrabold text-indigo-400 block mb-0.5">
                  💡 Teacher AI Intervention Suggestion:
                </span>
                <p className="leading-relaxed font-sans">{alert.aiSuggestion}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
