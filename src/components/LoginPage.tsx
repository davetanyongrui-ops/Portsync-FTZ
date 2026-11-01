import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { DEFAULT_DEMO_USER, demoLogIn, logIn } from "../lib/auth";
import { REGISTER_SIZE } from "../data/tariff";
import { Btn, FIELD, Label } from "./ui";

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
    else setError(res.error || "Sign-in failed.");
  };

  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="hidden flex-col justify-between border-r border-line bg-sunken/50 p-10 lg:flex">
        <button
          type="button"
          onClick={() => onGuestAccess?.()}
          className="flex w-fit cursor-pointer items-center gap-2"
        >
          <span className="grid size-[22px] place-items-center rounded-[4px] bg-ink">
            <span className="display text-[13px] leading-none text-paper">P</span>
          </span>
          <span className="text-[13px] font-semibold text-ink">PortSync FTZ</span>
        </button>

        <div className="max-w-[380px]">
          <p className="display text-[26px] leading-[1.15] text-ink">
            The declaration is signed by a person, not by software.
          </p>
          <p className="mt-4 text-[12px] leading-[1.7] text-ink-2">
            Sign in to keep your consignments, overrides and filing history attached to a broker licence. Without an
            account the terminal still runs — nothing is saved between visits.
          </p>
          <dl className="mt-6 overflow-hidden rounded-[6px] border border-line bg-surface">
            {[
              ["Register", `BTKI 2022, ${REGISTER_SIZE} headings in this build`],
              ["Facility", "PPFTZ-01 / 02 / 03"],
              ["Output", "CEISA 4.0 JSON + XML"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line px-2.5 py-1.5 last:border-b-0">
                <dt className="font-mono text-[9.5px] tracking-[0.06em] text-ink-3 uppercase">{k}</dt>
                <dd className="text-right text-[10.5px] text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="font-mono text-[10px] leading-relaxed text-ink-3">
          KPBPB Batam · BCTMP Batu Ampar
          <br />
          sandbox build · no transmission
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[330px]">
          <div className="lg:hidden">
            <button type="button" onClick={() => onGuestAccess?.()} className="flex cursor-pointer items-center gap-2">
              <span className="grid size-[22px] place-items-center rounded-[4px] bg-ink">
                <span className="display text-[13px] leading-none text-paper">P</span>
              </span>
              <span className="text-[13px] font-semibold text-ink">PortSync FTZ</span>
            </button>
          </div>

          <h1 className="mt-6 text-[16px] font-medium tracking-[-0.01em] text-ink lg:mt-0">Sign in</h1>
          <p className="mt-1 text-[11.5px] text-ink-3">Broker workspace · any password works in this build</p>

          <button
            type="button"
            onClick={() => {
              demoLogIn(DEFAULT_DEMO_USER);
              onLoggedIn();
            }}
            className="mt-5 flex w-full cursor-pointer items-center gap-2.5 rounded-[5px] border border-line-strong bg-surface px-3 py-2.5 text-left transition-colors hover:border-ink-3"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-[3px] bg-sunken font-mono text-[9.5px] font-semibold text-ink-2">
              DT
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium text-ink">Continue as demo broker</span>
              <span className="block truncate font-mono text-[10px] text-ink-3">D. Tan · PPJK-BTM-0912-2026</span>
            </span>
            <ArrowRight size={13} className="shrink-0 text-ink-3" />
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="font-mono text-[9.5px] tracking-[0.08em] text-ink-3 uppercase">or email</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label htmlFor="l-email">
                <Label>Email</Label>
              </label>
              <input
                id="l-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="broker@company.id"
                className={`mt-1.5 ${FIELD}`}
              />
            </div>
            <div>
              <label htmlFor="l-pass">
                <Label>Password</Label>
              </label>
              <input
                id="l-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`mt-1.5 ${FIELD}`}
              />
            </div>

            {error && (
              <p className="rounded-[4px] border border-bad/30 bg-bad-soft px-2 py-1.5 text-[11px] text-bad">{error}</p>
            )}

            <Btn type="submit" variant="primary" block disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Btn>
          </form>

          <div className="mt-4 flex items-center justify-between text-[11px] text-ink-3">
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="cursor-pointer text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
            >
              Create an account
            </button>
            {onGuestAccess && (
              <button type="button" onClick={onGuestAccess} className="cursor-pointer hover:text-ink">
                Skip for now
              </button>
            )}
          </div>

          <p className="mt-6 border-t border-line pt-3 text-[10px] leading-[1.6] text-ink-3">
            By signing in you accept the{" "}
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
