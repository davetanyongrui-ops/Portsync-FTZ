export interface AuthUser {
  email: string;
  name: string;
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:3001";
const SESSION_KEY = "portsync-ftz-session";

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export async function signUp(name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return { ok: false, error: data.error || "Signup failed." };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function logIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return { ok: false, error: data.error || "Login failed." };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function logOut() {
  localStorage.removeItem(SESSION_KEY);
}