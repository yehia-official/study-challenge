// app/student/arena/[sessionId]/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";

const OPTION_STYLES = [
  { bg: "#702ae1", text: "#f8f0ff", iconBg: "rgba(255,255,255,0.2)" },  // A — Purple
  { bg: "#fcdf46", text: "#5d5000", iconBg: "rgba(0,0,0,0.07)"     },  // B — Yellow
  { bg: "#86ffcd", text: "#006146", iconBg: "rgba(0,0,0,0.07)"     },  // C — Mint
  { bg: "#3b82f6", text: "#ffffff", iconBg: "rgba(255,255,255,0.2)" },  // D — Blue
  { bg: "#f59e0b", text: "#ffffff", iconBg: "rgba(255,255,255,0.2)" },  // E — Amber
  { bg: "#ec4899", text: "#ffffff", iconBg: "rgba(255,255,255,0.2)" },  // F — Pink
  { bg: "#14b8a6", text: "#ffffff", iconBg: "rgba(255,255,255,0.2)" },  // G — Teal
  { bg: "#6366f1", text: "#ffffff", iconBg: "rgba(255,255,255,0.2)" },  // H — Indigo
];

type AnswerState = "idle" | "correct" | "incorrect" | "timeout" | "submitted";

export default function StudentArenaPage() {
  const { userProfile } = useAuth();
  const params  = useParams();
  const router  = useRouter();
  const sessionId = params.sessionId as string;

  const [question,    setQuestion]    = useState<any>(null);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [score,       setScore]       = useState(0);
  const [streak,      setStreak]      = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [hasAnswered, setHasAnswered] = useState(false);

  // Essay state
  const [essayText, setEssayText] = useState("");

  const hasAnsweredRef = useRef(false);

  // ── Socket connection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    socket.emit("join-session", sessionId);

    const handleNewQuestion = (q: any) => {
      setQuestion(q);
      setTimeLeft(q.timeLimitSecs || 30);
      setHasAnswered(false);
      hasAnsweredRef.current = false;
      setSelectedOpt(null);
      setAnswerState("idle");
      setEssayText("");
    };

    socket.on("new-question", handleNewQuestion);
    return () => { socket.off("new-question", handleNewQuestion); };
  }, [sessionId]);

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasAnswered || timeLeft <= 0 || !question) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          if (!hasAnsweredRef.current) handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasAnswered, question]);

  // ── Timeout ────────────────────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    setAnswerState("timeout");
    setHasAnswered(true);
    hasAnsweredRef.current = true;
    setStreak(0);
    const socket = getSocket();
    socket.emit("submit-answer", {
      joinCode: sessionId,
      userId: userProfile?.uid,
      gpaEarned: 0,
      streak: 0,
      displayName: userProfile?.displayName,
    });
  }, [sessionId, userProfile]);

  // ── Multiple choice / True-False answer ───────────────────────────────────
  function handleAnswer(optionId: string) {
    if (hasAnswered || !question) return;
    setSelectedOpt(optionId);
    setHasAnswered(true);
    hasAnsweredRef.current = true;

    const correct = optionId === question.correctOptionId;
    setAnswerState(correct ? "correct" : "incorrect");

    const socket = getSocket();
    if (correct) {
      const baseGPA    = 3.0;
      const speedBonus = question.timeLimitSecs ? (timeLeft / question.timeLimitSecs) * 1.0 : 0;
      const gpaEarned  = parseFloat((baseGPA + speedBonus).toFixed(2));
      setScore((s) => s + gpaEarned);
      setStreak((s) => s + 1);
      socket.emit("submit-answer", {
        joinCode: sessionId, userId: userProfile?.uid,
        gpaEarned, streak: streak + 1, displayName: userProfile?.displayName,
      });
    } else {
      setStreak(0);
      socket.emit("submit-answer", {
        joinCode: sessionId, userId: userProfile?.uid,
        gpaEarned: 0, streak: 0, displayName: userProfile?.displayName,
      });
    }
  }

  // ── Essay submit ───────────────────────────────────────────────────────────
  function handleEssaySubmit() {
    if (hasAnswered || !question || !essayText.trim()) return;
    setHasAnswered(true);
    hasAnsweredRef.current = true;
    setAnswerState("submitted");

    // Essays don't earn automatic GPA — professor grades manually
    const socket = getSocket();
    socket.emit("submit-answer", {
      joinCode: sessionId, userId: userProfile?.uid,
      gpaEarned: 0, streak: 0, displayName: userProfile?.displayName,
      essayText,
    });
  }

  // ── Waiting screen ─────────────────────────────────────────────────────────
  if (!question) {
    return (
      <ProtectedRoute requiredRole="student">
        <div
          className="min-h-screen font-body text-on-surface flex flex-col items-center justify-center text-center p-6"
          style={{ background: "#fef3ff" }}
        >
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4" />
          <h2 className="text-2xl font-headline font-bold mb-2">Waiting for the Professor...</h2>
          <p className="text-on-surface-variant">Get ready, the challenge is about to start!</p>
        </div>
      </ProtectedRoute>
    );
  }

  const qType      = question.questionType || "multiple_choice";
  const timerPct   = (timeLeft / (question.timeLimitSecs || 30)) * 100;
  const timerColor = timeLeft > 15 ? "#702ae1" : timeLeft > 8 ? "#fcdf46" : "#b41340";

  return (
    <ProtectedRoute requiredRole="student">
      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
          font-family: 'Material Symbols Outlined';
        }
        .fill-icon { font-variation-settings: 'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24; }
      `}</style>

      <div
        className="min-h-screen font-body text-on-surface flex flex-col overflow-hidden"
        style={{ background: "#fef3ff", minHeight: "max(884px, 100dvh)" }}
      >
        {/* ── Timer / Status Bar ────────────────────────────────────────── */}
        <header className="w-full pt-8 px-6 pb-2 z-50">
          <div className="flex items-center justify-between mb-4">
            {/* Label */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #702ae1, #b28cff)", boxShadow: "0 6px 20px rgba(112,42,225,0.35)" }}
              >
                <span className="material-symbols-outlined text-white">rocket_launch</span>
              </div>
              <div>
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant leading-none">Live Challenge</p>
                <h1 className="font-headline font-extrabold text-lg text-primary tracking-tight">
                  {qType === "essay" ? "مقال" : qType === "true_false" ? "صح / خطأ" : "اختيار من متعدد"}
                </h1>
              </div>
            </div>
            {/* Score */}
            <div
              className="px-4 py-2 rounded-full flex items-center gap-2"
              style={{ background: "#edd3ff", boxShadow: "0 2px 8px rgba(58,38,75,0.08)" }}
            >
              <span className="material-symbols-outlined fill-icon text-[#6a5b00] text-xl">stars</span>
              <span className="font-headline font-black text-on-surface">GPA: {score.toFixed(2)}</span>
            </div>
          </div>

          {/* Timer bar */}
          <div className="w-full h-4 rounded-full overflow-hidden p-1" style={{ background: "#f5e2ff", boxShadow: "inset 0 2px 4px rgba(58,38,75,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${timerPct}%`, background: `linear-gradient(90deg, ${timerColor}, ${timerColor}dd)`, boxShadow: `0 0 12px ${timerColor}66` }}
            />
          </div>
          <div className="flex justify-between mt-1 px-2">
            <span className="font-label text-[10px] text-on-surface-variant font-bold">
              STREAK: x{streak} {streak >= 3 ? "🔥" : ""}
            </span>
            <span className="font-label text-[10px] font-bold transition-colors" style={{ color: timerColor }}>
              {timeLeft}s LEFT
            </span>
          </div>
        </header>

        {/* ── Question Area ─────────────────────────────────────────────── */}
        <main className="flex-grow flex flex-col items-center justify-center px-6 relative">
          {/* Deco blobs */}
          <div className="absolute top-10 left-10 w-24 h-24 rounded-full blur-3xl" style={{ background: "rgba(0,105,75,0.10)" }} />
          <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full blur-3xl" style={{ background: "rgba(112,42,225,0.10)" }} />

          {/* Question Card */}
          <div
            className="w-full max-w-md rounded-xl p-8 relative overflow-hidden flex flex-col items-center text-center"
            style={{ background: "#fff", boxShadow: "0 20px 60px rgba(58,38,75,0.08)" }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-50" style={{ background: "#faecff", transform: "translate(4rem, -4rem)" }} aria-hidden />
            <div className="w-16 h-1 rounded-full mb-8" style={{ background: "#edd3ff" }} />

            {/* Question type badge */}
            <span
              className="font-label text-sm font-bold mb-4 px-4 py-1 rounded-full flex items-center gap-1"
              style={{ background: "rgba(112,42,225,0.10)", color: "#702ae1" }}
            >
              <span className="material-symbols-outlined text-sm">
                {qType === "essay" ? "edit_note" : qType === "true_false" ? "rule" : "ballot"}
              </span>
              {qType === "essay" ? "سؤال مقال" : qType === "true_false" ? "صح / خطأ" : "اختيار من متعدد"}
            </span>

            {/* Question text */}
            <h2 className="font-headline font-bold text-2xl text-on-surface leading-tight mb-6">
              {question.text}
            </h2>

            {/* ── Essay input ───────────────────────────────────────── */}
            {qType === "essay" && !hasAnswered && (
              <div className="w-full mt-2">
                <textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="اكتب إجابتك هنا..."
                  disabled={hasAnswered}
                  className="w-full rounded-xl p-4 text-base font-body text-on-surface resize-none min-h-[120px]"
                  style={{ border: "2px solid #edd3ff", outline: "none", background: "#fdf4ff" }}
                  dir="auto"
                />
                <button
                  onClick={handleEssaySubmit}
                  disabled={!essayText.trim()}
                  className="mt-4 w-full py-4 rounded-xl font-bold font-headline text-lg text-white shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #b41340, #ff6b9d)" }}
                >
                  إرسال الإجابة ✏️
                </button>
              </div>
            )}

            {/* ── Answer feedback ───────────────────────────────────── */}
            {hasAnswered && (
              <div className="flex flex-col items-center gap-4 mt-4 w-full">
                <div
                  className="px-6 py-3 rounded-full text-base md:text-lg font-bold font-headline animate-bounce"
                  style={{
                    background:
                      answerState === "correct"   ? "rgba(0,105,75,0.12)"  :
                      answerState === "submitted"  ? "rgba(112,42,225,0.10)":
                      answerState === "timeout"    ? "rgba(106,91,0,0.12)"  :
                                                    "rgba(180,19,64,0.12)",
                    color:
                      answerState === "correct"  ? "#00694b" :
                      answerState === "submitted" ? "#702ae1" :
                      answerState === "timeout"   ? "#6a5b00" :
                                                   "#b41340",
                  }}
                >
                  {answerState === "correct"
                    ? `+${(3.0 + (question.timeLimitSecs ? (timeLeft / question.timeLimitSecs) * 1.0 : 0)).toFixed(2)} GPA ✓ Correct!`
                    : answerState === "submitted"
                    ? "✏️ Essay submitted! Await professor grading."
                    : answerState === "timeout"
                    ? "⏱ Time's up! +0.0 GPA"
                    : `✗ Wrong! Correct: ${question.correctOptionId}`}
                </div>

                <button
                  onClick={() => router.push(`/leaderboard/${sessionId}`)}
                  className="w-full py-4 rounded-xl font-bold font-headline text-lg text-white shadow-xl hover:scale-[1.02] transition-transform animate-in fade-in slide-in-from-bottom flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #702ae1, #b28cff)" }}
                >
                  View My Rank 🏆
                </button>
              </div>
            )}
          </div>
        </main>

        {/* ── Answer Grid (MC / True-False) ─────────────────────────────── */}
        {(qType === "multiple_choice" || qType === "true_false") && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 pb-12 w-full max-w-xl mx-auto">
            {question.options.map((opt: any, i: number) => {
              const style     = OPTION_STYLES[i] || OPTION_STYLES[0];
              const isSelected = selectedOpt === opt.id;
              const isCorrect  = opt.id === question.correctOptionId;
              const showResult = hasAnswered;

              let bg = style.bg;
              if (showResult) {
                if (isCorrect)                   bg = "#00694b";
                else if (isSelected && !isCorrect) bg = "#b41340";
                else bg = style.bg + "80";
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  disabled={hasAnswered}
                  className="p-4 rounded-xl flex items-center gap-3 relative overflow-hidden transition-all"
                  style={{
                    background: bg,
                    color:      style.text,
                    boxShadow:  isSelected ? `0 0 0 4px white, 0 0 0 6px ${bg}` : "0 4px 16px rgba(0,0,0,0.15)",
                    opacity:    hasAnswered && !isCorrect && !isSelected ? 0.6 : 1,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { if (!hasAnswered) (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                  onMouseDown={(e)  => { if (!hasAnswered) (e.currentTarget as HTMLElement).style.transform = "scale(0.95)"; }}
                  onMouseUp={(e)    => { if (!hasAnswered) (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                >
                  <div className="absolute top-0 left-0 w-full h-1" style={{ background: "rgba(255,255,255,0.20)" }} />
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: style.iconBg }}>
                    <span className="font-headline font-black text-xl">{opt.id}</span>
                  </div>
                  <span className="font-headline font-bold text-lg">{opt.text}</span>
                </button>
              );
            })}
          </section>
        )}

        {/* ── Power-up FABs ──────────────────────────────────────────────── */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-50">
          <button
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-110"
            style={{ background: "#edd3ff", boxShadow: "0 8px 24px rgba(58,38,75,0.15)", border: "4px solid white" }}
            title="50/50 Power-up"
          >
            <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
          </button>
          <button
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-110"
            style={{ background: "#edd3ff", boxShadow: "0 8px 24px rgba(58,38,75,0.15)", border: "4px solid white" }}
            title="Extra time Power-up"
          >
            <span className="material-symbols-outlined text-[#6a5b00] text-2xl">auto_awesome</span>
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
