"use client";

import React, { useState } from "react";
import { api } from "../../lib/api";

interface HintPanelProps {
  assignmentId: string;
  maxLevel?: number;
}

export default function HintPanel({ assignmentId, maxLevel = 3 }: HintPanelProps) {
  const [revealedHints, setRevealedHints] = useState<Record<number, string>>({});
  const [loadingLevel, setLoadingLevel] = useState<number | null>(null);

  const fetchHint = async (level: number) => {
    if (revealedHints[level]) return;

    setLoadingLevel(level);
    try {
      const res = await api.post(`/assignments/${assignmentId}/hint`, { level });
      if (res.hint) {
        setRevealedHints((prev) => ({ ...prev, [level]: res.hint }));
      }
    } catch (err: any) {
      console.error("Failed to fetch hint:", err);
    } finally {
      setLoadingLevel(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0d0e15] p-4 shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
        <span className="text-lg">💡</span>
        <h4 className="font-black text-slate-100 text-sm">Pedagogical Hints</h4>
        <span className="text-xs text-slate-500 ml-auto">Progressive Help System</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {[1, 2, 3].map((level) => {
          const isRevealed = !!revealedHints[level];
          const isLoading = loadingLevel === level;

          return (
            <div key={level} className="rounded-xl border border-slate-800 bg-[#12131f] p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">
                  Level {level} Hint {level === 1 ? "(Concept)" : level === 2 ? "(Logic)" : "(Detail)"}
                </span>

                {!isRevealed && (
                  <button
                    onClick={() => fetchHint(level)}
                    disabled={isLoading}
                    className="rounded-lg bg-indigo-600/20 px-3 py-1 text-[11px] font-bold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Revealing..." : "Reveal Hint 💡"}
                  </button>
                )}
              </div>

              {isRevealed && (
                <p className="mt-2 text-slate-300 bg-[#07080d] p-2.5 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                  {revealedHints[level]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
