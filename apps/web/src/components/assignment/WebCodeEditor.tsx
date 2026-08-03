"use client";

import React from "react";

interface WebCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
}

export default function WebCodeEditor({ value, onChange, language, readOnly = false }: WebCodeEditorProps) {
  const lineCount = Math.max(value.split("\n").length, 12);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="relative flex flex-col h-full min-h-[400px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0d0e15] shadow-2xl font-mono text-sm">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#13141f] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="ml-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            {language || "code"} workspace
          </span>
        </div>
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          {readOnly ? "READ ONLY" : "READY"}
        </div>
      </div>

      {/* Editor Body with Gutter */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Line Numbers */}
        <div className="flex flex-col select-none border-r border-slate-800/60 bg-[#0a0b10] py-3 text-right text-xs text-slate-600 w-12 shrink-0 pr-3">
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 resize-none bg-transparent p-3 text-slate-100 placeholder-slate-600 outline-none leading-6 font-mono text-sm selection:bg-indigo-500/30 overflow-y-auto"
          placeholder={`// Write your ${language} code here...`}
        />
      </div>
    </div>
  );
}
