import type { LegalDoc } from "../data/legal";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { REGISTER_SIZE, TARIFF, TARIFF_FETCHED, TARIFF_SOURCE } from "../data/tariff";
import { fmtIdr, fmtUsd } from "../lib/format";
import { KPB } from "../data/constants";
import { Btn, Tag } from "./ui";
import { SiteFooter } from "./SiteFooter";
import type { Page } from "../App";

const STEPS = [
  {
    n: "01",
    title: "Drop your invoice in",
    body: "A PDF or a photo of a paper invoice. It is read entirely inside your browser — the file is never uploaded to anyone.",
  },
  {
    n: "02",
    title: "Every line gets classified",
    body: "Each item is matched to an Indonesian tariff heading, with a confidence score and the runner-up options visible so you can check or overrule.",
  },
  {
    n: "03",
    title: "See the tax in plain language",
    body: "What is taxable, what is not taxed inside the zone, and how much the legal relief is worth — plus how and why it applies.",
  },
  {
    n: "04",
    title: "Fix what OCR misread",
    body: "Wrong digit? Click the number in the table, type the correction, and every total recomputes instantly. Amber flags show exactly where to look.",
  },
];

const RULES = [
  ["LARTAS-PRE", "Blocks the PIB until the permit number is keyed into the licence block."],
  ["EXCISE-BLOCKED", "Bandrol goods (MMEA, ethyl alcohol) cannot claim the PPFTZ-01 exemption."],
  ["NON-PRODUCTION-ASSET", "Office furniture pays 15% BM + 11% PPN unless a BP Batam masterlist is attached."],
  ["SNI", "A mandatory standard without a certificate number on the source document."],
  ["BMAD", "Anti-dumping duty applies by origin and survives any release to the mainland."],
  ["TPBD", "Part of the line leaves the enclave, so only that share becomes payable."],
  ["CLASS-LOW", "Classifier confidence under 70% — the line is flagged for broker review."],
];

