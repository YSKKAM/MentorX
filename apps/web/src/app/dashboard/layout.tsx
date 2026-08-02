'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const navLinks = user?.role === 'teacher' 
    ? [
        { name: 'Dashboard', href: '/dashboard/teacher' },
        { name: 'My Classrooms', href: '/dashboard/teacher' }
      ]
    : [
        { name: 'Dashboard', href: '/dashboard/student' },
        { name: 'My Classes', href: '/dashboard/student' }
      ];

  const commonLinks = [
    { name: 'Chat', href: '/dashboard/chat' },
    { name: 'Settings', href: '#' }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`glass-card fixed inset-y-0 left-0 z-30 w-64 transform flex-col border-r border-white/10 p-4 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 bg-[#12121a]/80 backdrop-blur-xl ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="mb-8 flex items-center justify-center pt-4">
          <Link href="/">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-2xl font-black text-transparent">
              AI Classroom
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 px-2">
            Menu
          </div>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-500/10 text-blue-400' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                {link.name}
              </Link>
            );
          })}
          
          <div className="mt-8 mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 px-2">
            Tools
          </div>
          {commonLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {link.name} 
              {link.href === '#' && <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-500">Soon</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="glass-card z-10 flex h-16 items-center justify-between border-b border-white/10 bg-[#12121a]/80 backdrop-blur-xl px-4 sm:px-6">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="mr-4 text-gray-400 lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-white capitalize">{user?.role} Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm text-gray-300">
              Welcome, <span className="font-semibold text-white">{user?.displayName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
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
