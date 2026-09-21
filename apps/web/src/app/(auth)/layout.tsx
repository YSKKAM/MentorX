export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 animate-bold-gradient p-4">
      {/* Neo Decorative Grid Background */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      
      {/* Decorative Neo Stickers in Background */}
      <div className="absolute top-8 left-8 hidden md:flex items-center gap-2 px-4 py-1.5 bg-[#CCFF00] text-slate-950 font-black text-xs border-2 border-slate-950 shadow-[4px_4px_0px_0px_#0f172a] rotate-[-3deg]">
        <span>⚡</span> MENTORX PLATFORM
      </div>
      
      <div className="absolute bottom-8 right-8 hidden md:flex items-center gap-2 px-4 py-1.5 bg-[#FF0055] text-white font-black text-xs border-2 border-slate-950 shadow-[4px_4px_0px_0px_#0f172a] rotate-[3deg]">
        <span>🚀</span> REAL-TIME LABS
      </div>

      <div className="w-full max-w-md z-10 animate-fade-in">
        {children}
      </div>
    </div>
  );
}