export function HomePage({
  onNavigate,
  onOpenLegal,
}: {
  onNavigate: (p: Page) => void;
  onOpenLegal?: (doc: LegalDoc) => void;
}) {
  const [cifInput, setCifInput] = useState(120000);
  const [dutyRate, setDutyRate] = useState(10);
  const kurs = 16200;

  // A real slice of the shipped register, so the hero shows genuine BTKI rates
  // rather than a re-drawn invoice. Fixed selection keeps the layout stable.
  const registerRows = useMemo(
    () => TARIFF.filter((e) => e.bmExact && e.bmMfn > 0).slice(0, 5),
    [],
  );

  const idrCif = cifInput * kurs;
  const bm = idrCif * (dutyRate / 100);
  const ppn = (idrCif + bm) * 0.11;
  const standard = bm + ppn;

  return (
    <div className="bg-paper">
      {/* ---------------------------------------------------------------- hero */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-10 px-5 pt-12 pb-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14 lg:pt-16 lg:pb-16">
          <div className="max-w-[560px]">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
              <span className="size-[5px] rounded-full bg-ok" />
              {KPB.region}
            </div>

            <h1 className="display mt-4 text-[34px] text-ink sm:text-[42px] lg:text-[46px]">
              What will this shipment
              <br />
              really cost at Batam?
              <br />
              <span className="text-ink-3">Drop the invoice. Know in seconds.</span>
            </h1>

            <p className="mt-5 max-w-[470px] text-[14px] leading-[1.65] text-ink-2">
              PortSync reads your supplier invoice, classifies every line against the Indonesian tariff book, and shows
              the duty story in plain language: what is taxable, what the Batam free zone legally removes, and what is
              left to pay — before anyone touches CEISA.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Btn
                variant="primary"
                iconRight={ArrowRight}
                onClick={() => onNavigate("terminal")}
              >
                Try it free — no account
              </Btn>
              <Btn variant="secondary" onClick={() => onNavigate("faq")}>
                How it works
              </Btn>
            </div>

            <p className="mt-5 font-mono text-[10.5px] leading-relaxed text-ink-3">
              Free · nothing is uploaded · AI-assisted estimates, not official figures — verify before you file
            </p>
          </div>

          {/* a real slice of the shipped register — genuine rates, no re-drawn document */}
          <div className="lg:pt-2">
            <div className="overflow-hidden rounded-[7px] border border-line bg-surface">
              <div className="flex items-center gap-2 border-b border-line bg-sunken/60 px-3 py-2">
                <span className="font-mono text-[10px] font-medium text-brand">BTKI 2022 register</span>
                <Tag className="ml-auto">{REGISTER_SIZE} headings</Tag>
              </div>

              <div className="divide-y divide-line">
                {registerRows.map((e) => (
                  <div key={e.hs} className="flex items-center gap-2.5 px-3 py-2">
                    <span className="shrink-0 font-mono text-[10.5px] font-semibold text-ink">{e.hs}</span>
                    <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2">{e.titleEn}</span>
                    <span className="tnum shrink-0 font-mono text-[10.5px] font-semibold text-brand">
                      {(e.bmMfn * 100).toFixed(e.bmMfn * 100 % 1 === 0 ? 0 : 1)}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-line px-3 py-2 font-mono text-[10px] text-ink-3">
                <span>MFN · applied rate</span>
                <span className="ml-auto">{TARIFF_FETCHED}</span>
              </div>
            </div>

            <div className="mt-2 flex items-start gap-2 font-mono text-[10px] leading-relaxed text-ink-3">
              <ArrowUpRight size={11} className="mt-[1px] shrink-0" />
              <span>
                Most-favoured-nation rates for Indonesia, sourced from {TARIFF_SOURCE}. Every line in a consignment is
                priced from its own heading against this table.
              </span>
            </div>
          </div>

          {/* illustration — decorative, and labelled as one */}
          <figure className="overflow-hidden rounded-[10px] border border-line lg:col-span-2">
            <img
              src="/img/hero-terminal.webp"
              alt="Illustration of a container terminal at golden hour: gantry cranes, a feeder vessel and stacked boxes"
              className="h-[220px] w-full object-cover sm:h-[300px] lg:h-[340px]"
            />
            <figcaption className="flex items-center gap-2 border-t border-line bg-surface px-4 py-2.5 font-mono text-[10px] tracking-[0.06em] text-ink-3">
              ILLUSTRATION · THE HARBOUR CORRIDOR THIS WORKBENCH FILES FOR
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ---------------------------------------------------------------- steps */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="font-mono text-[10px] tracking-[0.1em] text-ink-3">{s.n}</div>
                <div className="mt-2 text-[13px] font-medium text-ink">{s.title}</div>
                <p className="mt-1.5 text-[11.5px] leading-[1.6] text-ink-2">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ calculator */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <div>
            <div className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">Facility arithmetic</div>
            <h2 className="display mt-3 text-[26px] text-ink sm:text-[30px]">
              What staying inside the enclave is actually worth
            </h2>
            <p className="mt-3 max-w-[440px] text-[12.5px] leading-[1.65] text-ink-2">
              Duty and VAT are suspended while the goods remain in the KPBPB. Release any share to the mainland and only
              that share becomes payable — which is why the engine prices every line twice instead of applying a blanket
              exemption.
            </p>

            <div className="mt-6 max-w-[440px] space-y-5">
              <label className="block">
                <span className="flex items-baseline justify-between">
                  <span className="text-[11.5px] text-ink-2">Consignment CIF value</span>
                  <span className="tnum font-mono text-[11.5px] font-medium text-ink">{fmtUsd(cifInput)}</span>
                </span>
                <input
                  type="range"
                  min={5000}
                  max={250000}
                  step={5000}
                  value={cifInput}
                  onChange={(e) => setCifInput(Number(e.target.value))}
                  className="mt-2 w-full accent-[#17181a]"
                />
                <span className="mt-1 flex justify-between font-mono text-[9.5px] text-ink-3">
                  <span>$5,000</span>
                  <span>$250,000</span>
                </span>
              </label>

              <label className="block">
                <span className="flex items-baseline justify-between">
                  <span className="text-[11.5px] text-ink-2">Average MFN duty on the goods</span>
                  <span className="tnum font-mono text-[11.5px] font-medium text-ink">{dutyRate}% BM</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={2.5}
                  value={dutyRate}
                  onChange={(e) => setDutyRate(Number(e.target.value))}
                  className="mt-2 w-full accent-[#17181a]"
                />
                <span className="mt-1 flex justify-between font-mono text-[9.5px] text-ink-3">
                  <span>0% raw inputs</span>
                  <span>25% finished goods</span>
                </span>
              </label>
            </div>
          </div>

          <div className="self-start overflow-hidden rounded-[7px] border border-line bg-surface">
            {[
              ["Customs value in rupiah", fmtIdr(idrCif), ""],
              ["Bea masuk", fmtIdr(bm), ""],
              ["PPN 11% on value + duty", fmtIdr(ppn), ""],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between border-b border-line px-3 py-2.5">
                <span className="text-[11.5px] text-ink-2">{k}</span>
                <span className="tnum font-mono text-[11.5px] text-ink">{v}</span>
              </div>
            ))}
            {standard > 0 && (
              <div className="border-b border-line px-3 py-2.5">
                <div className="flex h-1.5 overflow-hidden rounded-full bg-sunken">
                  <div className="bg-ink" style={{ width: `${Math.min(100, (bm / standard) * 100)}%` }} />
                  <div className="min-w-[2px] flex-1 bg-line-strong" />
                </div>
                <div className="mt-1.5 flex items-center justify-between font-mono text-[9.5px] text-ink-3">
                  <span>bea masuk {dutyRate}%</span>
                  <span>PPN 11%</span>
                </div>
              </div>
            )}
            <div className="flex items-baseline justify-between bg-sunken px-3 py-2.5">
              <span className="text-[11.5px] font-medium text-ink">Payable at Tanjung Priok</span>
              <span className="tnum font-mono text-[12px] font-semibold text-ink">{fmtIdr(standard)}</span>
            </div>
            <div className="flex items-baseline justify-between px-3 py-3">
              <span className="text-[11.5px] font-medium text-ok">Retained in Batam</span>
              <span className="tnum font-mono text-[15px] font-semibold text-ok">−{fmtIdr(standard)}</span>
            </div>
            <p className="border-t border-line px-3 py-2 text-[10px] leading-relaxed text-ink-3">
              Illustrative at a flat {dutyRate}% duty. The terminal prices each line from its own heading and applies the
              release share separately.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- rules */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8">
          <div className="max-w-[520px]">
            <div className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">Compliance screening</div>
            <h2 className="display mt-3 text-[26px] text-ink sm:text-[30px]">It refuses to guess</h2>
            <p className="mt-3 text-[12.5px] leading-[1.65] text-ink-2">
              Every declaration carries a validation report. A finding is either blocking or advisory, and each one is
              traceable to a rule code you can quote back to a customs officer.
            </p>
          </div>

          <div className="mt-7 overflow-hidden rounded-[7px] border border-line">
            {RULES.map(([code, body], i) => (
              <div
                key={code}
                className={`grid gap-1 px-3 py-2.5 sm:grid-cols-[180px_1fr] sm:items-baseline sm:gap-4 ${
                  i < RULES.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <span className="font-mono text-[10.5px] font-medium text-ink">{code}</span>
                <span className="text-[11.5px] leading-[1.55] text-ink-2">{body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- honest */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1120px] px-5 py-12 sm:px-8">
          <div className="max-w-[560px]">
            <div className="font-mono text-[10px] tracking-[0.1em] text-warn uppercase">Read this before you trust it</div>
            <h2 className="display mt-3 text-[26px] text-ink sm:text-[30px]">An honest tool, stated plainly</h2>
            <p className="mt-3 text-[12.5px] leading-[1.65] text-ink-2">
              PortSync is independent and unofficial. It has no relationship with Indonesian Customs, BP Batam or any
              government body. Its results come from AI and automation — which make mistakes — and nothing here is a
              guarantee. What it is: a very fast first pass that shows its reasoning, flags what it cannot verify, and
              leaves the judgement to you.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-px overflow-hidden rounded-[7px] border border-line bg-line sm:grid-cols-3">
            {[
              {
                t: "Not official",
                b: "Not affiliated with, endorsed by, or working with DJBC, BP Batam, CEISA or any agency. No output is official.",
              },
              {
                t: "AI makes mistakes",
                b: "Misread digits and wrong tariff codes happen. Every line is cross-checked and flagged when figures don't reconcile.",
              },
              {
                t: "You stay in charge",
                b: "Correct any figure inline, override any code, and verify with a licensed broker before anything is filed.",
              },
            ].map((c) => (
              <div key={c.t} className="bg-surface p-4">
                <div className="text-[12.5px] font-medium text-ink">{c.t}</div>
                <p className="mt-1.5 text-[11.5px] leading-[1.65] text-ink-2">{c.b}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Btn size="sm" variant="secondary" onClick={() => onOpenLegal?.("disclaimer")}>
              Read the full disclaimer
            </Btn>
            <Btn size="sm" variant="secondary" onClick={() => onNavigate("about")}>
              What it does — and won't
            </Btn>
            <Btn size="sm" variant="secondary" onClick={() => onNavigate("faq")}>
              Common questions
            </Btn>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- close */}
      <section className="border-b border-line bg-ink">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-5 px-5 py-12 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[520px]">
            <div className="font-mono text-[10px] tracking-[0.1em] text-paper/60 uppercase">
              Nothing is transmitted · runs in your browser
            </div>
            <h2 className="display mt-3 text-[26px] text-paper sm:text-[30px]">Bring your own invoice</h2>
            <p className="mt-2.5 text-[12.5px] leading-[1.65] text-paper/70">
              Drop a supplier invoice into the terminal and watch it read, classify and price the consignment — the
              register, the rates and the engine all live in this page.
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
              onClick={() => onNavigate("pricing")}
              className="border-paper/30 bg-transparent text-paper hover:border-paper/60 hover:bg-paper/10"
            >
              Pricing
            </Btn>
          </div>
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} onOpenLegal={onOpenLegal} />
    </div>
  );
}
