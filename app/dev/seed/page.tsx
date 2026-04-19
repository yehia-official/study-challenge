// app/dev/seed/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 🌱 Database Seed Page — Development Only
// Populates Firestore with a complete demo dataset:
//   • 1 Session (join code: DEMO01)
//   • 3 Questions (Biology, Physics, Mathematics)
//   • 3 Leaderboard entries for the session
//
// Uses the currently logged-in professor's account.
// Visit: http://localhost:3000/dev/seed
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ── Seed Status Type ──────────────────────────────────────────────────────────
type StepStatus = "idle" | "running" | "done" | "error";
interface SeedStep {
  label:   string;
  status:  StepStatus;
  detail?: string;
}

// ── Demo Data ─────────────────────────────────────────────────────────────────
const DEMO_JOIN_CODE  = "DEMO01";
const DEMO_SESSION_TITLE = "Advanced Cellular Biology — Module 4";

const DEMO_QUESTIONS = [
  {
    text:          "Which organelle is primarily responsible for generating ATP through cellular respiration?",
    options:       [
      { id: "A", text: "Mitochondria" },
      { id: "B", text: "Ribosome" },
      { id: "C", text: "Nucleus" },
      { id: "D", text: "Lysosome" },
    ],
    correctOption: "A",
    points:        800,
    timeLimitSecs: 30,
    order:         1,
  },
  {
    text:          "What is the speed of light in a vacuum (approximately)?",
    options:       [
      { id: "A", text: "300,000 km/s" },
      { id: "B", text: "150,000 km/s" },
      { id: "C", text: "450,000 km/s" },
      { id: "D", text: "1,000,000 km/s" },
    ],
    correctOption: "A",
    points:        600,
    timeLimitSecs: 20,
    order:         2,
  },
  {
    text:          "What is the derivative of sin(x)?",
    options:       [
      { id: "A", text: "-cos(x)" },
      { id: "B", text: "cos(x)" },
      { id: "C", text: "tan(x)" },
      { id: "D", text: "-sin(x)" },
    ],
    correctOption: "B",
    points:        1000,
    timeLimitSecs: 45,
    order:         3,
  },
];

// Fake leaderboard entries (demo students who "already joined")
const DEMO_LEADERBOARD = [
  {
    userId:         "demo-student-marcus",
    displayName:    "Marcus V.",
    avatarUrl:      "https://api.dicebear.com/9.x/avataaars/svg?seed=marcus",
    totalScore:     14200,
    streak:         5,
    answeredCount:  3,
  },
  {
    userId:         "demo-student-sarah",
    displayName:    "Sarah J.",
    avatarUrl:      "https://api.dicebear.com/9.x/avataaars/svg?seed=sarah",
    totalScore:     12840,
    streak:         3,
    answeredCount:  3,
  },
  {
    userId:         "demo-student-elena",
    displayName:    "Elena K.",
    avatarUrl:      "https://api.dicebear.com/9.x/avataaars/svg?seed=elena",
    totalScore:     11950,
    streak:         2,
    answeredCount:  3,
  },
];

