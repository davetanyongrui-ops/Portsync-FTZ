import { useEffect, useState } from "react";
import { ArrowRight, Scale } from "lucide-react";
import { ACCEPTABLE_USE, DISCLAIMER, LEGAL_META, LEGAL_UPDATED, PRIVACY, TOS, type LegalDoc, type LegalSection } from "../data/legal";
import { cn } from "../lib/cn";
import { Btn } from "./ui";
import { SiteFooter } from "./SiteFooter";
import type { Page } from "../App";

function Section({ s }: { s: LegalSection }) {
  return (
    <section className="mt-7 first:mt-0" id={`s-${s.n}`}>
      <h2 className="flex items-baseline gap-2.5 text-[14px] font-semibold tracking-[-0.01em] text-ink">
        <span className="font-mono text-[11px] font-medium text-ink-3">{s.n}</span>
        {s.title}
      </h2>
      <div
        className={cn(
          "mt-2.5 space-y-2.5 rounded-[6px] px-3.5 py-3 text-[12.5px] leading-[1.75] text-ink-2",
          s.tone === "warn" && "border border-warn/30 bg-warn-soft text-warn",
          s.tone === "ok" && "border border-ok/30 bg-ok-soft text-ok",
        )}
      >
        {s.paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {s.bullets && (
          <ul className={cn("space-y-1.5", s.tone && "text-current")}>
            {s.bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-[8px] size-[3px] shrink-0 rounded-full bg-current opacity-60" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const DOCS: Record<LegalDoc, LegalSection[]> = {
  disclaimer: DISCLAIMER,
  tos: TOS,
  privacy: PRIVACY,
  "acceptable-use": ACCEPTABLE_USE,
};

function docFromHash(): LegalDoc {
  const q = window.location.hash.split("?")[1] ?? "";
  const m = q.match(/doc=([a-z-]+)/);
  return (LEGAL_META.find((d) => d.id === m?.[1])?.id ?? "disclaimer") as LegalDoc;
}

export function LegalPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [doc, setDoc] = useState<LegalDoc>(docFromHash);

  useEffect(() => {
    const handler = () => setDoc(docFromHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const setDocInHash = (d: LegalDoc) => {
    window.location.hash = `#/legal?doc=${d}`;
    setDoc(d);
  };

  const meta = LEGAL_META.find((d) => d.id === doc)!;

  return (
    <div className="bg-paper">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1120px] px-5 pt-12 pb-8 sm:px-8">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
            <Scale size={12} strokeWidth={2} />
            Legal centre
          </div>
          <h1 className="display mt-3 max-w-[640px] text-[32px] text-ink sm:text-[38px]">
            The agreement, in plain language and in full
          </h1>
          <p className="mt-4 max-w-[560px] text-[13px] leading-[1.65] text-ink-2">
            PortSync is an independent tool, not affiliated with any government body. Its output comes from AI and
            automation, can be wrong, and carries no guarantee. The four documents below are binding when you use the
            service. Last updated {LEGAL_UPDATED}.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Legal documents" className="lg:sticky lg:top-4 lg:self-start">
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
            {LEGAL_META.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDocInHash(d.id)}
                className={cn(
                  "shrink-0 cursor-pointer rounded-[5px] px-2.5 py-2 text-left text-[12px] transition-colors lg:w-full",
                  doc === d.id
                    ? "bg-surface font-medium text-ink ring-1 ring-line"
                    : "text-ink-2 hover:text-ink",
                )}
              >
                {d.label}
                <span className="hidden text-[10.5px] font-normal text-ink-3 lg:block">{d.short}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 hidden rounded-[6px] border border-warn/30 bg-warn-soft px-3 py-2.5 text-[11px] leading-[1.65] text-warn lg:block">
            <strong className="font-semibold">In one line:</strong> not official, powered by AI, no guarantee, verify
            everything — by using the service you accept all four documents and indemnify the operator.
          </div>
        </nav>

        <article className="min-w-0">
          <div className="max-w-[72ch]">
            <h2 className="display text-[24px] text-ink sm:text-[28px]">{meta.title}</h2>

            {DOCS[doc].map((s) => (
              <Section key={s.n} s={s} />
            ))}

            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-5">
              <Btn variant="primary" iconRight={ArrowRight} onClick={() => onNavigate("terminal")}>
                Back to the terminal
              </Btn>
              <Btn variant="secondary" onClick={() => setDocInHash(doc === "disclaimer" ? "tos" : "disclaimer")}>
                {doc === "disclaimer" ? "Read the terms of service" : "Read the disclaimer"}
              </Btn>
            </div>
          </div>
        </article>
      </div>

      <SiteFooter onNavigate={onNavigate} onOpenLegal={() => setDocInHash("disclaimer")} />
    </div>
  );
}
