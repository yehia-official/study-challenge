"use client";

import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/services/authService";
import Link from "next/link";
import { useState } from "react";

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const { userProfile } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", href: "/professor/dashboard", icon: "dashboard",   label: "Dashboard"     },
    { id: "questions", href: "/professor/questions", icon: "quiz",        label: "Resources"     },
    { id: "sessions",  href: "/professor/sessions",  icon: "play_circle", label: "Live Sessions" },
    { id: "analytics", href: "/professor/analytics", icon: "bar_chart",   label: "Analytics"     },
    { id: "settings",  href: "/professor/settings",  icon: "settings",    label: "Settings"      },
  ] as const;

  const SidebarContent = () => (
    <>
      <div className="px-8 mb-8 mt-4 lg:mt-0">
        <h1 className="text-2xl font-black text-primary italic font-headline">
          Professor Mode
        </h1>
        <p className="text-xs font-bold tracking-tight text-on-surface-variant font-label">
          Study Challenge Pro
        </p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ id, href, icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={id}
              href={href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-4 mx-4 px-6 py-3 rounded-full transition-all font-headline font-bold text-sm ${
                isActive 
                  ? "bg-primary/10 text-primary scale-100" 
                  : "text-on-surface-variant hover:text-primary hover:scale-[1.02]"
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 pb-2 mt-4 lg:mt-0">
        <Link href="/professor/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
          <button
            className="w-full py-4 rounded-full font-bold text-on-primary font-headline transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: "linear-gradient(135deg, #702ae1, #b28cff)",
              boxShadow:  "0 8px 20px rgba(112,42,225,0.28)",
            }}
          >
            Create New Quiz
          </button>
        </Link>
      </div>

      <div className="mt-2 px-8 flex items-center gap-3">
        <img
          src={userProfile?.avatarUrl ?? "https://api.dicebear.com/9.x/avataaars/svg?seed=prof"}
          alt="Profile"
          className="w-10 h-10 rounded-full"
          style={{ boxShadow: "0 4px 12px rgba(112,42,225,0.2)" }}
        />
        <div>
          <p className="text-sm font-bold text-on-surface">{userProfile?.displayName ?? "Professor"}</p>
          <p className="text-xs text-on-surface-variant">Senior Educator</p>
        </div>
      </div>
    </>
  );

  return (
    <ProtectedRoute requiredRole="professor">
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style>{`.material-symbols-outlined { font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24; font-family:'Material Symbols Outlined'; }`}</style>

      <div className="flex min-h-screen bg-surface font-body text-on-surface overflow-x-hidden">
        
        {/* Desktop Sidebar */}
        <aside
          className="hidden lg:flex h-screen w-72 sticky left-0 top-0 flex-col py-8 gap-2 z-50 shrink-0"
          style={{
            background:  "rgba(250,236,255,0.85)",
            backdropFilter: "blur(20px)",
            boxShadow:   "40px 0 60px -15px rgba(58,38,75,0.06)",
            borderRadius: "0 2rem 2rem 0",
          }}
        >
          <SidebarContent />
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setIsMobileMenuOpen(false)} 
            />
            <div className="relative w-72 max-w-[80vw] bg-[#faecff] h-full flex flex-col py-8 gap-2 shadow-2xl animate-in slide-in-from-left">
              <button 
                className="absolute top-4 right-4 text-on-surface-variant z-50 p-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* ── Main Content Area ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header
            className="flex justify-between items-center px-4 lg:px-10 py-5 w-full sticky top-0 z-40"
            style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)" }}
          >
            <div className="flex items-center gap-4 lg:gap-8">
              <button 
                className="lg:hidden p-2 -ml-2 text-primary"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <span className="material-symbols-outlined text-3xl">menu</span>
              </button>
              <span
                className="text-xl lg:text-2xl font-black tracking-tighter font-headline shrink-0"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Study Challenge
              </span>
              <div className="hidden lg:flex gap-6">
                <Link href="/professor/dashboard" className="text-on-surface-variant hover:text-primary font-headline font-semibold text-sm transition-colors">Classroom</Link>
                <Link href="/professor/questions" className="text-on-surface-variant hover:text-primary font-headline font-semibold text-sm transition-colors">Resources</Link>
                <Link href="/professor/analytics" className="text-on-surface-variant hover:text-primary font-headline font-semibold text-sm transition-colors">Reports</Link>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 shrink-0">
              <div className="flex items-center gap-1 lg:gap-3 text-on-surface-variant">
                <button className="material-symbols-outlined hover:text-primary transition-colors cursor-pointer p-2">notifications</button>
                <button
                  onClick={() => signOut()}
                  className="material-symbols-outlined hover:text-primary transition-colors cursor-pointer p-2"
                  title="Sign out"
                >
                  account_circle
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-10 w-full mx-auto max-w-full lg:max-w-7xl overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
