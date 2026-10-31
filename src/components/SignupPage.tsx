import { useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { signUp } from "../lib/auth";

export function SignupPage({
  onSignedUp,
  onSwitchToLogin,
  onOpenLegal,
}: {
  onSignedUp: () => void;
  onSwitchToLogin: () => void;
  onOpenLegal?: (doc: "disclaimer" | "tos" | "privacy") => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await signUp(name, email, password);
    setLoading(false);
    if (res.ok) onSignedUp();
    else setError(res.error || "Signup failed.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-800 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-slate-100 text-blue-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">PortSync FTZ</div>
            <div className="text-[12px] text-slate-500 dark:text-zinc-400">Create your workspace account</div>
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Full name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:opacity-60 cursor-pointer dark:bg-cyan-500 dark:text-zinc-950 dark:hover:bg-cyan-400"
          >
            <UserPlus size={15} /> {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <div className="mt-4 text-center text-[12px] text-slate-500 dark:text-zinc-400">
          Already have an account?{" "}
          <button type="button" onClick={onSwitchToLogin} className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer dark:text-cyan-400 dark:hover:text-cyan-300">
            Sign in
          </button>
        </div>

        <div className="mt-5 text-center text-[11px] leading-relaxed text-slate-500 dark:text-zinc-500 border-t border-slate-100 pt-3 dark:border-zinc-800/80">
          By registering, you agree to our{" "}
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