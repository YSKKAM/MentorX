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
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Load theme setting from localStorage or default to light theme
    const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
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
    { name: 'Jarvis Chat', href: '/dashboard/chat', icon: '💬' },
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
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform flex-col p-5 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isLight 
          ? 'bg-white/70 backdrop-blur-2xl border-r border-slate-900/10 shadow-[0_10px_30px_-5px_rgba(79,70,229,0.08)]' 
          : 'bg-[#12121a]/80 backdrop-blur-xl border-r border-white/10 shadow-2xl'
      } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-start pt-2 px-2 gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-rose-500 p-0.5 shadow-lg flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center text-lg font-bold text-white">
              🤖
            </div>
          </div>
          <div>
            <Link href="/">
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 bg-clip-text text-xl font-extrabold text-transparent tracking-tight block">
                Jarvis AI
              </span>
            </Link>
            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block -mt-1">
              Classroom Platform
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
            Menu
          </div>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive 
                    ? isLight 
                      ? 'bg-indigo-600/10 text-indigo-600 shadow-sm' 
                      : 'bg-indigo-500/15 text-indigo-400 shadow-inner'
                    : isLight
                      ? 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                {isActive && <div className="active-pill-indicator" />}
                <span className="text-base">{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
          
          <div className="mt-8 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
            Jarvis Suite
          </div>
          {commonLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`relative flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                pathname === link.href
                  ? isLight
                    ? 'bg-violet-600/10 text-violet-600'
                    : 'bg-purple-500/15 text-purple-400'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{link.icon}</span>
                {link.name}
              </div>
              {link.href === '#' && (
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-500">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-900/10 dark:border-white/10">
          <div className={`p-3 rounded-xl flex items-center justify-between ${
            isLight ? 'bg-slate-900/5' : 'bg-white/5'
          }`}>
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Jarvis Status</span>
            <span className="spark-chip">Online ✨</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className={`z-10 flex h-16 items-center justify-between border-b px-4 sm:px-6 transition-colors duration-300 ${
          isLight 
            ? 'bg-white/70 backdrop-blur-2xl border-slate-900/10' 
            : 'bg-[#12121a]/80 backdrop-blur-xl border-white/10'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="mr-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
              <span>{user?.role === 'teacher' ? '👨‍🏫' : '🎓'}</span> {user?.role} Workspace
            </h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isLight 
                  ? 'bg-slate-900/5 border-slate-900/10 text-slate-700 hover:bg-slate-900/10' 
                  : 'bg-white/10 border-white/10 text-gray-200 hover:bg-white/15'
              }`}
              title="Toggle Light/Dark Theme"
            >
              <span>{isLight ? '☀️ Light' : '🌙 Dark'}</span>
            </button>

            <div className="hidden sm:block text-sm text-slate-600 dark:text-gray-300">
              Welcome, <span className="font-bold text-slate-900 dark:text-white">{user?.displayName}</span>
            </div>
            
            <Button variant="ghost" size="sm" onClick={logout} className="rounded-xl">
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
