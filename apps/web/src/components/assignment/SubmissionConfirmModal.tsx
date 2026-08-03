"use client";

import React from "react";
import Button from "../ui/Button";

interface SubmissionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  scoreResult?: {
    score: number;
    status: string;
    results: any[];
  } | null;
}

export default function SubmissionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  scoreResult,
}: SubmissionConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-[#11121c] p-6 shadow-2xl">
        {!scoreResult ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xl">
                🚀
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100">Submit Assignment</h3>
                <p className="text-xs text-slate-400">Final evaluation against all test cases</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-300 mb-6 leading-relaxed">
              Are you ready to submit your code? It will be evaluated against visible and hidden test cases to calculate your final grade.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={onConfirm} isLoading={isSubmitting}>
                Confirm Submission
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center py-2">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl mb-3 ${
                  scoreResult.status === "Passed"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                }`}
              >
                {scoreResult.status === "Passed" ? "🎉" : "📝"}
              </div>

              <h3 className="text-xl font-black text-slate-100">Submission Evaluation Complete</h3>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                Status: <span className="text-indigo-400">{scoreResult.status}</span>
              </p>

              <div className="my-4 rounded-2xl bg-[#08090f] p-4 border border-slate-800 w-full text-center">
                <span className="text-xs text-slate-500 font-bold uppercase block">Final Score Achieved</span>
                <span className="text-4xl font-black text-emerald-400 tracking-tight">{scoreResult.score} pts</span>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button variant="primary" onClick={onClose}>
                Return to Workspace
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
