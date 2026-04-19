// app/(auth)/login/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Login page — Kinetic Playground design system.
// Email + Password auth via Firebase Auth.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

// ── Metadata for this route ───────────────────────────────────────────────────
// Note: export const metadata doesn't work in client components.
// SEO for auth pages is handled via the default layout metadata.

export default function LoginPage() {
  const router  = useRouter();
  const { userProfile } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  // If already logged in, redirect immediately
  if (userProfile?.role === "professor") router.replace("/professor/dashboard");
  if (userProfile?.role === "student")   router.replace("/student/join");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      // onAuthStateChanged in AuthContext will fire → userProfile will populate
      // → the useEffect above redirects to the correct dashboard
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-kinetic-mesh flex items-center justify-center p-4">

      {/* ── Decorative floating orbs ─────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(178, 140, 255, 0.15)" }}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "rgba(252, 223, 70, 0.10)" }}
        aria-hidden="true"
      />

      {/* ── Login Card ───────────────────────────────────────────────── */}
      <div className="w-full max-w-md relative">

        {/* Brand Header */}
        <div className="text-center mb-8">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #702ae1, #b28cff)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>

          <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">
            Welcome back
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Sign in to your{" "}
            <span className="font-semibold gradient-text">Study Challenge</span>{" "}
            account
          </p>
        </div>

        {/* Glassmorphism Card */}
        <div
          className="glass-panel rounded-xl p-8 ghost-border"
          style={{ boxShadow: "0 25px 60px rgba(58, 38, 75, 0.10)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest"
              >
                Email Address
              </label>
              <input
                id="login-email"
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
                htmlFor="login-password"
                className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-DEFAULT px-4 py-3.5 text-sm font-medium text-on-surface placeholder:text-outline bg-surface-container-low transition-all"
                style={{ border: "none", outline: "none" }}
                onFocus={(e) => e.target.style.boxShadow = "0 0 0 4px rgba(112, 42, 225, 0.15)"}
                onBlur={(e)  => e.target.style.boxShadow = "none"}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="rounded-DEFAULT px-4 py-3 text-sm font-medium text-on-error"
                style={{ background: "rgba(180, 19, 64, 0.12)", color: "#b41340" }}
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full font-headline font-bold text-on-primary text-base tracking-tight transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: loading
                  ? "#856e98"
                  : "linear-gradient(135deg, #702ae1, #b28cff)",
                boxShadow: loading ? "none" : "0 15px 30px rgba(112, 42, 225, 0.30)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In →"
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-outline-variant opacity-30" />
            <span className="text-xs text-on-surface-variant font-medium">or</span>
            <div className="flex-1 h-px bg-outline-variant opacity-30" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-primary hover:underline underline-offset-2 transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>

        {/* Footer tagline */}
        <p className="text-center text-xs text-outline mt-6">
          Real-time classroom challenges · Built for universities
        </p>
      </div>
    </div>
  );
}
