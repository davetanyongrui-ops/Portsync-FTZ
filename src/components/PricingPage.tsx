import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Btn, Tag } from "./ui";
import { SiteFooter } from "./SiteFooter";
import type { Page } from "../App";

const PLANS = [
  {
    name: "Sandbox",
    price: "Free",
    cadence: "no account needed",
    blurb: "Evaluate the engine against the three preloaded consignments.",
    cta: "Open the terminal",
    page: "terminal" as Page,
    primary: false,
    features: [
      "Three preloaded invoices",
      "BTKI classification with confidence",
      "PPFTZ-01, 02 and 03 arithmetic",
      "CEISA JSON and XML export",
      "Runs entirely in the browser",
    ],
  },
  {
    name: "Broker",
    price: "$39",
    priceAlt: "$49",
    cadence: "per user / month, billed annually",
    blurb: "For a licensed PPJK desk preparing declarations every day.",
    cta: "Start a 14-day trial",
    page: "terminal" as Page,
    primary: true,
    features: [
      "Everything in Sandbox",
      "Unlimited document ingestion",
      "Saved consignments and audit history",
      "Pre-filing check templates",
      "Priority register updates on BTKI changes",
    ],
  },
  {
    name: "Facility",
    price: "Custom",
    cadence: "annual contract",
    blurb: "For manufacturers running their own in-house customs team.",
    cta: "Talk to us",
    page: "contact" as Page,
    primary: false,
    features: [
      "Everything in Broker",
      "Private deployment, your network",
      "ERP and masterlist integration",
      "Role-based access and signing trail",
      "Named compliance contact",
    ],
  },
];

const FAQ = [
  {
    q: "What is the legal basis for duty suspension in Batam?",
    a: "Government Regulation No. 41 of 2021 sets the KPBPB framework. Goods entering the zone have Bea Masuk, PPN and PPh 22 suspended while they remain inside the enclave; duty falls due on the share released to the customs area. The engine implements that split per line rather than as a blanket exemption.",
  },
  {
    q: "Can the exported XML go straight into CEISA 4.0?",
    a: "The document is shaped to the PPFTZ-01/4.2 interchange structure — element-per-value, CEISA4 namespace, permit elements per line — so it maps cleanly onto a gateway request body. It is not a signed declaration: submission still requires the licensed broker's electronic signature.",
  },
  {
    q: "What happens when the classifier is unsure?",
    a: "A line below 70% confidence raises a CLASS-LOW advisory and keeps the alternative headings visible in the editor. Nothing is blocked automatically, but the finding travels into the payload so the reviewer sees exactly which lines need a second look.",
  },
  {
    q: "Is my invoice uploaded anywhere?",
    a: "No. PDF text extraction, classification and duty arithmetic all run in the browser tab. This build has no upload endpoint, no analytics on document content, and stores only your theme preference.",
  },
];

export function PricingPage({
  onNavigate,
  onOpenLegal,
}: {
  onNavigate: (p: Page) => void;
  onOpenLegal?: (doc: "disclaimer" | "tos" | "privacy") => void;
}) {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="bg-paper">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1120px] px-5 pt-12 pb-8 sm:px-8">
          <div className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">Pricing</div>
          <h1 className="display mt-3 text-[32px] text-ink sm:text-[38px]">Priced per desk, not per declaration</h1>
          <p className="mt-3 max-w-[520px] text-[13px] leading-[1.65] text-ink-2">
            A declaration you have to redo costs more than the software. There is no per-filing fee and no charge for
            lines you drop from the filing set.
          </p>

          <div className="mt-6 inline-flex items-center rounded-[5px] border border-line bg-sunken p-[2px]">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`cursor-pointer rounded-[3px] px-2.5 py-1 text-[11.5px] transition-colors ${
                !annual ? "bg-surface font-medium text-ink ring-1 ring-line" : "text-ink-3 hover:text-ink"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`cursor-pointer rounded-[3px] px-2.5 py-1 text-[11.5px] transition-colors ${
                annual ? "bg-surface font-medium text-ink ring-1 ring-line" : "text-ink-3 hover:text-ink"
              }`}
            >
              Annual
            </button>
            <span className="px-1.5 font-mono text-[10px] text-ok">−20%</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8">
        <div className="grid overflow-hidden rounded-[7px] border border-line bg-surface lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <div
              key={p.name}
              className={`flex flex-col p-5 ${i < PLANS.length - 1 ? "border-b border-line lg:border-r lg:border-b-0" : ""} ${
                p.primary ? "bg-sunken/40" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-medium text-ink">{p.name}</span>
                {p.primary && <Tag tone="ok">recommended</Tag>}
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="display text-[30px] text-ink">{annual ? p.price : (p.priceAlt ?? p.price)}</span>
                {p.price !== "Custom" && p.price !== "Free" && (
                  <span className="text-[11px] text-ink-3">/mo</span>
                )}
              </div>
              <div className="mt-1 font-mono text-[10px] text-ink-3">{p.cadence}</div>
              <p className="mt-3 text-[11.5px] leading-[1.6] text-ink-2">{p.blurb}</p>

              <ul className="mt-5 flex-1 space-y-1.5 border-t border-line pt-4">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[11.5px] leading-[1.5] text-ink-2">
                    <span className="mt-[7px] size-[3px] shrink-0 rounded-full bg-line-strong" />
                    {f}
                  </li>
                ))}
              </ul>

              <Btn
                variant={p.primary ? "primary" : "secondary"}
                block
                className="mt-5"
                iconRight={ArrowRight}
                onClick={() => onNavigate(p.page)}
              >
                {p.cta}
              </Btn>
            </div>
          ))}
        </div>

        <p className="mt-3 font-mono text-[10px] text-ink-3">
          Prices in USD, excluding Indonesian VAT. The sandbox tier is the build you are looking at — no card, no signup.
        </p>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8">
          <div className="max-w-[720px]">
          <h2 className="text-[13px] font-medium text-ink">Questions that come up before a trial</h2>
          <div className="mt-4 border-t border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center gap-3 py-3 text-[12.5px] text-ink transition-colors hover:text-ink-2">
                  <span className="text-[10px] text-ink-3 transition-transform group-open:rotate-45">+</span>
                  {f.q}
                </summary>
                <p className="pb-3 pl-5 text-[11.5px] leading-[1.7] text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
          </div>
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} onOpenLegal={onOpenLegal} />
    </div>
  );
}
