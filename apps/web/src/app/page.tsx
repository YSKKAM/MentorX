"use client";

import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Button from "../components/ui/Button";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "teacher") {
        router.push("/dashboard/teacher");
      } else {
        router.push("/dashboard/student");
      }
    }
  }, [isAuthenticated, user, loading, router]);

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center light-mesh-bg">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen relative overflow-hidden light-mesh-bg p-6">
      {/* Lumina Background Ambient Light Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 dark:bg-blue-500/20 rounded-full blur-[140px] -z-10 mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/15 dark:bg-purple-500/20 rounded-full blur-[140px] -z-10 mix-blend-multiply dark:mix-blend-screen" />
      
      <div className="max-w-4xl mx-auto text-center z-10 animate-slide-up space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/15 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-indigo-700 dark:bg-indigo-400 animate-pulse" />
          <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-400">Welcome to AI Classroom</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-950 dark:text-white">
          Experience <br className="hidden sm:block" />
          <span className="text-gradient-lumina">Next-Gen AI Classroom Intelligence</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-slate-800 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-bold">
          Empowering teachers with real-time student activity tracking and providing students with intelligent AI coding assistance.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto font-extrabold rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 text-white shadow-xl shadow-indigo-500/25 group px-8 py-4 text-base">
              Get Started
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button variant="ghost" size="lg" className="w-full sm:w-auto font-extrabold rounded-xl border border-slate-900/15 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white text-slate-900 dark:text-white px-8 py-4 text-base backdrop-blur-md">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
