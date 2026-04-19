"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchUserProfile, type UserProfile } from "@/services/authService";

interface AuthContextType {
  user: { uid: string } | null; // Keep structure mostly compatible
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const profile = await fetchUserProfile();
      setUserProfile(profile);
    } catch (err) {
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkAuth();

    // Listen for custom token events from authService
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, []);

  const value = {
    user: userProfile ? { uid: userProfile.uid } : null,
    userProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
