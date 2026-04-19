// app/(auth)/register/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Register page — Kinetic Playground design system.
// Creates a Firebase Auth account + Firestore user document with a role.
// The role selector (Professor / Student) is the key UI feature here.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/services/authService";
import type { UserRole } from "@/types";

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [role,        setRole]        = useState<UserRole>("student");
  const [error,       setError]       = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Client-side validation before hitting Firebase
    if (displayName.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, role, displayName.trim());
      // Auth state change triggers AuthContext → fetches profile → root page redirects
      router.replace(role === "professor" ? "/professor/dashboard" : "/student/join");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-kinetic-mesh flex items-center justify-center p-4 py-12">

      {/* ── Decorative orbs ──────────────────────────────────────────── */}
      <div
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(112, 42, 225, 0.10)" }}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(0, 105, 75, 0.06)" }}
        aria-hidden="true"
      />

      <div className="w-full max-w-lg relative">

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #702ae1, #b28cff)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">
            Join the Challenge
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Create your free{" "}
            <span className="font-semibold gradient-text">Study Challenge</span>{" "}
            account
          </p>
        </div>

        {/* Register Card */}
        <div
          className="glass-panel rounded-xl p-8 ghost-border"
          style={{ boxShadow: "0 25px 60px rgba(58, 38, 75, 0.10)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* ── Role Selector — The key feature ──────────────────── */}
            <div className="space-y-2">
              <p className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                I am a...
              </p>
              <div className="grid grid-cols-2 gap-3">

                {/* Student Card */}
                <button
                  id="role-student-btn"
                  type="button"
                  onClick={() => setRole("student")}
                  className="relative p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: role === "student" ? "#f5e2ff" : "rgba(255,255,255,0.60)",
                    boxShadow: role === "student"
                      ? "0 0 0 2px #702ae1, 0 8px 20px rgba(112,42,225,0.15)"
                      : "0 2px 8px rgba(58,38,75,0.06)",
                  }}
                  aria-pressed={role === "student"}
                >
                  {/* Active indicator dot */}
                  {role === "student" && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{
                      background: role === "student"
                        ? "linear-gradient(135deg, #702ae1, #b28cff)"
                        : "#edd3ff",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke={role === "student" ? "white" : "#702ae1"}
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <p className="font-headline font-bold text-sm text-on-surface">Student</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Join sessions & answer challenges</p>
                </button>

                {/* Professor Card */}
                <button
                  id="role-professor-btn"
                  type="button"
                  onClick={() => setRole("professor")}
                  className="relative p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: role === "professor" ? "#f5e2ff" : "rgba(255,255,255,0.60)",
                    boxShadow: role === "professor"
                      ? "0 0 0 2px #702ae1, 0 8px 20px rgba(112,42,225,0.15)"
                      : "0 2px 8px rgba(58,38,75,0.06)",
                  }}
                  aria-pressed={role === "professor"}
                >
                  {role === "professor" && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{
                      background: role === "professor"
                        ? "linear-gradient(135deg, #702ae1, #b28cff)"
                        : "#edd3ff",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke={role === "professor" ? "white" : "#702ae1"}
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <path d="M8 21h8M12 17v4"/>
                    </svg>
                  </div>
                  <p className="font-headline font-bold text-sm text-on-surface">Professor</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Create sessions & push challenges</p>
                </button>

              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-name"
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest"
              >
                {role === "professor" ? "Full Name / Title" : "Display Name"}
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={role === "professor" ? "e.g. Dr. Aris Thorne" : "e.g. Marcus V."}
                className="w-full rounded-DEFAULT px-4 py-3.5 text-sm font-medium text-on-surface placeholder:text-outline bg-surface-container-low transition-all"
                style={{ border: "none", outline: "none" }}
                onFocus={(e) => e.target.style.boxShadow = "0 0 0 4px rgba(112, 42, 225, 0.15)"}
                onBlur={(e)  => e.target.style.boxShadow = "none"}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest"
              >
                Email Address
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full rounded-DEFAULT px-4 py-3.5 text-sm font-medium text-on-surface placeholder:text-outline bg-surface-container-low transition-all"
                style={{ border: "none", outline: "none" }}
                onFocus={(e) => e.target.style.boxShadow = "0 0 0 4px rgba(112, 42, 225, 0.15)"}
                onBlur={(e)  => e.target.style.boxShadow = "none"}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-password"
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest"
              >
                Password
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-DEFAULT px-4 py-3.5 text-sm font-medium text-on-surface placeholder:text-outline bg-surface-container-low transition-all"
                style={{ border: "none", outline: "none" }}
                onFocus={(e) => e.target.style.boxShadow = "0 0 0 4px rgba(112, 42, 225, 0.15)"}
                onBlur={(e)  => e.target.style.boxShadow = "none"}
              />
              <p className="text-[11px] text-on-surface-variant pl-1">
                Minimum 6 characters
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-DEFAULT px-4 py-3 text-sm font-medium"
                style={{ background: "rgba(180, 19, 64, 0.10)", color: "#b41340" }}
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {/* CTA — context-aware label */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full font-headline font-bold text-base tracking-tight transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: loading
                  ? "#856e98"
                  : role === "professor"
                    ? "linear-gradient(135deg, #702ae1, #b28cff)"
                    : "linear-gradient(135deg, #702ae1, #b28cff)",
                color: "#f8f0ff",
                boxShadow: loading ? "none" : "0 15px 30px rgba(112, 42, 225, 0.28)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Creating account...
                </span>
              ) : role === "professor" ? (
                "Create Professor Account →"
              ) : (
                "Join as Student →"
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-outline-variant opacity-30" />
            <span className="text-xs text-on-surface-variant font-medium">or</span>
            <div className="flex-1 h-px bg-outline-variant opacity-30" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline underline-offset-2 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-outline mt-6">
          By creating an account, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
