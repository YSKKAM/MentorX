'use client';

export default function StrictModeControlCard() {
  const features = [
    { icon: '📋', label: 'Block Paste', desc: 'Ctrl+V restriction in editor' },
    { icon: '📄', label: 'Block Copy', desc: 'Ctrl+C restriction in editor' },
    { icon: '✂️', label: 'Block Cut', desc: 'Ctrl+X restriction in editor' },
    { icon: '📊', label: 'Event Logging', desc: 'Full activity audit trail' },
  ];

  return (
    <div className="relative rounded-3xl border-4 border-black dark:border-white overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)]">

      {/* Background gradient */}
      <div className="bg-gradient-to-br from-[#0f0f1a] via-[#15152b] to-[#1a1030] p-6 sm:p-8">

        {/* Top row — title + badge */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#5800FF]/20 border-2 border-[#5800FF]/40 flex items-center justify-center text-2xl flex-shrink-0">
              🛡️
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                MentorX Strict Mode
              </h3>
              <p className="text-xs font-bold text-gray-400 mt-0.5">
                Copy / Paste Enforcement Engine
              </p>
            </div>
          </div>

          {/* In Development pill */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5800FF]/20 border-2 border-[#5800FF]/50 text-[#a78bfa] text-xs font-black uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa] animate-pulse inline-block" />
            In Dev
          </div>
        </div>

        {/* Feature grid — locked icons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 opacity-60"
            >
              <span className="text-lg grayscale">{f.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate">{f.label}</div>
                <div className="text-[10px] text-gray-500 font-medium truncate">{f.desc}</div>
              </div>
              {/* Lock */}
              <svg className="h-3.5 w-3.5 text-gray-600 flex-shrink-0 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a5 5 0 0 0-5 5v2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v2H9V6a3 3 0 0 1 3-3zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
              </svg>
            </div>
          ))}
        </div>

        {/* Progress bar section */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-gray-300 uppercase tracking-wider">Development Progress</span>
            <span className="text-xs font-black text-[#a78bfa]">68%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5800FF] to-[#a78bfa]"
              style={{ width: '68%' }}
            />
          </div>
          <p className="text-[11px] text-gray-500 font-medium mt-2">
            Backend &amp; extension layer complete · Dashboard UI coming soon
          </p>
        </div>

      </div>
    </div>
  );
}
