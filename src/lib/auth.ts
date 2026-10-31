export interface AuthUser {
  email: string;
  name: string;
  role?: string;
  company?: string;
  licenseNo?: string;
}

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:3001" : "");
const SESSION_KEY = "portsync-ftz-session";

export const DEFAULT_DEMO_USER: AuthUser = {
  email: "broker@portsync-ftz.io",
  name: "D. Tan",
  role: "Chief Verification Broker (PPJK Grade 3)",
  company: "PT Portsync Logistics Systems",
  licenseNo: "PPJK-BTM-0912-2026",
};

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: AuthUser) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    /* ignore storage quota errors */
  }
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json();
      if (data.ok && data.user) {
        setSession(data.user);
        return { ok: true };
      }
    }
  } catch {
    // Network or server unreachable - fall through to offline local session
  }

  // Graceful offline fallback for hackathon / static preview
  const localUser: AuthUser = {
    email: email.toLowerCase(),
    name: name || "Verified Operator",
    role: "Customs Broker",
    company: "PT Portsync Logistics Systems",
    licenseNo: "PPJK-BTM-DEMO-2026",
  };
  setSession(localUser);
  return { ok: true };
}

export async function logIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const data = await res.json();
      if (data.ok && data.user) {
        setSession(data.user);
        return { ok: true };
      }
    }
  } catch {
    // Network or server unreachable - fall through to offline local session
  }

  // Graceful offline fallback
  const user: AuthUser = {
    email: email.toLowerCase(),
    name: email.split("@")[0]?.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Customs Broker",
    role: "Verification Broker",
    company: "PT Portsync Logistics Systems",
    licenseNo: "PPJK-BTM-0912-2026",
  };
  setSession(user);
  return { ok: true };
}

export function demoLogIn(user: AuthUser = DEFAULT_DEMO_USER): AuthUser {
  setSession(user);
  return user;
}

export function logOut() {
  localStorage.removeItem(SESSION_KEY);
}
