'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedSidebarState = localStorage.getItem('sidebar_collapsed') === 'true';
    setIsSidebarCollapsed(savedSidebarState);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const toggleSidebarCollapse = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const navLinks = user?.role === 'teacher' 
    ? [
        { name: 'Dashboard', href: '/dashboard/teacher', icon: '⚡' },
        { name: 'My Classrooms', href: '/dashboard/teacher', icon: '🎓' }
      ]
    : [
        { name: 'Dashboard', href: '/dashboard/student', icon: '⚡' },
        { name: 'My Classes', href: '/dashboard/student', icon: '📚' }
      ];

  const commonLinks = [
    { name: 'MentorX Chat', href: '/dashboard/chat', icon: '💬' },
    { name: 'Settings', href: '#', icon: '⚙️' }
  ];

  const isLight = theme === 'light';

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      isLight ? 'light-mesh-bg text-slate-900' : 'bg-[#0a0a0f] text-white'
    }`}>
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Neo-Brutalist Collapsible Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 transform flex-col p-5 transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'w-0 -translate-x-full lg:w-0 lg:-translate-x-full hidden' : 'w-64 translate-x-0 lg:static lg:translate-x-0 flex'
      } ${
        isLight 
          ? 'bg-white border-r-3 border-slate-950 shadow-[4px_0px_0px_0px_#0f172a]' 
          : 'bg-[#141420] border-r-3 border-white shadow-[4px_0px_0px_0px_#818cf8]'
      } ${isSidebarOpen ? 'translate-x-0 !flex' : ''}`}>

        {/* Logo & Hide Sidebar Header */}
        <div className="mb-8 flex items-center justify-between pt-1 px-1">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-rose-500 border-2 border-slate-950 shadow-[3px_3px_0px_0px_#0f172a] flex items-center justify-center text-xl shrink-0 text-white">
              🎓
            </div>
            <div>
              <Link href="/">
                <span className="text-2xl font-black text-slate-950 dark:text-white tracking-tight block">
                  MentorX
                </span>
              </Link>
              <span className="text-[10px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase block -mt-1">
                Interactive Platform
              </span>
            </div>
          </div>

          {/* Hide Sidebar Button */}
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              toggleSidebarCollapse();
            }}
            className="p-1.5 rounded-xl border-2 border-slate-950 dark:border-white bg-slate-100 dark:bg-white/10 hover:bg-red-500 hover:text-white text-slate-950 dark:text-white shadow-[2px_2px_0px_0px_#0f172a] transition-all"
            title="Hide Sidebar"
          >
            <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-950 dark:text-gray-300 bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-lg border-2 border-slate-950 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] w-fit">
            Menu
          </div>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-2 border-slate-950 shadow-[3px_3px_0px_0px_#0f172a] scale-[1.02]' 
                    : isLight
                      ? 'text-slate-800 hover:bg-indigo-500/10 border-2 border-transparent hover:border-slate-950 hover:shadow-[2px_2px_0px_0px_#0f172a]'
                      : 'text-gray-300 hover:bg-white/10 border-2 border-transparent hover:border-white hover:shadow-[2px_2px_0px_0px_#818cf8]'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="text-base">{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
          
          <div className="mt-7 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-950 dark:text-gray-300 bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-lg border-2 border-slate-950 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] w-fit">
            MentorX Tools
          </div>
          {commonLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-2 border-slate-950 shadow-[3px_3px_0px_0px_#0f172a] scale-[1.02]'
                    : isLight
                      ? 'text-slate-800 hover:bg-indigo-500/10 border-2 border-transparent hover:border-slate-950 hover:shadow-[2px_2px_0px_0px_#0f172a]'
                      : 'text-gray-300 hover:bg-white/10 border-2 border-transparent hover:border-white hover:shadow-[2px_2px_0px_0px_#818cf8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{link.icon}</span>
                  {link.name}
                </div>
                {link.href === '#' && (
                  <span className="rounded-lg bg-[#FF0055] text-white border border-slate-950 text-[10px] font-black px-2 py-0.5 shadow-[1px_1px_0px_0px_#0f172a]">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Neo Status Sticker Box */}
        <div className="pt-4 border-t-2 border-slate-950/20 dark:border-white/20">
          <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-2 border-slate-950 dark:border-white font-black p-3.5 rounded-2xl shadow-[3px_3px_0px_0px_#0f172a] dark:shadow-[3px_3px_0px_0px_#818cf8] flex items-center justify-between">
            <span className="text-xs font-black">MentorX Assistant</span>
            <span className="bg-[#FF0055] text-white text-[10px] font-black px-2.5 py-0.5 rounded-xl border border-slate-950 shadow-[1px_1px_0px_0px_#0f172a]">
              Online ✨
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Neo-Brutalist Header */}
        <header className={`z-10 flex h-16 items-center justify-between border-b-3 px-4 sm:px-6 transition-colors duration-300 ${
          isLight 
            ? 'bg-white/95 border-slate-950 shadow-sm' 
            : 'bg-[#141420]/95 border-white shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            {/* Show / Toggle Sidebar Button */}
            <button
              onClick={() => {
                if (isSidebarCollapsed) {
                  setIsSidebarCollapsed(false);
                } else {
                  setIsSidebarOpen(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-slate-950 dark:border-white bg-indigo-600 text-white font-black text-xs shadow-[2px_2px_0px_0px_#0f172a] hover:bg-indigo-500 transition-all"
              title="Show / Toggle Sidebar"
            >
              <svg className="h-4 w-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {isSidebarCollapsed && <span className="hidden sm:inline">Show Sidebar</span>}
            </button>

            <h1 className="text-lg font-black text-slate-950 dark:text-white capitalize flex items-center gap-2">
              <span>{user?.role === 'teacher' ? '👨‍🏫' : '🎓'}</span> {user?.role} Workspace
            </h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 border-slate-950 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-black shadow-[2px_2px_0px_0px_#0f172a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#0f172a] transition-all"
              title="Toggle Light/Dark Theme"
            >
              <span>{isLight ? '☀️ Light' : '🌙 Dark'}</span>
            </button>

            <div className="hidden sm:block text-sm font-bold text-slate-800 dark:text-gray-300">
              Welcome, <span className="font-black text-slate-950 dark:text-white">{user?.displayName}</span>
            </div>
            
            <Button variant="ghost" size="sm" onClick={logout} className="rounded-xl font-black text-slate-950 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10">
              Sign out
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
