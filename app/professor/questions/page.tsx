"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const TYPE_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  multiple_choice: { label: "Multiple Choice", icon: "ballot",    color: "#702ae1", bg: "#f5e2ff" },
  true_false:      { label: "True / False",    icon: "rule",      color: "#00694b", bg: "#c7ffe3" },
  essay:           { label: "Essay",           icon: "edit_note", color: "#b41340", bg: "#ffe4ec" },
};

export default function QuestionBankPage() {
  const { userProfile } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;
    async function fetchQuestions() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res  = await fetch(`${apiUrl}/api/questions/${userProfile?.uid}`);
        const data = await res.json();
        if (res.ok) setQuestions(data.questions);
      } catch {
        console.error("Failed to load questions");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [userProfile?.uid]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div>
          <h2 className="text-2xl font-headline font-extrabold text-on-surface">Question Bank</h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage and organize all your saved challenge questions.</p>
        </div>
        {!loading && (
          <span className="px-4 py-2 rounded-full font-bold text-sm" style={{ background: "#f5e2ff", color: "#702ae1" }}>
            {questions.length} questions
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-outline-variant/30">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">folder_open</span>
          <p className="font-bold text-on-surface-variant">Your question bank is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions.map((q) => {
            const type = q.questionType || "multiple_choice";
            const meta = TYPE_META[type] || TYPE_META.multiple_choice;
            return (
              <div
                key={q._id}
                className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:-translate-y-1 transition-transform"
              >
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(to right, ${meta.color}, ${meta.color}88)` }} />

                {/* Type badge + points row */}
                <div className="flex justify-between items-center">
                  <span
                    className="flex items-center gap-1 font-label text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <span className="material-symbols-outlined text-[12px]">{meta.icon}</span>
                    {meta.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      {q.timeLimitSecs}s
                    </span>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {q.points} pts
                    </span>
                  </div>
                </div>

                {/* Question text */}
                <h3 className="font-headline font-bold text-lg text-on-surface line-clamp-3 leading-snug flex-1">
                  {q.text}
                </h3>

                {/* Options preview / info */}
                {type === "essay" ? (
                  <div className="flex items-center gap-2 text-sm font-bold" style={{ color: meta.color }}>
                    <span className="material-symbols-outlined text-base">edit_note</span>
                    Open-ended answer
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt: any) => (
                      <span
                        key={opt.id}
                        className="text-xs px-2 py-1 rounded-lg font-bold"
                        style={{
                          background: opt.id === q.correctOptionId ? "#c7ffe3" : "#f5e2ff",
                          color:      opt.id === q.correctOptionId ? "#00694b" : "#702ae1",
                        }}
                      >
                        {opt.id}. {opt.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