export default function SeedPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const [steps, setSteps] = useState<SeedStep[]>([
    { label: "Create demo session",       status: "idle" },
    { label: "Add Question 1 (Biology)",  status: "idle" },
    { label: "Add Question 2 (Physics)",  status: "idle" },
    { label: "Add Question 3 (Math)",     status: "idle" },
    { label: "Seed leaderboard (3 students)", status: "idle" },
  ]);
  const [seedDone,    setSeedDone]    = useState(false);
  const [sessionId,   setSessionId]   = useState<string | null>(null);
  const [seeding,     setSeeding]     = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Helper: update a single step's status
  function updateStep(index: number, status: StepStatus, detail?: string) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status, detail } : s))
    );
  }

  async function runSeed() {
    if (!user || !userProfile) {
      setGlobalError("You must be logged in as a professor to seed data.");
      return;
    }
    if (userProfile.role !== "professor") {
      setGlobalError("Only professors can seed demo data.");
      return;
    }

    setSeeding(true);
    setGlobalError(null);

    try {
      setGlobalError("Seed script not yet migrated to Node API.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setGlobalError(msg);
      console.error("[SeedPage]", err);
    } finally {
      setSeeding(false);
    }
  }

  // ── Status icon helper ──────────────────────────────────────────────────────
  function StatusIcon({ status }: { status: StepStatus }) {
    if (status === "idle")    return <span className="w-5 h-5 rounded-full bg-surface-container-high block" />;
    if (status === "running") return (
      <svg className="animate-spin w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    );
    if (status === "done")  return (
      <span className="w-5 h-5 rounded-full bg-tertiary flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
    );
    return (
      <span className="w-5 h-5 rounded-full bg-error flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-kinetic-mesh flex items-center justify-center p-6">

      {/* Decorative orb */}
      <div
        className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-50"
        style={{ background: "rgba(112, 42, 225, 0.12)" }}
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative">

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-2xl"
            style={{ background: "linear-gradient(135deg, #702ae1, #b28cff)" }}
          >
            🌱
          </div>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">
            Database Seed
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Populates Firestore with a complete demo dataset
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-panel rounded-xl p-8 ghost-border"
          style={{ boxShadow: "0 25px 60px rgba(58,38,75,0.10)" }}
        >
          {/* Current user info */}
          {userProfile ? (
            <div className="flex items-center gap-3 mb-6 p-3 bg-surface-container rounded-xl">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.displayName}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-bold text-sm text-on-surface">{userProfile.displayName}</p>
                <p className="text-xs text-on-surface-variant capitalize">{userProfile.role}</p>
              </div>
            </div>
          ) : (
            <div
              className="mb-6 p-4 rounded-xl text-sm font-medium"
              style={{ background: "rgba(180,19,64,0.10)", color: "#b41340" }}
            >
              ⚠️ You must be logged in as a professor to seed data.
            </div>
          )}

          {/* What will be created info */}
          {!seedDone && (
            <div className="mb-6 space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                Will create in Firestore:
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: "📋", label: "1 Session", sub: `Code: ${DEMO_JOIN_CODE}` },
                  { icon: "❓", label: "3 Questions", sub: "Draft status" },
                  { icon: "🏆", label: "3 Students", sub: "Leaderboard" },
                ].map((item) => (
                  <div key={item.label} className="bg-surface-container rounded-xl p-3">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <p className="font-bold text-xs text-on-surface">{item.label}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress steps */}
          {seeding || seedDone ? (
            <div className="space-y-3 mb-6">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <StatusIcon status={step.status} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${step.status === "done" ? "text-on-surface" : "text-on-surface-variant"}`}>
                      {step.label}
                    </p>
                    {step.detail && (
                      <p className="text-[10px] text-outline mt-0.5 font-mono">{step.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Error */}
          {globalError && (
            <div
              className="mb-4 rounded-xl p-3 text-sm font-medium"
              style={{ background: "rgba(180,19,64,0.10)", color: "#b41340" }}
            >
              {globalError}
            </div>
          )}

          {/* Success state */}
          {seedDone ? (
            <div className="space-y-4">
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: "rgba(0,105,75,0.08)" }}
              >
                <p className="text-2xl mb-2">🎉</p>
                <p className="font-bold text-tertiary text-sm">Seed Complete!</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Session join code: <strong className="text-on-surface font-mono">{DEMO_JOIN_CODE}</strong>
                </p>
                {sessionId && (
                  <p className="text-[10px] text-outline mt-1 font-mono">
                    ID: {sessionId}
                  </p>
                )}
              </div>

              <button
                onClick={() => router.push("/professor/dashboard")}
                className="w-full py-3.5 rounded-full font-headline font-bold text-on-primary text-sm transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #702ae1, #b28cff)" }}
              >
                Go to Dashboard →
              </button>
            </div>
          ) : (
            <button
              id="seed-btn"
              onClick={runSeed}
              disabled={seeding || !userProfile || userProfile.role !== "professor"}
              className="w-full py-4 rounded-full font-headline font-bold text-on-primary text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: seeding ? "#856e98" : "linear-gradient(135deg, #702ae1, #b28cff)",
                boxShadow: seeding ? "none" : "0 15px 30px rgba(112,42,225,0.28)",
              }}
            >
              {seeding ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Seeding database...
                </span>
              ) : (
                "🌱 Seed Demo Data"
              )}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-outline mt-4">
          Dev only · Remove this route before production deployment
        </p>
      </div>
    </div>
  );
}
