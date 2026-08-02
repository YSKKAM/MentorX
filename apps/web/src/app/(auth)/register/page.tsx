"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
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
    <div className="glass-card-light dark:glass-card rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-900/10 dark:border-white/10 animate-slide-up relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500" />

      <div className="text-center mb-6 space-y-2">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-rose-500 p-0.5 shadow-lg flex items-center justify-center mb-3">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl">
            🚀
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          Create Account
        </h2>
        <p className="text-slate-700 dark:text-gray-400 text-xs sm:text-sm font-bold">
          Join the AI Classroom Platform
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Role Selector Pill */}
        <div className="flex bg-slate-900/10 dark:bg-white/5 p-1 rounded-xl border border-slate-900/15 dark:border-white/10 mb-4">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
              role === "student"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-800 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            🎓 Student
          </button>
          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
              role === "teacher"
                ? "bg-violet-600 text-white shadow-md"
                : "text-slate-800 dark:text-gray-400 hover:text-slate-950 dark:hover:text-white"
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

        <Button
          type="submit"
          className="w-full mt-2 py-3.5 text-sm font-extrabold rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 hover:from-indigo-700 hover:to-rose-600 text-white shadow-lg shadow-indigo-500/25 transition-all"
          isLoading={loading}
        >
          Register as {role === "teacher" ? "Teacher" : "Student"}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs font-bold text-slate-700 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/register" className="text-indigo-700 dark:text-blue-400 hover:underline font-extrabold">
          Sign in
        </Link>
      </div>
    </div>
  );
}
