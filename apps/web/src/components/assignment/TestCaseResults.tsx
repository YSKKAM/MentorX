"use client";

import React from "react";

export interface TestCaseResultItem {
  id: string;
  testCaseNumber: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden?: boolean;
}

interface TestCaseResultsProps {
  results: TestCaseResultItem[];
  isRunning: boolean;
}

export default function TestCaseResults({ results, isRunning }: TestCaseResultsProps) {
  if (isRunning) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0d0e15] p-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mb-3" />
        <p className="text-sm font-bold text-slate-300">Compiling & Executing Test Cases...</p>
        <p className="text-xs text-slate-500 mt-1">Checking stdout against expected outputs</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0d0e15] p-6 text-center">
        <span className="text-3xl mb-2">🧪</span>
        <p className="text-sm font-bold text-slate-300">No Execution Results Yet</p>
        <p className="text-xs text-slate-500 mt-1">Click "Run Test Cases" to test your solution</p>
      </div>
    );
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const passPercentage = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0d0e15] p-4 shadow-xl">
      {/* Header Summary */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-100 text-sm">Test Case Results</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
              passPercentage === 100
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            {passedCount} / {totalCount} Passed ({passPercentage}%)
          </span>
        </div>
      </div>

      {/* Individual Test Cases List */}
      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
        {results.map((item) => (
          <div
            key={item.id || item.testCaseNumber}
            className={`rounded-xl border p-3 font-mono text-xs transition-all ${
              item.passed
                ? "border-emerald-500/30 bg-emerald-950/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-950/10 text-rose-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">
                {item.passed ? "✅" : "❌"} Test Case #{item.testCaseNumber} {item.isHidden ? "(Hidden)" : ""}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  item.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {item.passed ? "PASSED" : "FAILED"}
              </span>
            </div>

            {!item.isHidden ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Input (STDIN):</span>
                  <div className="bg-[#06070a] p-1.5 rounded mt-0.5 whitespace-pre-wrap">{item.input || "(empty)"}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Expected Output:</span>
                  <div className="bg-[#06070a] p-1.5 rounded mt-0.5 whitespace-pre-wrap">{item.expectedOutput || "(empty)"}</div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Actual Output:</span>
                  <div
                    className={`p-1.5 rounded mt-0.5 whitespace-pre-wrap ${
                      item.passed ? "bg-[#06070a] text-emerald-300" : "bg-rose-900/20 text-rose-300"
                    }`}
                  >
                    {item.actualOutput || "(empty)"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic mt-1">Hidden test case inputs and outputs are masked.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
