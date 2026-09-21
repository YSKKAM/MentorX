"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import Input from "../../../components/ui/Input";
import MagneticButton from "../../../components/ui/MagneticButton";
import { UserRole } from "../../../types";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      await register({ displayName, email, password, role });
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
    }
  };

  return (
    <div className="bg-white dark:bg-[#141422] rounded-3xl p-8 sm:p-10 border-4 border-slate-950 dark:border-white shadow-[10px_10px_0px_0px_#0f172a] dark:shadow-[10px_10px_0px_0px_#818cf8] relative overflow-hidden transition-all">
      {/* Top Neo Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 border-b-2 border-slate-950" />

      <div className="text-center mb-6 space-y-2 pt-2">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-rose-500 border-2 border-slate-950 shadow-[3px_3px_0px_0px_#0f172a] flex items-center justify-center mb-3 text-white text-3xl">
          🚀
        </div>

        <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          Create Account
        </h2>
        <p className="text-slate-700 dark:text-gray-300 text-xs sm:text-sm font-extrabold">
          Join the MentorX Platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-500/15 border-2 border-slate-950 rounded-xl text-red-700 dark:text-red-300 text-xs font-black shadow-[2px_2px_0px_0px_#0f172a]">
            ⚠️ {error}
          </div>
        )}

        {/* Role Selector Neo Pills */}
        <div className="flex bg-slate-100 dark:bg-white/10 p-1.5 rounded-2xl border-2 border-slate-950 dark:border-white shadow-[3px_3px_0px_0px_#0f172a] mb-4 gap-1.5">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex-1 py-2 text-xs font-black rounded-xl border-2 transition-all ${
              role === "student"
                ? "bg-indigo-600 text-white border-slate-950 shadow-[2px_2px_0px_0px_#0f172a]"
                : "bg-transparent border-transparent text-slate-800 dark:text-gray-300 hover:text-slate-950"
            }`}
          >
            🎓 Student
          </button>
          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={`flex-1 py-2 text-xs font-black rounded-xl border-2 transition-all ${
              role === "teacher"
                ? "bg-violet-600 text-white border-slate-950 shadow-[2px_2px_0px_0px_#0f172a]"
                : "bg-transparent border-transparent text-slate-800 dark:text-gray-300 hover:text-slate-950"
            }`}
          >
            👨‍🏫 Teacher
          </button>
        </div>

        <Input
          label="Full Name"
          type="text"
          placeholder="Alex Rivera"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

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
          {loading ? "Registering..." : `Register as ${role === "teacher" ? "Teacher" : "Student"} →`}
        </MagneticButton>
      </form>

      <div className="mt-6 text-center text-xs font-bold text-slate-700 dark:text-gray-300">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-700 dark:text-indigo-400 hover:underline font-black">
          Sign in
        </Link>
      </div>
    </div>
  );
}
