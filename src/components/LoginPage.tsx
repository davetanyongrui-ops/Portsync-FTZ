import { useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { logIn } from "../lib/auth";

export function LoginPage({
  onLoggedIn,
  onSwitchToSignup,
}: {
  onLoggedIn: () => void;
  onSwitchToSignup: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await logIn(email, password);
    setLoading(false);
    if (res.ok) onLoggedIn();
    else setError(res.error || "Login failed.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-slate-100 text-blue-600">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight text-slate-900">PortSync FTZ</div>
            <div className="text-[12px] text-slate-500">Sign in to your workspace</div>
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-600">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            <LogIn size={15} /> {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="mt-4 text-center text-[12px] text-slate-500">
          No account?{" "}
          <button type="button" onClick={onSwitchToSignup} className="font-medium text-blue-600 hover:text-blue-700">
            Create one
          </button>
        </div>
      </div>
    </div>
  );
}