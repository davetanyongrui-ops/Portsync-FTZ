import { useState } from "react";
import { Anchor, LogIn, Sparkles, UserCheck } from "lucide-react";
import { logIn, demoLogIn, DEFAULT_DEMO_USER } from "../lib/auth";

export function LoginPage({
  onLoggedIn,
  onSwitchToSignup,
  onGuestAccess,
}: {
  onLoggedIn: () => void;
  onSwitchToSignup: () => void;
  onGuestAccess?: () => void;
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

  const handleDemoLogin = () => {
    demoLogIn(DEFAULT_DEMO_USER);
    onLoggedIn();
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-zinc-950 px-4 py-8 text-zinc-100 antialiased">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Anchor size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[17px] font-bold tracking-tight text-white flex items-center gap-2">
              PortSync FTZ
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-px font-mono text-[10px] text-emerald-400">
                v1.0
              </span>
            </div>
            <div className="text-[12px] text-zinc-400">Customs Broker &amp; Tariff Terminal</div>
          </div>
        </div>

        {/* 1-Click Instant Demo Login (Hackathon Winning Feature) */}
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} /> Hackathon Judge Quick Access
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">1-Click</span>
          </div>
          <p className="mt-1.5 text-[12px] text-zinc-300">
            Sign in immediately with the pre-verified Chief Customs Broker profile (KPBPB Batam license).
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-[13px] font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer active:scale-[0.98]"
          >
            <UserCheck size={16} /> Continue as Demo Broker (D. Tan)
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Or sign in with email</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-zinc-300">Email Address</label>
            <input
              type="email"
              required
              placeholder="broker@company.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 shadow-2xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-zinc-300">Password</label>
              <span className="text-[11px] text-zinc-500">Any password in demo mode</span>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 shadow-2xs focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-zinc-700 hover:border-zinc-600 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <LogIn size={15} /> {loading ? "Authenticating…" : "Sign in to Terminal"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-[12px] text-zinc-400 border-t border-zinc-800/80 pt-4">
          <span>No account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              Register team
            </button>
          </span>
          {onGuestAccess && (
            <button
              type="button"
              onClick={onGuestAccess}
              className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Continue as Guest →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
