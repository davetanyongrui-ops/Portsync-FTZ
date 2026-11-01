import { useState } from "react";
import { signUp } from "../lib/auth";
import { Btn, FIELD, Label } from "./ui";

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
      setError("Use at least six characters.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await signUp(name, email, password);
    setLoading(false);
    if (res.ok) onSignedUp();
    else setError(res.error || "Could not create the account.");
  };

  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="hidden flex-col justify-between border-r border-line bg-sunken/50 p-10 lg:flex">
        <button type="button" onClick={onSwitchToLogin} className="flex w-fit cursor-pointer items-center gap-2">
          <span className="grid size-[22px] place-items-center rounded-[4px] bg-ink">
            <span className="display text-[13px] leading-none text-paper">P</span>
          </span>
          <span className="text-[13px] font-semibold text-ink">PortSync FTZ</span>
        </button>

        <div className="max-w-[380px]">
          <p className="display text-[26px] leading-[1.15] text-ink">One workspace per broker licence.</p>
          <p className="mt-4 text-[12px] leading-[1.7] text-ink-2">
            Consignments, overrides and the declaration history stay attached to the account, so a colleague picking up
            the desk can see why a line was classified the way it was.
          </p>
        </div>

        <div className="font-mono text-[10px] leading-relaxed text-ink-3">
          account records live in local storage in this build
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[330px]">
          <div className="lg:hidden">
            <button type="button" onClick={onSwitchToLogin} className="flex cursor-pointer items-center gap-2">
              <span className="grid size-[22px] place-items-center rounded-[4px] bg-ink">
                <span className="display text-[13px] leading-none text-paper">P</span>
              </span>
              <span className="text-[13px] font-semibold text-ink">PortSync FTZ</span>
            </button>
          </div>

          <h1 className="mt-6 text-[16px] font-medium tracking-[-0.01em] text-ink lg:mt-0">Create an account</h1>
          <p className="mt-1 text-[11.5px] text-ink-3">No card, no verification in this build</p>

          <form onSubmit={submit} className="mt-5 space-y-3.5">
            <div>
              <label htmlFor="s-name">
                <Label>Full name</Label>
              </label>
              <input
                id="s-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dewi Tan"
                className={`mt-1.5 ${FIELD}`}
              />
            </div>
            <div>
              <label htmlFor="s-email">
                <Label>Email</Label>
              </label>
              <input
                id="s-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="broker@company.id"
                className={`mt-1.5 ${FIELD}`}
              />
            </div>
            <div>
              <label htmlFor="s-pass">
                <Label>Password</Label>
              </label>
              <input
                id="s-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="at least six characters"
                className={`mt-1.5 ${FIELD}`}
              />
            </div>

            {error && (
              <p className="rounded-[4px] border border-bad/30 bg-bad-soft px-2 py-1.5 text-[11px] text-bad">{error}</p>
            )}

            <Btn type="submit" variant="primary" block disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Btn>
          </form>

          <div className="mt-4 text-[11px] text-ink-3">
            Already registered?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="cursor-pointer text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
            >
              Sign in
            </button>
          </div>

          <p className="mt-6 border-t border-line pt-3 text-[10px] leading-[1.6] text-ink-3">
            By registering you accept the{" "}
            <button
              type="button"
              onClick={() => onOpenLegal?.("tos")}
              className="cursor-pointer text-ink-2 underline decoration-line-strong underline-offset-2"
            >
              terms
            </button>
            , the{" "}
            <button
              type="button"
              onClick={() => onOpenLegal?.("privacy")}
              className="cursor-pointer text-ink-2 underline decoration-line-strong underline-offset-2"
            >
              trade data policy
            </button>{" "}
            and the{" "}
            <button
              type="button"
              onClick={() => onOpenLegal?.("disclaimer")}
              className="cursor-pointer text-ink-2 underline decoration-line-strong underline-offset-2"
            >
              statutory disclaimer
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
