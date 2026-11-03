import { useState } from "react";
import { Scale } from "lucide-react";
import { Btn } from "./ui";
import type { Page } from "../App";

const KEY = "portsync-terms-accepted-v1";

export function termsAccepted(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * First-visit acceptance gate. Shown once before the terminal is usable;
 * the acceptance flag lives in local storage on the visitor's device.
 */
export function TermsGate({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [open, setOpen] = useState(!termsAccepted());
  if (!open) return null;

  const accept = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* private mode — accept for this session only */
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Terms acceptance"
        className="animate-rise w-full max-w-[560px] overflow-hidden rounded-[8px] border border-line bg-surface shadow-[var(--shadow-modal)]"
      >
        <div className="flex items-center gap-2.5 border-b border-line bg-sunken/50 px-4 py-3">
          <span className="grid size-7 place-items-center rounded-[5px] bg-ink">
            <Scale size={14} className="text-paper" strokeWidth={2} />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-ink">Before you use this tool</div>
            <div className="text-[10.5px] text-ink-3">Updated 3 November 2026 · takes 30 seconds</div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-4 text-[12.5px] leading-[1.7] text-ink-2">
          <ul className="space-y-2">
            {[
              <>Not official. PortSync is <strong className="font-medium text-ink">not affiliated with, endorsed by, or working with any government agency</strong> — including Indonesian Customs (DJBC), BP Batam, or the CEISA platform.</>,
              <>AI-generated. Every heading, figure and flag comes from <strong className="font-medium text-ink">artificial intelligence and automation, which make mistakes</strong> — misread digits, wrong tariff codes, missed lines.</>,
              <>No guarantee. The service is provided as-is <strong className="font-medium text-ink">without any warranty</strong> of accuracy or fitness. Verify every output against official sources and a licensed broker before you rely on it.</>,
              <>Your responsibility. By continuing you accept the terms and agree to <strong className="font-medium text-ink">indemnify the operator</strong> against any claim arising from your use of, or reliance on, this tool. Use wisely.</>,
            ].map((t, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-[9px] size-[5px] shrink-0 rounded-full bg-warn" />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <p className="text-[11.5px] text-ink-3">
            The full, binding versions live in the Legal Centre: disclaimer, terms of service, privacy &amp; trade data,
            and acceptable use.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-line px-4 py-3 sm:flex-row sm:items-center">
          <Btn variant="secondary" onClick={() => onNavigate("legal")}>
            Read the full disclaimer
          </Btn>
          <Btn variant="primary" onClick={accept} className="sm:ml-auto">
            I understand — continue
          </Btn>
        </div>
      </div>
    </div>
  );
}
