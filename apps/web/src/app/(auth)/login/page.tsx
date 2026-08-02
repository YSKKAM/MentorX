"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
    }
  };

  return (
    <div className="glass-card-light dark:glass-card rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-900/10 dark:border-white/10 animate-slide-up relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500" />

      <div className="text-center mb-8 space-y-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-rose-500 p-0.5 shadow-lg flex items-center justify-center mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl">
            🎓
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="text-slate-700 dark:text-gray-400 text-xs sm:text-sm font-bold">
          Sign in to access your AI Classroom Platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-xs font-bold">
            {error}
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          className="w-full mt-2 py-3.5 text-sm font-extrabold rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 hover:from-indigo-700 hover:to-rose-600 text-white shadow-lg shadow-indigo-500/25 transition-all"
          isLoading={loading}
        >
          Sign In to AI Classroom
        </Button>
      </form>

      <div className="mt-8 text-center text-xs font-bold text-slate-700 dark:text-gray-400">
        Don't have an account yet?{" "}
        <Link href="/register" className="text-indigo-700 dark:text-blue-400 hover:underline font-extrabold">
          Create account now
        </Link>
      </div>
    </div>
  );
}
