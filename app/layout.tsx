// app/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Root layout — wraps every page in the app.
// Responsibilities:
//   1. Load Google Fonts (Plus Jakarta Sans + Be Vietnam Pro) via next/font
//   2. Wrap the tree in <AuthProvider> so every page has auth context
//   3. Apply base HTML metadata (title, description)
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

// ── Font Loading ──────────────────────────────────────────────────────────────
// next/font automatically optimizes and self-hosts fonts — no external request
// at runtime, and no layout shift (CLS = 0).

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight:  ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",   // CSS variable for Tailwind font-headline
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight:  ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",     // CSS variable for Tailwind font-body
  display: "swap",
});

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title:       "Study Challenge System",
  description: "Real-time gamified learning platform for universities — create, compete, win.",
  keywords:    ["education", "gamification", "real-time", "quiz", "classroom"],
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // Attach font variables so CSS can reference --font-plus-jakarta and --font-be-vietnam
      className={`${plusJakartaSans.variable} ${beVietnamPro.variable}`}
    >
      <body>
        {/*
          AuthProvider must wrap the entire app so that:
          - useAuth() works in any client component
          - ProtectedRoute can read auth state
          - onAuthStateChanged listener is active from the very first render
        */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
