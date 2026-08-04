"use client";

import React, { useState } from "react";
import Button from "../ui/Button";

export interface PlagiarismPairResult {
  studentA: { id: string; name: string; submissionId: string; code: string };
  studentB: { id: string; name: string; submissionId: string; code: string };
  similarity: number;
  level: "HIGH" | "MEDIUM" | "CLEAN";
  matchedLinesA: number[];
  matchedLinesB: number[];
}

interface PlagiarismReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: PlagiarismPairResult[];
  isLoading: boolean;
}

export default function PlagiarismReportModal({
  isOpen,
  onClose,
  results,
  isLoading,
}: PlagiarismReportModalProps) {
  const [selectedPair, setSelectedPair] = useState<PlagiarismPairResult | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative flex flex-col h-[85vh] w-full max-w-5xl rounded-3xl border border-slate-800 bg-[#0d0e15] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#12131f] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xl">
              🛡️
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-100 tracking-tight">
                AST Structural Plagiarism Report
              </h3>
              <p className="text-xs text-slate-400">
                Identifies copy-pasted code & structural similarities across student submissions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-rose-500 border-t-transparent mb-3" />
              <p className="text-sm font-bold text-slate-300">
                Running AST Tokenizer & Structural Similarity Scanner...
              </p>
              <p className="text-xs text-slate-500 mt-1">Comparing all submission n-gram fingerprints</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-8">
              <span className="text-4xl mb-2">✅</span>
              <h4 className="text-base font-black text-emerald-400">No High Plagiarism Matches Detected</h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                All submitted student solutions exhibit unique structural AST fingerprint signatures.
              </p>
            </div>
          ) : !selectedPair ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
                <span>Flagged Submission Pairs ({results.length})</span>
                <span>Structural Match Score</span>
              </div>

              <div className="space-y-3">
                {results.map((pair, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#12131f] p-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-3 w-3 rounded-full ${
                          pair.level === "HIGH" ? "bg-rose-500" : "bg-amber-500"
                        }`}
                      />
                      <div>
                        <div className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                          <span>{pair.studentA.name}</span>
                          <span className="text-slate-500 text-xs font-normal">↔</span>
                          <span>{pair.studentB.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {pair.level === "HIGH" ? "🔴 High Similarity - Likely Copy-Pasted" : "🟡 Medium Similarity"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full font-mono text-xs font-black ${
                          pair.level === "HIGH"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        }`}
                      >
                        {pair.similarity}% Match
                      </span>
                      <Button variant="secondary" onClick={() => setSelectedPair(pair)}>
                        Compare Side-by-Side 🔍
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Side-by-Side Diff Viewer */
            <div className="flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button
                  onClick={() => setSelectedPair(null)}
                  className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1"
                >
                  ← Back to Pair List
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">Similarity Score:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                    {selectedPair.similarity}% Match
                  </span>
                </div>
              </div>

              {/* Side by side code view */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden font-mono text-xs">
                {/* Student A Code */}
                <div className="flex flex-col rounded-xl border border-slate-800 bg-[#08090f] overflow-hidden">
                  <div className="bg-[#12131f] px-3 py-2 border-b border-slate-800 font-bold text-slate-300">
                    👤 {selectedPair.studentA.name}'s Submission
                  </div>
                  <CodeViewer code={selectedPair.studentA.code} matchedLines={selectedPair.matchedLinesA} />
                </div>

                {/* Student B Code */}
                <div className="flex flex-col rounded-xl border border-slate-800 bg-[#08090f] overflow-hidden">
                  <div className="bg-[#12131f] px-3 py-2 border-b border-slate-800 font-bold text-slate-300">
                    👤 {selectedPair.studentB.name}'s Submission
                  </div>
                  <CodeViewer code={selectedPair.studentB.code} matchedLines={selectedPair.matchedLinesB} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CodeViewer({ code, matchedLines }: { code: string; matchedLines: number[] }) {
  const lines = (code || "").split("\n");
  const matchedSet = new Set(matchedLines);

  return (
    <div className="overflow-y-auto flex-1 font-mono text-xs p-3 leading-5 select-text bg-[#08090f] text-slate-200">
      {lines.map((line, idx) => {
        const lineNum = idx + 1;
        const isMatched = matchedSet.has(lineNum);
        return (
          <div
            key={lineNum}
            className={`flex items-start ${
              isMatched
                ? "bg-rose-500/20 text-rose-200 border-l-2 border-rose-500 -ml-1 pl-1"
                : ""
            }`}
          >
            <span className="w-8 shrink-0 text-slate-600 text-right pr-2 select-none border-r border-slate-800 mr-2">
              {lineNum}
            </span>
            <span className="whitespace-pre-wrap break-all">{line || " "}</span>
          </div>
        );
      })}
    </div>
  );
}
