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
    <div className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-[#0a0a0f]/60 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl p-6">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen animate-pulse [animation-duration:8s]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen animate-pulse [animation-duration:10s] [animation-delay:2s]"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-2 gap-8">
        
        {/* Create Room Section */}
        <div className="flex flex-col p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl transition-transform hover:scale-[1.02]">
          <div className="mb-6">
            <span className="text-4xl mb-4 block">✨</span>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Create a New Room</h2>
            <p className="text-sm text-gray-400">Start a fresh AI multiplayer chat space for you and your friends.</p>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="E.g., Weekend Coding Party"
                className="w-full bg-[#161622] rounded-xl border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
              />
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={!roomName.trim() || isCreating}
              className="mt-auto w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </div>

        {/* Join Room Section */}
        <div className="flex flex-col p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl transition-transform hover:scale-[1.02]">
          <div className="mb-6">
            <span className="text-4xl mb-4 block">🤝</span>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Join an Existing Room</h2>
            <p className="text-sm text-gray-400">Have an 8-character invite code? Enter it below to join the fun.</p>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Invite Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="E.g., A1B2C3D4"
                maxLength={8}
                className="w-full bg-[#161622] rounded-xl border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner uppercase tracking-[0.2em] font-mono"
              />
            </div>
            <button
              onClick={handleJoinRoom}
              disabled={!joinCode.trim() || isJoining}
              className="mt-auto w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? "Joining..." : "Join Room"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="relative z-10 mt-6 px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm font-medium backdrop-blur-md">
          {error}
        </div>
      )}
    </div>
  );
}
