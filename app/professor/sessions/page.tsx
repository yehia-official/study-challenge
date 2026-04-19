"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

interface StudentState {
  userId: string;
  displayName: string;
  score: number;
  streak: number;
}

export default function ProfessorLiveSessionsPage() {
  const [sessionCode, setSessionCode] = useState("");
  const [joinedSession, setJoinedSession] = useState(false);
  const [students, setStudents] = useState<Record<string, StudentState>>({});

  useEffect(() => {
    // If the professor joins the session here, they can monitor it.
    const socket = getSocket();

    const handleJoined = (profile: any) => {
      setStudents(prev => ({
        ...prev,
        [profile.uid]: {
          userId: profile.uid,
          displayName: profile.displayName || "Anonymous",
          score: prev[profile.uid]?.score || 0,
          streak: prev[profile.uid]?.streak || 0,
        }
      }));
    };

    const handleLeaderboard = (data: any) => {
      setStudents(prev => ({
        ...prev,
        [data.userId]: {
          userId: data.userId,
          displayName: data.displayName || prev[data.userId]?.displayName || "Anonymous",
          score: data.score,
          streak: data.streak,
        }
      }));
    };

    socket.on("participant-joined", handleJoined);
    socket.on("leaderboard-update", handleLeaderboard);

    return () => {
      socket.off("participant-joined", handleJoined);
      socket.off("leaderboard-update", handleLeaderboard);
    };
  }, []);

  const handleTrackSession = () => {
    if (!sessionCode.trim()) return;
    const socket = getSocket();
    socket.emit("join-session", sessionCode.trim().toUpperCase());
    setJoinedSession(true);
  };

  const sortedStudents = Object.values(students).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div>
          <h2 className="text-2xl font-headline font-extrabold text-on-surface">Live Session Tracker</h2>
          <p className="text-on-surface-variant text-sm mt-1">Monitor your students' real-time progress and scores.</p>
        </div>
        
        {!joinedSession ? (
          <div className="flex items-center gap-3">
             <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="Enter Join Code"
              className="px-4 py-3 rounded-xl border-none outline-none font-headline font-bold uppercase tracking-wider text-primary w-48 text-center"
              style={{ background: "#faecff" }}
            />
            <button
              onClick={handleTrackSession}
              className="px-6 py-3 rounded-xl font-bold font-headline text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}
            >
              Track Live
            </button>
          </div>
        ) : (
          <div className="px-6 py-3 rounded-xl font-bold font-headline" style={{ background: "#faecff", color: "#702ae1" }}>
              Tracking Session: <span className="tracking-widest uppercase ml-2 text-xl">{sessionCode}</span>
          </div>
        )}
      </div>

      {!joinedSession ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed" style={{ borderColor: "#dcb8ff" }}>
            <span className="material-symbols-outlined text-6xl text-primary opacity-50 mb-4">radar</span>
            <h3 className="text-xl font-headline font-bold text-on-surface">No Session Selected</h3>
            <p className="text-on-surface-variant font-medium text-sm">Enter a Join Code above to start monitoring the live room.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center px-4 mb-2">
            <h3 className="text-lg font-headline font-bold text-on-surface">Connected Students ({sortedStudents.length})</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Live Connection</span>
            </div>
          </div>
          
          {sortedStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
               <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
               <p className="text-on-surface-variant font-bold">Waiting for students to join...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedStudents.map((student, index) => (
                <div 
                  key={student.userId} 
                  className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl text-white" 
                           style={{ background: index === 0 ? "#fcdf46" : index === 1 ? "#c0c0c0" : index === 2 ? "#cd7f32" : "#702ae1" }}>
                        {index + 1}
                      </div>
                      <h4 className="font-headline font-bold text-lg text-on-surface truncate w-32">{student.displayName}</h4>
                    </div>
                    {student.streak >= 3 && (
                      <div className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-full animate-bounce">
                        <span className="text-xs font-bold">🔥 x{student.streak}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full bg-[#f5e2ff] rounded-xl p-4 flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">Score</span>
                    <span className="text-2xl font-black font-headline text-on-surface">{student.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
