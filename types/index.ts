// types/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript interfaces for the Study Challenge System.
// These mirror the Firestore document schemas 1:1.
// Import from "@/types" anywhere in the app.
// ─────────────────────────────────────────────────────────────────────────────

import type { Timestamp } from "firebase/firestore";

// ─── Roles ───────────────────────────────────────────────────────────────────
export type UserRole = "professor" | "student";

// ─── User (Collection: /users/{uid}) ─────────────────────────────────────────
export interface AppUser {
  uid:         string;     // = Firebase Auth UID (document ID)
  displayName: string;     // "Dr. Aris Thorne" or "Marcus V."
  email:       string;
  role:        UserRole;   // Determines which dashboard to show
  avatarUrl:   string;     // DiceBear generated URL
  createdAt:   Timestamp;
  totalPoints: number;     // Lifetime across all sessions
}

// ─── Session Status ───────────────────────────────────────────────────────────
export type SessionStatus = "waiting" | "active" | "ended";

// ─── Session (Collection: /sessions/{sessionId}) ──────────────────────────────
export interface Session {
  sessionId:         string;
  title:             string;       // "Advanced Quantum Physics — Module 3"
  professorId:       string;       // → users/{uid}
  professorName:     string;       // Denormalized to avoid extra read
  status:            SessionStatus;
  joinCode:          string;       // 6-char code, e.g. "QK4A7X"
  currentQuestionId: string | null; // The live question ID (null = none active)
  participantCount:  number;
  createdAt:         Timestamp;
  startedAt:         Timestamp | null;
  endedAt:           Timestamp | null;
}

// ─── Question ─────────────────────────────────────────────────────────────────
export type QuestionStatus = "draft" | "live" | "closed";

export interface AnswerOption {
  id:   "A" | "B" | "C" | "D";
  text: string;
}

// Sub-collection: /sessions/{sessionId}/questions/{questionId}
export interface Question {
  questionId:    string;
  text:          string;
  imageUrl:      string | null;
  options:       AnswerOption[];
  correctOption: string;          // "A" | "B" | "C" | "D"
  points:        number;          // 100–1000 (the slider from the professor UI)
  timeLimitSecs: number;          // e.g. 30
  status:        QuestionStatus;
  pushedAt:      Timestamp | null;
  order:         number;
}

// ─── Leaderboard Entry ────────────────────────────────────────────────────────
// Sub-collection: /sessions/{sessionId}/leaderboard/{userId}
// One doc per student per session. Document ID = userId.
export interface LeaderboardEntry {
  userId:          string;
  displayName:     string;   // Denormalized
  avatarUrl:       string;   // Denormalized
  totalScore:      number;   // Running total — updated via increment()
  streak:          number;   // Consecutive correct answers
  answeredCount:   number;
  lastAnsweredAt:  Timestamp;
}

// ─── Answer ───────────────────────────────────────────────────────────────────
// Root collection: /answers/{answerId} — enables cross-session analytics
export interface Answer {
  sessionId:      string;
  questionId:     string;
  userId:         string;
  selectedOption: string;
  isCorrect:      boolean;
  pointsEarned:   number;
  responseTimeMs: number;   // For future speed-bonus feature
  answeredAt:     Timestamp;
}
