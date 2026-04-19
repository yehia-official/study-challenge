// components/shared/ProtectedRoute.tsx
// ─────────────────────────────────────────────────────────────────────────────
// A client-side route guard that enforces authentication and role-based access.
//
// How it works:
//   - While auth is loading → show a full-screen spinner (prevents flash of login)
//   - If not authenticated → redirect to /login
//   - If authenticated but wrong role → redirect to /unauthorized
//   - If authenticated and correct role → render children
//
// Usage:
//   <ProtectedRoute requiredRole="professor">
//     <ProfessorDashboard />
//   </ProtectedRoute>
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children:     ReactNode;
  /** If provided, user must have this exact role. If omitted, any authenticated user is allowed. */
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for Firebase to determine the current auth state
    if (loading) return;

    if (!user) {
      // Not authenticated — send to login
      router.replace("/login");
      return;
    }

    if (requiredRole && userProfile?.role !== requiredRole) {
      // Authenticated but accessing the wrong role's area
      router.replace("/unauthorized");
    }
  }, [user, userProfile, loading, requiredRole, router]);

  // ── Loading State ──────────────────────────────────────────────────────────
  // Show a Kinetic Playground spinner while auth resolves.
  // This prevents the brief flash of the login page for already-logged-in users.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fef3ff] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Animated gradient spinner */}
          <div
            className="w-16 h-16 rounded-full animate-spin"
            style={{
              background: "conic-gradient(from 0deg, #702ae1, #b28cff, #fef3ff)",
            }}
          />
          <p className="text-[#69537b] font-semibold text-sm tracking-wide">
            Loading Study Challenge...
          </p>
        </div>
      </div>
    );
  }

  // ── Not Authenticated ──────────────────────────────────────────────────────
  if (!user) {
    // Redirect is already queued in useEffect — render nothing to avoid flash
    return null;
  }

  // ── Wrong Role ─────────────────────────────────────────────────────────────
  if (requiredRole && userProfile?.role !== requiredRole) {
    return null;
  }

  // ── Authorized ────────────────────────────────────────────────────────────
  return <>{children}</>;
}
