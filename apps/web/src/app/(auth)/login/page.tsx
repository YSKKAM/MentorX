"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import Input from "../../../components/ui/Input";
import MagneticButton from "../../../components/ui/MagneticButton";

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
    <div className="bg-white dark:bg-[#141422] rounded-3xl p-8 sm:p-10 border-4 border-slate-950 dark:border-white shadow-[10px_10px_0px_0px_#0f172a] dark:shadow-[10px_10px_0px_0px_#818cf8] relative overflow-hidden transition-all">
      {/* Top Neo Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 border-b-2 border-slate-950" />

      <div className="text-center mb-8 space-y-2 pt-2">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-rose-500 border-2 border-slate-950 shadow-[3px_3px_0px_0px_#0f172a] flex items-center justify-center mb-4 text-white text-3xl">
          🎓
        </div>

        <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="text-slate-700 dark:text-gray-300 text-xs sm:text-sm font-extrabold">
          Sign in to access your MentorX Platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-red-500/15 border-2 border-slate-950 rounded-xl text-red-700 dark:text-red-300 text-xs font-black shadow-[2px_2px_0px_0px_#0f172a]">
            ⚠️ {error}
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

        <MagneticButton
          type="submit"
          className="w-full mt-3 py-3.5 text-sm font-black rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-3 border-slate-950 shadow-[4px_4px_0px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#0f172a]"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In to MentorX →"}
        </MagneticButton>
      </form>

      <div className="mt-8 text-center text-xs font-bold text-slate-700 dark:text-gray-300">
        Don't have an account yet?{" "}
        <Link href="/register" className="text-indigo-700 dark:text-indigo-400 hover:underline font-black">
          Create account now
        </Link>
      </div>
    </div>
  );
}
