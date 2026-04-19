// services/authService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Node.js Backend Auth Service
// Replaces Firebase Auth. Handles JWT login/register.
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api/auth';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: "professor" | "student";
  avatarUrl: string;
  totalPoints?: number;
}

export async function signUp(
  email: string,
  pass: string,
  role: "professor" | "student",
  name: string
): Promise<void> {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass, role, displayName: name })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  // Store JWT in localStorage
  localStorage.setItem('token', data.token);
  // Dispatch a custom event to notify AuthContext to refresh
  window.dispatchEvent(new Event('auth-change'));
}

export async function signIn(email: string, pass: string): Promise<void> {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }

  localStorage.setItem('token', data.token);
  window.dispatchEvent(new Event('auth-change'));
}

export async function signOut(): Promise<void> {
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('auth-change'));
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
      }
      return null;
    }

    const data = await res.json();
    return data.profile;
  } catch (err) {
    console.error('Failed to fetch user profile via API', err);
    return null;
  }
}

// Keep a simple mapping function so the UI doesn't crash if it expects mapped errors
export function mapAuthError(code: string): string {
  if (code.includes('fail') || code.includes('Email already exists')) {
    return "This email is already in use.";
  }
  if (code.includes('Invalid credentials')) {
    return "Incorrect email or password.";
  }
  return code;
}
