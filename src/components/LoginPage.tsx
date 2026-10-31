import { useState } from "react";
import { Anchor, LogIn, Sparkles, UserCheck } from "lucide-react";
import { logIn, demoLogIn, DEFAULT_DEMO_USER } from "../lib/auth";

export function LoginPage({
  onLoggedIn,
  onSwitchToSignup,
  onGuestAccess,
  onOpenLegal,
}: {
  onLoggedIn: () => void;
  onSwitchToSignup: () => void;
  onGuestAccess?: () => void;
  onOpenLegal?: (doc: "disclaimer" | "tos" | "privacy") => void;
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
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-800 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl border border-blue-500/30 bg-blue-50 text-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.15)] dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400">
            <Anchor size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[17px] font-bold tracking-tight text-slate-900 flex items-center gap-2 dark:text-white">
              PortSync FTZ
              <span className="rounded border border-emerald-500/30 bg-emerald-50 px-1.5 py-px font-mono text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                v1.0
              </span>
            </div>
            <div className="text-[12px] text-slate-500 dark:text-zinc-400">Customs Broker &amp; Tariff Terminal</div>
          </div>
        </div>

        {/* 1-Click Instant Demo Login (Hackathon Winning Feature) */}
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-50/70 p-4 shadow-sm dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 uppercase tracking-wider dark:text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} /> Hackathon Judge Quick Access
            </span>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">1-Click</span>
          </div>
          <p className="mt-1.5 text-[12px] text-slate-700 dark:text-zinc-300">
            Sign in immediately with the pre-verified Chief Customs Broker profile (KPBPB Batam license).
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-md hover:bg-emerald-500 transition-all cursor-pointer active:scale-[0.98] dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
          >
            <UserCheck size={16} /> Continue as Demo Broker (D. Tan)
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">Or sign in with email</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Email Address</label>
            <input
              type="email"
              required
              placeholder="broker@company.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-cyan-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Password</label>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">Any password in demo mode</span>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 shadow-2xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-cyan-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-50 px-3 py-2 text-[12px] text-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-xs hover:bg-slate-200 transition-colors disabled:opacity-60 cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
          >
            <LogIn size={15} /> {loading ? "Authenticating…" : "Sign in to Terminal"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-[12px] text-slate-500 border-t border-slate-200 pt-4 dark:border-zinc-800/80 dark:text-zinc-400">
          <span>No account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              Register team
            </button>
          </span>
          {onGuestAccess && (
            <button
              type="button"
              onClick={onGuestAccess}
              className="text-slate-500 hover:text-slate-800 cursor-pointer dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Continue as Guest →
            </button>
          )}
        </div>

        <div className="mt-5 text-center text-[11px] leading-relaxed text-slate-500 dark:text-zinc-500 border-t border-slate-100 pt-3 dark:border-zinc-800/80">
          By signing in, you agree to our{" "}
          <button
            type="button"
            onClick={() => onOpenLegal?.("tos")}
            className="text-slate-700 underline hover:text-blue-600 dark:text-zinc-300 dark:hover:text-cyan-300 cursor-pointer"
          >
            Terms of Service
          </button>
          ,{" "}
          <button
            type="button"
            onClick={() => onOpenLegal?.("privacy")}
            className="text-slate-700 underline hover:text-blue-600 dark:text-zinc-300 dark:hover:text-cyan-300 cursor-pointer"
          >
            Privacy Policy
          </button>
          , and{" "}
          <button
            type="button"
            onClick={() => onOpenLegal?.("disclaimer")}
            className="text-slate-700 underline hover:text-blue-600 dark:text-zinc-300 dark:hover:text-cyan-300 cursor-pointer"
          >
            Statutory Disclaimer
          </button>
          .
        </div>
      </div>
    </div>
  );
}
