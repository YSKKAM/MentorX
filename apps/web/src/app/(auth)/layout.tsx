export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0f]">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] bg-emerald-600/20 rounded-full blur-[100px] mix-blend-screen" />
      
      <div className="w-full max-w-md px-6 py-12 z-10 animate-fade-in">
        {children}
      </div>
    </div>
  );
}
