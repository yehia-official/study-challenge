// app/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Root page — smart redirect based on auth state.
//
// Behavior:
//   - Loading     → show spinner
//   - Not logged in → redirect to /login
//   - Professor   → redirect to /professor/dashboard
//   - Student     → redirect to /student/join
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RootPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (userProfile?.role === "professor") {
      router.replace("/professor/dashboard");
    } else if (userProfile?.role === "student") {
      router.replace("/student/join");
    } else {
      // User is authenticated but has no Firestore profile (e.g. DB fetch failed)
      // Send them to unauthorized so they aren't stuck on the loading spinner forever,
      // and they can sign out from there.
      router.replace("/unauthorized");
    }
  }, [user, userProfile, loading, router]);

  // Full-screen Kinetic Playground loading animation
  return (
    <div className="min-h-screen bg-kinetic-mesh flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing brand mark */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-primary opacity-20 animate-ping absolute inset-0" />
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #702ae1, #b28cff)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="font-headline font-black text-xl text-on-surface tracking-tight">
            Study Challenge
          </p>
          <p className="text-on-surface-variant text-sm mt-1">
            Preparing your arena...
          </p>
        </div>
      </div>
    </div>
  );
}
