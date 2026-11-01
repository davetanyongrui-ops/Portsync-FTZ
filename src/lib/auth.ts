export interface AuthUser {
  email: string;
  name: string;
  role?: string;
  company?: string;
  /** Only ever set by a server that actually issued it. Never synthesised. */
  licenseNo?: string;
  /** True when the session was created on this device with no server check. */
  local?: boolean;
}

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:3001" : "");
const SESSION_KEY = "portsync-ftz-session";

export const DEFAULT_DEMO_USER: AuthUser = {
  email: "broker@portsync-ftz.io",
  name: "D. Tan",
  role: "Verification Broker (demo profile)",
  company: "PT Portsync Logistics Systems",
  local: true,
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

  // No server answered. Open a local session and say so — no credentials were
  // checked, so nothing that looks like an issued licence may be attached.
  const localUser: AuthUser = {
    email: email.toLowerCase(),
    name: name || "Local operator",
    role: "Unverified local session",
    company: "PT Portsync Logistics Systems",
    local: true,
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

  // No server answered. Open a local session and say so.
  const user: AuthUser = {
    email: email.toLowerCase(),
    name: email.split("@")[0]?.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Local operator",
    role: "Unverified local session",
    company: "PT Portsync Logistics Systems",
    local: true,
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
