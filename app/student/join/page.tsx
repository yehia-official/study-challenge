// app/student/join/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Student Join Page — Enter a 6-character session code to join a live session
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/services/authService";

export default function StudentJoinPage() {
  const { userProfile } = useAuth();
  const router = useRouter();

  // 6 individual input boxes for the join code
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const joinCode = code.join("").toUpperCase();

  function handleInput(index: number, value: string) {
    const char = value.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    const next  = [...code];
    next[index] = char;
    setCode(next);
    setError(null);

    // Auto-advance to next input
    if (char && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleJoin() {
    if (joinCode.length < 6) {
      setError("Please enter the full 6-character session code.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/session/${joinCode}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Session not found. Check the code and try again.");
      } else {
        router.push(`/student/arena/${data.session.joinCode}`);
      }
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute requiredRole="student">
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style>{`.material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family:'Material Symbols Outlined'; }`}</style>

      <div className="min-h-screen bg-kinetic-mesh flex flex-col">

        {/* Top bar */}
        <header
          className="flex justify-between items-center px-8 py-4 sticky top-0 z-40"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(16px)" }}
        >
          <span
            className="text-xl font-black tracking-tighter font-headline"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Study Challenge
          </span>

          <div className="flex items-center gap-3">
            {userProfile && (
              <>
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-bold text-on-surface hidden sm:block">
                  {userProfile.displayName}
                </span>
              </>
            )}
            <button
              onClick={() => signOut()}
              className="text-on-surface-variant hover:text-primary transition-colors text-sm ml-2"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center p-6">

          {/* Decorative orbs */}
          <div
            className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
            style={{ background: "rgba(112,42,225,0.08)" }}
            aria-hidden
          />
          <div
            className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
            style={{ background: "rgba(0,105,75,0.06)" }}
            aria-hidden
          />

          <div className="w-full max-w-md relative">

            {/* Hero */}
            <div className="text-center mb-10">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
                style={{
                  background: "linear-gradient(135deg, #702ae1, #b28cff)",
                  boxShadow:  "0 16px 40px rgba(112,42,225,0.35)",
                }}
              >
                <span className="material-symbols-outlined text-white" style={{ fontSize: "2.5rem" }}>
                  sports_esports
                </span>
              </div>

              <h1 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight mb-3">
                Join a Session
              </h1>
              <p className="text-on-surface-variant text-base">
                Enter the{" "}
                <span className="font-bold" style={{ color: "#702ae1" }}>6-character code</span>{" "}
                shown by your professor
              </p>
            </div>

            {/* Code inputs */}
            <div
              className="glass-panel rounded-xl p-8 ghost-border mb-6"
              style={{ boxShadow: "0 25px 60px rgba(58,38,75,0.10)" }}
            >

              <div className="flex gap-3 justify-center mb-8">
                {code.map((char, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    value={char}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-black font-headline rounded-xl transition-all"
                    style={{
                      background: char ? "#f5e2ff" : "#faecff",
                      color:      "#702ae1",
                      border:     "none",
                      outline:    "none",
                      boxShadow:  char
                        ? "0 0 0 2px #702ae1, 0 4px 12px rgba(112,42,225,0.15)"
                        : "0 2px 6px rgba(58,38,75,0.06)",
                    }}
                    onFocus={(e) => { e.target.style.boxShadow = "0 0 0 3px rgba(112,42,225,0.25)"; }}
                    onBlur={(e)  => { e.target.style.boxShadow = char ? "0 0 0 2px #702ae1" : "0 2px 6px rgba(58,38,75,0.06)"; }}
                  />
                ))}
              </div>

              {/* Demo hint */}
              <div
                className="flex items-center gap-3 p-3 rounded-xl mb-6"
                style={{ background: "rgba(252,223,70,0.2)" }}
              >
                <span className="text-lg">💡</span>
                <p className="text-xs text-on-surface">
                  Demo mode: try code <strong className="font-mono text-primary">DEMO01</strong>
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm font-medium mb-4"
                  style={{ background: "rgba(180,19,64,0.10)", color: "#b41340" }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Join button */}
              <button
                onClick={handleJoin}
                disabled={loading || joinCode.length < 6}
                className="w-full py-4 rounded-full font-headline font-bold text-on-primary text-base transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading || joinCode.length < 6
                    ? "#856e98"
                    : "linear-gradient(135deg, #702ae1, #b28cff)",
                  boxShadow: loading || joinCode.length < 6
                    ? "none"
                    : "0 15px 30px rgba(112,42,225,0.28)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Joining session...
                  </span>
                ) : (
                  `Enter the Arena →`
                )}
              </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: "⚡", label: "Real-time", sub: "Instant sync" },
                { icon: "🏆", label: "Compete", sub: "Live rankings" },
                { icon: "🎯", label: "Earn XP", sub: "Score points" },
              ].map((item) => (
                <div key={item.label} className="glass-panel rounded-xl p-3 ghost-border">
                  <div className="text-xl mb-1">{item.icon}</div>
                  <p className="font-bold text-xs text-on-surface">{item.label}</p>
                  <p className="text-[10px] text-on-surface-variant">{item.sub}</p>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
