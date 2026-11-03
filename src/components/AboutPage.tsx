import type { LegalDoc } from "../data/legal";
import { ArrowRight, Bot, Building2, Eye, ShieldCheck } from "lucide-react";
import { Btn, Tag } from "./ui";
import { SiteFooter } from "./SiteFooter";
import { REGISTER_SIZE, TARIFF_SOURCE } from "../data/tariff";
import type { Page } from "../App";

const HONEST = [
  {
    icon: Building2,
    title: "Not affiliated with anyone official",
    body: "PortSync is an independent private project. It is not operated by, endorsed by, or in partnership with Indonesian Customs (DJBC), BP Batam, the Ministry of Finance, CEISA 4.0, or any government body or broker. Nothing here is official.",
  },
  {
    icon: Bot,
    title: "Powered by AI — which makes mistakes",
    body: "Document reading and classification are automated systems. They misread skewed photos, drop faint lines, and pick plausible-but-wrong tariff codes. We engineer against it and flag what we can detect — but an unflagged figure is not a verified figure.",
  },
  {
    icon: ShieldCheck,
    title: "No guarantee, ever",
    body: "Everything is provided as-is with no warranty of accuracy, completeness or fitness. The rates are a 2022 snapshot of " + TARIFF_SOURCE + ", not a live customs feed. An officer may rule differently on the same goods.",
  },
  {
    icon: Eye,
    title: "You verify, you decide, you own it",
    body: "The tool drafts; humans decide. Every classification can be overridden, every figure can be corrected inline, and any declaration must be signed and filed under a licensed broker's or importer's own responsibility.",
  },
];

export function AboutPage({
  onNavigate,
  onOpenLegal,
}: {
  onNavigate: (p: Page) => void;
  onOpenLegal?: (doc: LegalDoc) => void;
}) {
  return (
    <div className="bg-paper">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1120px] px-5 pt-12 pb-8 sm:px-8">
          <div className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">About</div>
          <h1 className="display mt-3 max-w-[640px] text-[32px] text-ink sm:text-[38px]">
            A fast first pass on customs duty — and honest about what it is
          </h1>
          <p className="mt-4 max-w-[580px] text-[13px] leading-[1.7] text-ink-2">
            PortSync exists because the first question after an invoice lands is always the same —{" "}
            <em>what is this shipment actually going to cost at Batam?</em> — and answering it by hand means a tariff
            book, a rate table, a kurs figure and a calculator for every line. The tool does the drudgery; you keep the
            judgement.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <Tag>{REGISTER_SIZE} BTKI 2022 subheadings</Tag>
            <Tag>PPFTZ-01 arithmetic</Tag>
            <Tag>ACFTA · ATIGA · IJEPA</Tag>
            <Tag tone="warn">independent · unofficial</Tag>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8">
          <div className="max-w-[560px]">
            <h2 className="display text-[24px] text-ink sm:text-[28px]">Four things to know before you trust it</h2>
            <p className="mt-2.5 text-[12.5px] leading-[1.65] text-ink-2">
              This is the page we would want you to read twice. It is also binding when you use the tool — the full
              versions live in the Legal Centre.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-px overflow-hidden rounded-[7px] border border-line bg-line sm:grid-cols-2">
            {HONEST.map((h) => (
              <div key={h.title} className="bg-surface p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-[5px] bg-sunken text-ink-2">
                    <h.icon size={14} strokeWidth={1.9} />
                  </span>
                  <span className="text-[13px] font-medium text-ink">{h.title}</span>
                </div>
                <p className="mt-2.5 text-[12px] leading-[1.7] text-ink-2">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="text-[14px] font-semibold text-ink">What it does well</h2>
            <ul className="mt-3 space-y-2">
              {[
                "Reads digital PDF invoices almost perfectly, and recovers most of a clean scan.",
                "Prices every line at MFN and under the free-zone facility, side by side.",
                "Shows the legal reduction and explains exactly which mechanism produces it.",
                "Cross-checks every line (qty × price vs the printed amount) and flags what does not reconcile.",
                "Lets you correct any figure inline and watch every total recompute.",
                "Never uploads your document anywhere — the whole pipeline runs in your browser.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-[12.5px] leading-[1.65] text-ink-2">
                  <span className="mt-[8px] size-[4px] shrink-0 rounded-full bg-ok" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-ink">What it will not do</h2>
            <ul className="mt-3 space-y-2">
              {[
                "Guarantee any figure, heading or total — treat everything as a draft.",
                "Replace a licensed customs broker (PPJK) or the determination of a customs officer.",
                "File, sign or transmit anything to CEISA or any government system.",
                "Classify goods outside its register — those are flagged, never guessed.",
                "Read a crumpled, blurry or folded photo reliably — no OCR on earth can.",
                "Take responsibility for what you file. That responsibility is yours, contractually and legally.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 text-[12.5px] leading-[1.65] text-ink-2">
                  <span className="mt-[8px] size-[4px] shrink-0 rounded-full bg-warn" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-ink">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-5 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[520px]">
            <div className="font-mono text-[10px] tracking-[0.1em] text-paper/60 uppercase">No account · nothing transmitted</div>
            <h2 className="display mt-3 text-[26px] text-paper sm:text-[30px]">Try it on your own invoice</h2>
            <p className="mt-2.5 text-[12.5px] leading-[1.65] text-paper/70">
              The terminal is free, anonymous, and leaves nothing behind. Bring a document, get an estimate, verify it
              with a professional.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn
              variant="secondary"
              iconRight={ArrowRight}
              onClick={() => onNavigate("terminal")}
              className="border-paper/30 bg-transparent text-paper hover:border-paper/60 hover:bg-paper/10"
            >
              Open the terminal
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => onOpenLegal?.("disclaimer")}
              className="border-paper/30 bg-transparent text-paper hover:border-paper/60 hover:bg-paper/10"
            >
              Read the disclaimer
            </Btn>
          </div>
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} onOpenLegal={onOpenLegal} />
    </div>
  );
}
