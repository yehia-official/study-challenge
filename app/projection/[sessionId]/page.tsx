"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSocket } from "@/lib/socket";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  score: number;
  streak: number;
}

export default function BigScreenProjectionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [leaderboard, setLeaderboard] = useState<Record<string, LeaderboardEntry>>({});
  const [participantsCount, setParticipantsCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);

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

    const handleSync = (fullLeaderboard: Record<string, LeaderboardEntry>) => {
      setLeaderboard(fullLeaderboard);
      setParticipantsCount(Object.keys(fullLeaderboard).length);
    };

    const handleJoined = (profile: any) => {
      setParticipantsCount((prev) => prev + 1);
    };

    const handleNewQuestion = (q: any) => {
       setCurrentQuestion(q.text);
    };

    socket.on("leaderboard-update", handleUpdate);
    socket.on("leaderboard-sync", handleSync);
    socket.on("participant-joined", handleJoined);
    socket.on("new-question", handleNewQuestion);

    return () => {
      socket.off("leaderboard-update", handleUpdate);
      socket.off("leaderboard-sync", handleSync);
      socket.off("participant-joined", handleJoined);
      socket.off("new-question", handleNewQuestion);
    };
  }, [sessionId]);

  const sortedLeaderboard = Object.values(leaderboard).sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0c1b] font-body text-white overflow-hidden relative">
      
      {/* Background grids */}
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#702ae1] rounded-full blur-[200px] opacity-40 mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#fcdf46] rounded-full blur-[200px] opacity-20 mix-blend-screen" />

      {/* Top Banner */}
      <header className="relative z-10 w-full p-8 flex items-center justify-between border-b border-white/10 glass-panel">
        <div className="flex items-center gap-6">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
             <span className="block text-white/60 text-xs font-black uppercase tracking-widest mb-1">Join Code</span>
             <span className="text-6xl font-black font-headline tracking-widest text-[#fcdf46] drop-shadow-[0_0_15px_rgba(252,223,70,0.5)]">
               {sessionId}
             </span>
          </div>
          <div>
             <h1 className="text-3xl font-black text-white">Go to Study Challenge</h1>
             <p className="text-lg text-white/50">Enter the code to join the game</p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-3 bg-[#702ae1]/20 px-6 py-3 rounded-full border border-[#702ae1]/50 shadow-[0_0_20px_rgba(112,42,225,0.3)]">
            <span className="material-symbols-outlined text-3xl text-white">groups</span>
            <span className="text-2xl font-black">{participantsCount} Players</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-12 w-full max-w-7xl mx-auto">
         {currentQuestion ? (
             <div className="text-center animate-in zoom-in fade-in duration-500 mb-12">
                <span className="bg-[#107c41] text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-sm inline-block mb-6 shadow-[0_0_20px_rgba(16,124,65,0.6)]">
                   Live Question Active
                </span>
                <h2 className="text-5xl font-black font-headline max-w-4xl leading-tight">
                  {currentQuestion}
                </h2>
             </div>
         ) : (
             <h2 className="text-4xl font-bold text-white/40 mb-12 uppercase tracking-widest animate-pulse">Waiting for Professor...</h2>
         )}

         {/* Podium / Leaderboard */}
         {sortedLeaderboard.length > 0 && (
            <div className="w-full flex-1 flex flex-col justify-end mt-12 pb-12 gap-4">
              <h3 className="text-2xl font-black uppercase tracking-widest text-white/50 text-center mb-4">Current Standings</h3>
              <div className="flex items-end justify-center w-full gap-4 md:gap-8 min-h-[300px]">
                 {sortedLeaderboard.slice(0, 5).map((entry, idx) => {
                    // Heights representing scores, max height for rank 1
                    const maxScore = sortedLeaderboard[0].score || 1;
                    const heightPct = Math.max(20, (entry.score / maxScore) * 100);
                    
                    const colors = [
                      "from-[#fcdf46] to-[#b47a00]", // 1st
                      "from-[#e2e8f0] to-[#7f8ea3]", // 2nd
                      "from-[#fcd34d] to-[#9c4c00]", // 3rd
                      "from-[#702ae1] to-[#3b0d87]", // 4th
                      "from-[#14b8a6] to-[#04665a]", // 5th
                    ];
                    
                    return (
                        <div key={entry.userId} className="flex flex-col items-center justify-end w-32 md:w-48 group">
                          
                          {/* Score and Name above bar */}
                          <div className="text-center mb-4 animate-in slide-in-from-bottom-4 zoom-in duration-500">
                             <span className="text-3xl font-black font-headline block mb-1 drop-shadow-md">
                                {entry.score.toFixed(2)}
                             </span>
                             <span className="font-bold text-white/90 truncate w-32 block bg-black/40 px-3 py-1 rounded-full border border-white/10">
                               {entry.displayName}
                             </span>
                          </div>

                          {/* Bar */}
                          <div 
                            className={`w-full rounded-t-3xl bg-gradient-to-t ${colors[idx]} shadow-[0_-10px_40px_rgba(255,255,255,0.1)] relative overflow-hidden transition-all duration-[1500ms] ease-out`}
                            style={{ height: `${heightPct}%`, borderTop: "2px solid rgba(255,255,255,0.5)" }}
                          >
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20 mix-blend-overlay" />
                             <div className="absolute top-4 w-full text-center">
                                <span className="text-4xl font-black opacity-80" style={{ color: idx === 0 ? "#5d5000" : idx === 1 ? "#334155" : idx === 2 ? "#552100" : "#fff"  }}>
                                  #{idx + 1}
                                </span>
                             </div>
                          </div>

                        </div>
                    );
                 })}
              </div>
            </div>
         )}
      </main>
    </div>
  );
}
