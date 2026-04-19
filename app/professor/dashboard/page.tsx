"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────
type QuestionType = "multiple_choice" | "true_false" | "essay";

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const OPTION_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: "#702ae1", text: "#f8f0ff", label: "A" },
  1: { bg: "#6a5b00", text: "#fff3c5", label: "B" },
  2: { bg: "#00694b", text: "#c7ffe3", label: "C" },
  3: { bg: "#b41340", text: "#ffefef", label: "D" },
  4: { bg: "#3b82f6", text: "#ffffff", label: "E" },
  5: { bg: "#f59e0b", text: "#ffffff", label: "F" },
  6: { bg: "#ec4899", text: "#ffffff", label: "G" },
  7: { bg: "#14b8a6", text: "#ffffff", label: "H" },
};

const TRUE_FALSE_OPTIONS: AnswerOption[] = [
  { id: "A", text: "True ✓",  isCorrect: true  },
  { id: "B", text: "False ✗", isCorrect: false },
];

const DEFAULT_MC_OPTIONS: AnswerOption[] = [
  { id: "A", text: "", isCorrect: false },
  { id: "B", text: "", isCorrect: true  },
  { id: "C", text: "", isCorrect: false },
  { id: "D", text: "", isCorrect: false },
];

const TYPE_META: Record<QuestionType, { label: string; icon: string; desc: string; color: string }> = {
  multiple_choice: { label: "Multiple Choice", icon: "ballot",       desc: "4+ answer options", color: "#702ae1" },
  true_false:      { label: "True / False",    icon: "rule",         desc: "صح أو خطأ",          color: "#00694b" },
  essay:           { label: "Essay",           icon: "edit_note",    desc: "إجابة مكتوبة حرة",   color: "#b41340" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfessorDashboardPage() {
  const { userProfile } = useAuth();

  // ── Form state ────────────────────────────────────────────────────────────
  const [questionType,  setQuestionType]  = useState<QuestionType>("multiple_choice");
  const [questionText,  setQuestionText]  = useState("");
  const [points,        setPoints]        = useState(800);
  const [timeLimitSecs, setTimeLimitSecs] = useState(30);
  const [options,       setOptions]       = useState<AnswerOption[]>(DEFAULT_MC_OPTIONS);
  const [essayNote,     setEssayNote]     = useState(""); // professor guidance for essay

  const [launched,          setLaunched]          = useState(false);
  const [sessionCode,       setSessionCode]       = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSaving,          setIsSaving]          = useState(false);

  // ── Queue ─────────────────────────────────────────────────────────────────
  const [questionQueue,    setQuestionQueue]    = useState<any[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  const excelInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function switchType(t: QuestionType) {
    setQuestionType(t);
    if (t === "true_false") {
      setOptions(TRUE_FALSE_OPTIONS);
    } else if (t === "multiple_choice") {
      setOptions(DEFAULT_MC_OPTIONS);
    } else {
      setOptions([]);
    }
  }

  function updateOption(id: string, text: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  }

  function toggleCorrect(id: string) {
    setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.id === id })));
  }

  function addOption() {
    if (options.length >= 8) return;
    const nextChar = String.fromCharCode(65 + options.length);
    setOptions((prev) => [...prev, { id: nextChar, text: "", isCorrect: false }]);
  }

  function removeOption(id: string) {
    if (options.length <= 2) return;
    setOptions((prev) => {
      const filtered = prev.filter((o) => o.id !== id).map((o, i) => ({
        ...o,
        id: String.fromCharCode(65 + i),
      }));
      // Make sure at least one is correct
      if (!filtered.some((o) => o.isCorrect)) filtered[0].isCorrect = true;
      return filtered;
    });
  }

  // ── Excel Import ──────────────────────────────────────────────────────────
  function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
        if (data.length < 2) return alert("Excel file appears empty or missing data.");

        const parsedQueue = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row[0]) continue;
          parsedQueue.push({
            questionText: row[0].toString(),
            options: [
              { id: "A", text: row[1]?.toString() || "True"  },
              { id: "B", text: row[2]?.toString() || "False" },
              { id: "C", text: row[3]?.toString() || ""      },
              { id: "D", text: row[4]?.toString() || ""      },
            ].filter((o) => o.text.trim().length > 0),
          });
        }

        if (parsedQueue.length > 0) {
          setQuestionQueue(parsedQueue);
          setCurrentQueueIndex(0);
          loadQuestionToForm(parsedQueue[0]);
          alert(`Success! Loaded ${parsedQueue.length} questions to queue.`);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file. Please ensure it's a valid .xlsx file.");
      }
    };
    reader.readAsBinaryString(file);
    if (excelInputRef.current) excelInputRef.current.value = "";
  }

  function loadQuestionToForm(q: any) {
    setQuestionText(q.questionText);
    setQuestionType("multiple_choice");
    const newOptions: AnswerOption[] = q.options.map((opt: any, idx: number) => ({
      id: String.fromCharCode(65 + idx),
      text: opt.text,
      isCorrect: idx === 0,
    }));
    setOptions(newOptions);
  }

  // ── Save to Bank ──────────────────────────────────────────────────────────
  async function handleSaveToBank() {
    if (!questionText.trim()) return alert("Question text cannot be empty!");

    setIsSaving(true);
    const correctOpt = questionType === "essay" ? null : (options.find((o) => o.isCorrect)?.id || "A");

    const payload = {
      professorId: userProfile?.uid,
      text: questionText,
      questionType,
      points,
      timeLimitSecs,
      options: questionType === "essay" ? [] : options.map((o) => ({ id: o.id, text: o.text })),
      correctOptionId: correctOpt,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Question saved to bank successfully!");
      resetForm();
    } catch {
      alert("Failed to save question");
    } finally {
      setIsSaving(false);
    }
  }

  function resetForm() {
    setQuestionText("");
    setEssayNote("");
    switchType("multiple_choice");
    setPoints(800);
  }

  // ── Session ───────────────────────────────────────────────────────────────
  async function createLiveSession() {
    setIsCreatingSession(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professorId: userProfile?.uid, title: "Class Challenge" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSessionCode(data.session.joinCode);
      const socket = getSocket();
      socket.emit("join-session", data.session.joinCode);
    } catch (err) {
      console.error(err);
      alert("Failed to create session");
    } finally {
      setIsCreatingSession(false);
    }
  }

  // ── Launch ────────────────────────────────────────────────────────────────
  function handleLaunch() {
    if (!questionText.trim() || !sessionCode) {
      if (!sessionCode) alert("Please create a Live Session first to get a Join Code!");
      return;
    }
    setLaunched(true);

    const socket = getSocket();
    const correctOpt = questionType === "essay" ? null : (options.find((o) => o.isCorrect)?.id || "A");

    socket.emit("push-question", {
      joinCode: sessionCode,
      question: {
        text: questionText,
        questionType,
        points,
        timeLimitSecs,
        options: questionType === "essay" ? [] : options.map((o) => ({ id: o.id, text: o.text })),
        correctOptionId: correctOpt,
        professorNote: questionType === "essay" ? essayNote : undefined,
      },
    });

    setTimeout(() => {
      setLaunched(false);
      if (questionQueue.length > 0 && currentQueueIndex < questionQueue.length - 1) {
        const nextIdx = currentQueueIndex + 1;
        setCurrentQueueIndex(nextIdx);
        loadQuestionToForm(questionQueue[nextIdx]);
      } else if (questionQueue.length > 0) {
        alert("Reached the end of the Excel Queue!");
      }
    }, 3000);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Top Banner ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div>
          <h2 className="text-xl md:text-2xl font-headline font-extrabold text-on-surface">Live Challenge Setup</h2>
          <p className="text-on-surface-variant text-sm mt-1">Configure your room and push questions to students.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Excel buttons */}
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" ref={excelInputRef} onChange={handleExcelUpload} />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                const ws = XLSX.utils.aoa_to_sheet([["QuestionText", "CorrectAnswer", "WrongAnswer1", "WrongAnswer2", "WrongAnswer3"]]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Template");
                XLSX.writeFile(wb, "StudyChallenge_Template.xlsx");
              }}
              className="flex items-center justify-center p-3 rounded-xl hover:bg-black/5 text-[#107c41] transition-colors"
              title="Download Excel Template"
            >
              <span className="material-symbols-outlined text-xl">download</span>
            </button>
            <button
              onClick={() => excelInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold font-headline hover:scale-[1.02] transition-transform text-white flex-1"
              style={{ background: "#107c41", boxShadow: "0 4px 12px rgba(16,124,65,0.3)" }}
            >
              <span className="material-symbols-outlined text-sm">table</span>
              Import Excel
            </button>
          </div>

          {/* Session code / Start */}
          {sessionCode ? (
            <div className="flex items-center gap-2">
              <div className="px-6 py-3 rounded-xl font-bold font-headline w-full sm:w-auto text-center" style={{ background: "#f5e2ff", color: "#702ae1" }}>
                Join Code: <span className="text-2xl tracking-wider uppercase ml-2">{sessionCode}</span>
              </div>
              <button
                onClick={() => window.open(`/projection/${sessionCode}`, "_blank")}
                className="flex items-center justify-center p-3 rounded-xl hover:scale-110 transition-transform bg-black text-white shadow-xl"
                title="Open Big Screen Projector"
              >
                <span className="material-symbols-outlined">tv</span>
              </button>
            </div>
          ) : (
            <button
              onClick={createLiveSession}
              disabled={isCreatingSession}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold font-headline hover:scale-[1.02] transition-transform w-full sm:w-auto"
              style={{ background: "#fcdf46", color: "#5d5000", boxShadow: "0 4px 12px rgba(252,223,70,0.4)" }}
            >
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              {isCreatingSession ? "Creating..." : "Start Live Session"}
            </button>
          )}
        </div>
      </div>

      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-primary font-bold text-xs tracking-[0.2em] uppercase font-label">New Live Question</span>
          <h2 className="text-2xl md:text-4xl font-headline font-extrabold text-on-surface mt-1 tracking-tight">Craft Your Challenge</h2>
        </div>
        {/* Timer Selector */}
        <div className="flex items-center gap-2 p-2 rounded-2xl" style={{ background: "#faecff" }}>
          {[15, 30, 60, 90].map((t) => (
            <button
              key={t}
              onClick={() => setTimeLimitSecs(t)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={
                timeLimitSecs === t
                  ? { background: "#fff", color: "#702ae1", boxShadow: "0 2px 8px rgba(112,42,225,0.15)" }
                  : { color: "#69537b" }
              }
            >
              {t}s
            </button>
          ))}
        </div>
      </div>

      {/* ── Question Type Picker ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.entries(TYPE_META) as [QuestionType, typeof TYPE_META[QuestionType]][]).map(([type, meta]) => (
          <button
            key={type}
            onClick={() => switchType(type)}
            className="flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]"
            style={{
              borderColor:  questionType === type ? meta.color : "transparent",
              background:   questionType === type ? `${meta.color}15` : "#faecff",
              boxShadow:    questionType === type ? `0 4px 20px ${meta.color}30` : "none",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: questionType === type ? meta.color : "#edd3ff" }}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ color: questionType === type ? "#fff" : meta.color }}
              >
                {meta.icon}
              </span>
            </div>
            <div>
              <p className="font-headline font-bold text-base text-on-surface">{meta.label}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{meta.desc}</p>
            </div>
            {questionType === type && (
              <span
                className="material-symbols-outlined ml-auto text-xl"
                style={{ color: meta.color }}
              >
                check_circle
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Bento Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* Question Text — 8 cols */}
        <div
          className="col-span-12 lg:col-span-8 p-6 md:p-8 rounded-xl relative overflow-hidden group flex flex-col"
          style={{ background: "#f5e2ff", boxShadow: "0 20px 50px rgba(58,38,75,0.04)" }}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-xl" style={{ background: "#702ae1", opacity: 0.3 }} />
          <label className="block text-xs font-black text-on-surface-variant uppercase tracking-widest mb-4 font-label">Question Text</label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question here..."
            className="w-full flex-grow bg-transparent text-2xl md:text-3xl font-headline font-bold text-on-surface placeholder:text-outline/40 resize-none min-h-[120px] md:min-h-[160px] leading-snug"
            style={{ border: "none", outline: "none" }}
          />
          <div className="absolute -right-12 -bottom-12 opacity-[0.07] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <span className="material-symbols-outlined" style={{ fontSize: "12rem" }}>lightbulb</span>
          </div>
        </div>

        {/* Points Slider — 4 cols */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="p-8 rounded-xl flex flex-col justify-between" style={{ background: "#edd3ff" }}>
            <div>
              <label className="block text-xs font-black text-primary uppercase tracking-widest mb-6 font-label">Point Assignment</label>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl font-black text-on-surface">{points}</span>
                <span className="text-sm font-bold text-on-surface-variant">pts</span>
              </div>
              <input
                type="range"
                min={100} max={1000} step={100}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full h-2 rounded-full cursor-pointer appearance-none"
                style={{
                  background: `linear-gradient(to right, #702ae1 ${(points - 100) / 9}%, rgba(112,42,225,0.15) ${(points - 100) / 9}%)`,
                  accentColor: "#702ae1",
                }}
              />
            </div>
          </div>

          {/* Essay guidance note (only shown for essay type) */}
          {questionType === "essay" && (
            <div className="p-6 rounded-xl flex-1 flex flex-col" style={{ background: "#fff", border: "2px dashed #dcb8ff" }}>
              <label className="block text-xs font-black text-on-surface-variant uppercase tracking-widest mb-3 font-label">
                Essay Guidance (Optional)
              </label>
              <textarea
                value={essayNote}
                onChange={(e) => setEssayNote(e.target.value)}
                placeholder="Hint or model answer for professor reference..."
                className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-outline/40 resize-none min-h-[80px]"
                style={{ border: "none", outline: "none" }}
              />
            </div>
          )}

          {/* Info card for true/false */}
          {questionType === "true_false" && (
            <div className="p-6 rounded-xl flex-1 flex flex-col items-center justify-center gap-3" style={{ background: "#c7ffe3" }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: "#00694b" }}>rule</span>
              <p className="font-bold text-sm text-center" style={{ color: "#00694b" }}>
                True / False قائم بذاته
              </p>
              <p className="text-xs text-center" style={{ color: "#006146" }}>
                الخيارات ثابتة: صح أو خطأ. اختر الإجابة الصحيحة بالزر أدناه.
              </p>
            </div>
          )}

          {/* Info card for multiple choice */}
          {questionType === "multiple_choice" && (
            <div className="p-6 rounded-xl flex-1 flex flex-col items-center justify-center gap-3" style={{ background: "#ede9fe" }}>
              <span className="material-symbols-outlined text-4xl" style={{ color: "#702ae1" }}>ballot</span>
              <p className="font-bold text-sm text-center" style={{ color: "#702ae1" }}>
                أضف ما يصل إلى 8 خيارات
              </p>
              <p className="text-xs text-center" style={{ color: "#5b21b6" }}>
                فعّل الـ toggle للخيار الصحيح
              </p>
            </div>
          )}
        </div>

        {/* ── Answer Options ─────── (not shown for essay) */}
        {questionType !== "essay" && (
          <div className="col-span-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {options.map((opt, i) => {
                const color = OPTION_COLORS[i] || OPTION_COLORS[0];
                const isTF  = questionType === "true_false";
                return (
                  <div
                    key={opt.id}
                    className="p-6 rounded-xl flex items-center gap-4 group transition-all"
                    style={{
                      background: "#faecff",
                      boxShadow:  "0 2px 8px rgba(58,38,75,0.04)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(58,38,75,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(58,38,75,0.04)";
                    }}
                  >
                    {/* Letter badge */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
                      style={{ background: color.bg, color: color.text, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                    >
                      {opt.id}
                    </div>

                    {/* Text input (read-only for T/F) */}
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(opt.id, e.target.value)}
                      readOnly={isTF}
                      placeholder="Type answer choice..."
                      className="flex-1 bg-transparent text-lg font-bold text-on-surface placeholder:text-outline/40"
                      style={{ border: "none", outline: "none", cursor: isTF ? "default" : "text" }}
                    />

                    {/* Correct toggle */}
                    <button
                      onClick={() => toggleCorrect(opt.id)}
                      className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all"
                      style={{ background: opt.isCorrect ? "#00694b" : "#bda3d1" }}
                      title={opt.isCorrect ? "Correct answer" : "Mark as correct"}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all"
                        style={{ left: opt.isCorrect ? "calc(100% - 1.375rem)" : "0.125rem" }}
                      />
                    </button>

                    {/* Remove button (MC only, min 2 options) */}
                    {!isTF && options.length > 2 && (
                      <button
                        onClick={() => removeOption(opt.id)}
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                        title="Remove option"
                      >
                        <span className="material-symbols-outlined text-sm text-red-400">close</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add option (MC only) */}
            {questionType === "multiple_choice" && options.length < 8 && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={addOption}
                  className="flex items-center gap-2 px-6 py-2 rounded-full border-2 border-dashed border-primary text-primary hover:bg-primary/5 transition-colors font-bold text-sm"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Add Option
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Essay placeholder ────── */}
        {questionType === "essay" && (
          <div
            className="col-span-12 flex flex-col items-center justify-center py-14 rounded-2xl border-2 border-dashed gap-4"
            style={{ borderColor: "#dcb8ff", background: "#fdf4ff" }}
          >
            <span className="material-symbols-outlined text-6xl" style={{ color: "#b41340" }}>edit_note</span>
            <p className="font-headline font-bold text-xl text-on-surface">Essay Question</p>
            <p className="text-sm text-on-surface-variant text-center max-w-sm">
              الطلاب سيرون السؤال ويكتبون إجاباتهم على الورق أو في نظام منفصل.
              <br />لا يوجد تحقق تلقائي — التصحيح يدوي.
            </p>
          </div>
        )}

      </div>{/* end bento grid */}

      {/* ── Action Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between pt-4 gap-6">
        <div className="flex gap-3">
          <button
            onClick={handleSaveToBank}
            disabled={isSaving}
            className="w-full md:w-auto px-8 py-4 rounded-xl font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high font-headline disabled:opacity-50"
            style={{ background: "#edd3ff" }}
          >
            {isSaving ? "Saving..." : "Save to Bank"}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
          <p className="text-sm font-medium text-on-surface-variant whitespace-nowrap hidden sm:block">
            Ready to test your students?
          </p>
          <button
            onClick={handleLaunch}
            disabled={!questionText.trim()}
            className="w-full sm:w-auto group flex items-center justify-center gap-4 pl-8 md:pl-10 pr-4 md:pr-6 py-4 md:py-5 rounded-full font-black text-base md:text-lg font-headline text-on-primary transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            style={{
              background: launched
                ? "linear-gradient(135deg, #00694b, #86ffcd)"
                : "linear-gradient(135deg, #702ae1, #b28cff)",
              boxShadow: "0 15px 30px rgba(112,42,225,0.3)",
            }}
          >
            {launched
              ? "✓ Launched!"
              : questionQueue.length > 0
              ? `Launch (Q${currentQueueIndex + 1}/${questionQueue.length})`
              : "Launch Challenge Live"}
            <div
              className="w-10 h-10 md:w-12 md:h-12 rounded-full flex shrink-0 items-center justify-center group-hover:rotate-12 transition-transform"
              style={{ background: "#fcdf46", color: "#5d5000" }}
            >
              <span className="material-symbols-outlined shrink-0 text-xl md:text-2xl">bolt</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
