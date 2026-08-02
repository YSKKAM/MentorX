export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden light-mesh-bg transition-colors duration-300">
      {/* Lumina Background Ambient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-500/15 dark:bg-blue-600/30 rounded-full blur-[140px] mix-blend-multiply dark:mix-blend-screen animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-violet-500/15 dark:bg-purple-600/30 rounded-full blur-[140px] mix-blend-multiply dark:mix-blend-screen" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[35%] left-[55%] w-[25%] h-[25%] bg-rose-500/10 dark:bg-emerald-600/20 rounded-full blur-[110px] mix-blend-multiply dark:mix-blend-screen" />
      
      <div className="w-full max-w-md px-6 py-12 z-10 animate-fade-in">
        {children}
      </div>
    </div>
  );
}
