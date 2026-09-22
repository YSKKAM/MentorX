'use client';

// ─────────────────────────────────────────────────────────────────────────────
// StrictModeControlCard — COMING SOON
// The copy/paste monitoring feature is under development.
// The card is rendered but fully blocked with a "Coming Soon" overlay stamp.
// ─────────────────────────────────────────────────────────────────────────────

export default function StrictModeControlCard() {
  return (
    <div className="relative rounded-3xl border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)] overflow-hidden select-none">

      {/* ── Ghost preview of the card (blurred + dimmed) ── */}
      <div className="p-6 bg-[#FDFBF7] dark:bg-[#181824] blur-[3px] opacity-40 pointer-events-none" aria-hidden>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black dark:border-white pb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <h3 className="text-2xl font-black text-slate-950 dark:text-white uppercase tracking-tight">
              MentorX Strict Mode
            </h3>
            <span className="px-3.5 py-1 rounded-xl text-xs font-black border-2 border-black bg-[#FF6666] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              OFF
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white">
              Strict Mode Disabled
            </span>
            <div className="relative inline-flex h-8 w-16 rounded-full border-3 border-black bg-slate-300 dark:bg-gray-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="inline-block h-6 w-6 rounded-full bg-[#FFDE59] border-2 border-black mt-0.5 translate-x-1" />
            </div>
          </div>
        </div>

        {/* Fake checkbox grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['Block Paste (Ctrl+V)', 'Block Copy (Ctrl+C)', 'Block Cut (Ctrl+X)', 'Record Restricted Events'].map(label => (
            <div key={label} className="flex items-start gap-3 p-4 rounded-2xl border-3 border-black bg-gray-100 dark:bg-gray-800/60 opacity-60">
              <div className="mt-1 h-5 w-5 rounded-md border-2 border-black bg-white" />
              <div className="text-sm font-black text-slate-950 dark:text-white">{label}</div>
            </div>
          ))}
        </div>

        {/* Fake disclaimer */}
        <div className="mt-6 rounded-2xl bg-[#FFE566] border-3 border-black p-4 text-xs font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="font-black text-sm uppercase mb-1">Technical Enforcement Disclaimer</div>
          MentorX Strict Mode restricts copy/paste operations within the VS Code environment.
        </div>
      </div>

      {/* ── Coming Soon Overlay ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] z-10">

        {/* Rotated stamp */}
        <div className="-rotate-12 flex flex-col items-center gap-3">
          <div className="rounded-2xl border-[5px] border-[#FFE566] px-8 py-5 shadow-[6px_6px_0px_0px_rgba(255,229,102,0.6)] bg-black/80">
            <div className="text-[#FFE566] font-black text-4xl sm:text-5xl uppercase tracking-[0.15em] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              Coming Soon
            </div>
            <div className="text-center text-[#FFE566]/70 font-bold text-xs sm:text-sm uppercase tracking-widest mt-1">
              Copy / Paste Monitoring
            </div>
          </div>

          {/* Subtle sub-label */}
          <p className="rotate-0 text-center text-white/70 text-xs font-bold max-w-[220px] leading-relaxed">
            This feature is under development and will be available in a future release.
          </p>
        </div>

      </div>
    </div>
  );
}
