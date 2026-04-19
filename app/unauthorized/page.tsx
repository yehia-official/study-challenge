// app/unauthorized/page.tsx
// Shown when a user tries to access a route for a different role.

"use client";

import Link from "next/link";
import { signOut } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

export default function UnauthorizedPage() {
  const { userProfile } = useAuth();

  const correctPath =
    userProfile?.role === "professor" ? "/professor/dashboard" : "/student/join";

  return (
    <div className="min-h-screen bg-kinetic-mesh flex items-center justify-center p-4">
      <div
        className="glass-panel rounded-xl p-10 text-center max-w-sm w-full ghost-border"
        style={{ boxShadow: "0 25px 60px rgba(58, 38, 75, 0.10)" }}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(180, 19, 64, 0.10)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#b41340" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>

        <h1 className="font-headline font-extrabold text-2xl text-on-surface mb-2">
          Access Restricted
        </h1>
        <p className="text-on-surface-variant text-sm mb-8">
          This area is not accessible with your current role.
        </p>

        <div className="space-y-3">
          {userProfile && (
            <Link
              href={correctPath}
              className="flex items-center justify-center w-full py-3.5 rounded-full font-headline font-bold text-on-primary text-sm transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #702ae1, #b28cff)" }}
            >
              Go to My Dashboard →
            </Link>
          )}
          <button
            onClick={() => signOut()}
            className="w-full py-3.5 rounded-full font-headline font-bold text-on-surface-variant text-sm bg-surface-container transition-all hover:bg-surface-container-high"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
