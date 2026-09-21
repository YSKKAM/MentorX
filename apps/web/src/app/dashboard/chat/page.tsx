"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";

export default function ChatLobbyPage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    setIsCreating(true);
    setError("");
    try {
      const response = await api.post("/chat-rooms", { name: roomName });
      if (response.status === "success" && response.data) {
        router.push(`/dashboard/chat/${response.data.id}`);
      } else {
        setError("Failed to create room.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create room.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    setError("");
    try {
      const response = await api.get(`/chat-rooms/join/${joinCode}`);
      if (response.status === "success" && response.data) {
        router.push(`/dashboard/chat/${response.data.id}`);
      } else {
        setError("Invalid join code or room not found.");
      }
    } catch (err: any) {
      setError("Invalid join code or room not found.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-900/10 dark:border-white/20 glass-card-light dark:glass-card p-6 sm:p-10 shadow-2xl transition-all duration-300">
      {/* Background Glow Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/15 dark:bg-purple-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse [animation-duration:8s]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-violet-500/15 dark:bg-blue-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse [animation-duration:10s] [animation-delay:2s]"></div>
      </div>

      {/* Header Badge */}
      <div className="relative z-10 text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 text-indigo-800 dark:text-indigo-400 text-xs font-black border border-indigo-500/20">
          <span>🤖 MentorX Classroom Lounge</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          Multiplayer MentorX Chat Hub
        </h1>
        <p className="text-slate-800 dark:text-gray-400 text-sm font-semibold max-w-lg mx-auto leading-relaxed">
          Create a private lounge or join an existing room to chat with peers and invoke MentorX Assistant on demand!
        </p>
      </div>

      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-8">
        
        {/* Create Room Section */}
        <div className="flex flex-col p-8 rounded-2xl bg-white/80 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-2xl text-white shadow-lg mb-4">
              ✨
            </div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white mb-1.5 tracking-tight">Create a New Room</h2>
            <p className="text-xs font-semibold text-slate-700 dark:text-gray-400 leading-relaxed">Start a fresh MentorX multiplayer workspace and invite your classmates or team.</p>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-black text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-2 block">Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="E.g., Algorithms & MentorX Study Room"
                className="w-full rounded-xl border border-slate-900/15 dark:border-white/10 bg-white/90 dark:bg-[#161622] px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || isCreating}
              className="mt-auto w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </div>

        {/* Join Room Section */}
        <div className="flex flex-col p-8 rounded-2xl bg-white/80 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-rose-500 flex items-center justify-center text-2xl text-white shadow-lg mb-4">
              🤝
            </div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white mb-1.5 tracking-tight">Join an Existing Room</h2>
            <p className="text-xs font-semibold text-slate-700 dark:text-gray-400 leading-relaxed">Enter an 8-character invite code to jump directly into the conversation.</p>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-black text-slate-700 dark:text-gray-400 uppercase tracking-wider mb-2 block">Invite Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="E.g., A1B2C3D4"
                maxLength={8}
                className="w-full rounded-xl border border-slate-900/15 dark:border-white/10 bg-white/90 dark:bg-[#161622] px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 transition-all uppercase tracking-[0.2em] font-mono shadow-sm"
              />
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={!joinCode.trim() || isJoining}
              className="mt-auto w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? "Joining..." : "Join Room"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="relative z-10 mt-6 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm font-bold backdrop-blur-md">
          {error}
        </div>
      )}
    </div>
  );
}
