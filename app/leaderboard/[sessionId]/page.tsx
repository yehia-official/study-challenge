"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { getSocket } from "@/lib/socket";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  streak: number;
}

export default function StudentLeaderboardPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();

  const [leaderboard, setLeaderboard] = useState<Record<string, LeaderboardEntry>>({});

  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    socket.emit("join-session", sessionId);

    const handleUpdate = (data: any) => {
      setLeaderboard((prev) => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          displayName: data.displayName || prev[data.userId]?.displayName || "Anonymous",
          score: data.score,
          streak: data.streak,
        }
      }));
    };

    // Since they just joined, some data might already be broadcast. In a real app we'd fetch the initial state via REST.
    socket.on("leaderboard-update", handleUpdate);

    const handleSync = (fullLeaderboard: Record<string, LeaderboardEntry>) => {
      setLeaderboard(fullLeaderboard);
    };
    socket.on("leaderboard-sync", handleSync);

    // If the professor pushes another question, jump back to Arena!
    const handleNewQuestion = () => {
        router.push(`/student/arena/${sessionId}`);
    };
    socket.on("new-question", handleNewQuestion);

    return () => {
      socket.off("leaderboard-update", handleUpdate);
      socket.off("leaderboard-sync", handleSync);
      socket.off("new-question", handleNewQuestion);
    };
  }, [sessionId, router]);

  const sortedLeaderboard = Object.values(leaderboard).sort((a, b) => b.score - a.score);

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-kinetic-mesh flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Magic gradient background for extra gamified feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f2e] via-[#2c1b4d] to-[#120a21] z-0 opacity-95" />
        
        <div className="relative z-10 w-full max-w-2xl">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="font-headline font-extrabold text-3xl md:text-5xl text-white tracking-tight mb-4" style={{ textShadow: "0 4px 20px rgba(112,42,225,0.6)" }}>
              Live Standings
            </h1>
            <p className="text-white/60 font-medium text-sm md:text-base px-4">Waiting for the next question to drop...</p>
          </div>

          <div className="space-y-3 md:space-y-4 px-4 w-full">
            {sortedLeaderboard.length === 0 ? (
                <div className="text-center p-12 glass-panel rounded-3xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                     <div className="animate-spin w-10 h-10 border-4 border-[#702ae1] border-t-transparent rounded-full mx-auto mb-4"></div>
                     <p className="text-white font-bold">Computing results...</p>
                </div>
            ) : sortedLeaderboard.map((entry, idx) => (
              <div 
                key={entry.userId}
                className="flex items-center p-4 rounded-2xl transition-all duration-500 ease-out"
                style={{
                  background: idx === 0 ? "linear-gradient(135deg, #fcdf46, #cdae00)" : 
                              idx === 1 ? "linear-gradient(135deg, #e2e8f0, #94a3b8)" :
                              idx === 2 ? "linear-gradient(135deg, #fcd34d, #b45309)" :
                              "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: idx <= 2 ? "#1e293b" : "#fff",
                  transform: `scale(${idx === 0 ? 1.05 : 1})`,
                  boxShadow: idx === 0 ? "0 10px 40px rgba(252,223,70,0.3)" : "none",
                  zIndex: 10 - idx
                }}
              >
                <div className="w-10 md:w-12 text-lg md:text-2xl font-black text-center opacity-80 shrink-0">
                  #{idx + 1}
                </div>
                
                <div className="flex-1 px-3 md:px-4 min-w-0">
                   <h3 className="font-headline font-bold text-lg md:text-xl truncate leading-tight">{entry.displayName}</h3>
                   {entry.streak >= 3 && (
                       <span className="text-[10px] md:text-xs font-bold inline-flex items-center gap-1 opacity-80 uppercase tracking-widest mt-1">
                           🔥 Streak x{entry.streak}
                       </span>
                   )}
                </div>
                
                <div className="text-right shrink-0">
                    <span className="text-xs md:text-sm opacity-70 block font-bold uppercase tracking-widest mb-1">GPA</span>
                    <span className="text-xl md:text-2xl font-black font-headline truncate">{entry.score.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
