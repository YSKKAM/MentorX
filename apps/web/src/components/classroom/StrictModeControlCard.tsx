'use client';

const features = [
  { icon: '📋', label: 'Block Paste', desc: 'Ctrl+V restriction in editor' },
  { icon: '📄', label: 'Block Copy', desc: 'Ctrl+C restriction in editor' },
  { icon: '✂️', label: 'Block Cut', desc: 'Ctrl+X restriction in editor' },
  { icon: '📊', label: 'Event Logging', desc: 'Full activity audit trail' },
];

// Hazard stripe SVG background (yellow + black diagonal stripes)
const hazardStripe = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23FFE100'/%3E%3Cpath d='M-10 50L50-10M-10 30L30-10M10 50L50 10' stroke='%23000' stroke-width='12'/%3E%3C/svg%3E")`;

export default function StrictModeControlCard() {
  return (
    <div className="rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white dark:bg-[#FDFBF7]">

      {/* ── TOP hazard tape banner ── */}
      <div
        className="w-full h-10 flex items-center overflow-hidden border-b-4 border-black relative"
        style={{ background: hazardStripe, backgroundSize: '40px 40px' }}
      >
        {/* Repeating UNDER CONSTRUCTION text on tape */}
        <div className="flex items-center gap-0 whitespace-nowrap animate-[marquee_12s_linear_infinite] absolute">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="text-black font-black text-xs uppercase tracking-[0.25em] px-6 py-1"
              style={{ textShadow: '0 0 0 transparent', WebkitTextStroke: '0.5px black' }}
            >
              ⚠️ UNDER CONSTRUCTION &nbsp;•&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-6 bg-white dark:bg-[#FDFBF7]">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center text-2xl flex-shrink-0 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              🛡️
            </div>
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight leading-tight">
                MentorX Strict Mode
              </h3>
              <p className="text-xs font-bold text-gray-600 mt-0.5">
                Copy / Paste Enforcement Engine
              </p>
            </div>
          </div>

          {/* IN DEV badge — neo brutal */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFE100] border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black text-xs font-black uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-black animate-pulse inline-block" />
            In Dev
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-2xl bg-gray-100 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-4 py-3 opacity-60"
            >
              <span className="text-lg grayscale">{f.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-black truncate">{f.label}</div>
                <div className="text-[10px] text-gray-500 font-medium truncate">{f.desc}</div>
              </div>
              {/* Lock icon */}
              <svg className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a5 5 0 0 0-5 5v2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v2H9V6a3 3 0 0 1 3-3zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
              </svg>
            </div>
          ))}
        </div>

        {/* Progress bar — neo brutal */}
        <div className="rounded-2xl bg-gray-100 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-black uppercase tracking-wider">Development Progress</span>
            <span className="text-xs font-black text-black bg-[#FFE100] px-2 py-0.5 rounded-lg border-2 border-black">68%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-white border-2 border-black overflow-hidden">
            <div
              className="h-full rounded-full bg-black"
              style={{ width: '68%' }}
            />
          </div>
          <p className="text-[11px] text-gray-500 font-bold mt-2">
            Backend &amp; extension layer complete · Dashboard UI coming soon
          </p>
        </div>
      </div>

      {/* ── BOTTOM hazard tape banner ── */}
      <div
        className="w-full h-10 flex items-center overflow-hidden border-t-4 border-black relative"
        style={{ background: hazardStripe, backgroundSize: '40px 40px' }}
      >
        <div className="flex items-center gap-0 whitespace-nowrap animate-[marquee_12s_linear_infinite_reverse] absolute">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="text-black font-black text-xs uppercase tracking-[0.25em] px-6 py-1"
            >
              🔒 LOCKED &nbsp;•&nbsp; COMING SOON &nbsp;•&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Marquee keyframe injection */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
