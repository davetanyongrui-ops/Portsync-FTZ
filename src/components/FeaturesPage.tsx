import type { LegalDoc } from "../data/legal";
import { ArrowRight } from "lucide-react";
import { Btn, Tag } from "./ui";
import { SiteFooter } from "./SiteFooter";
import { KPB } from "../data/constants";
import type { Page } from "../App";

interface Block {
  id: string;
  label: string;
  title: string;
  body: string;
  specs: [string, string][];
}

const BLOCKS: Block[] = [
  {
    id: "classification",
    label: "01 — Classification",
    title: "Every line gets a heading, a score and a rejected alternative",
    body:
      "Supplier descriptions are written for a buyer, not a tariff schedule. The matcher normalises the text, resolves it against the reference BTKI register and keeps the runners-up visible so a broker can see why a code was chosen — or overrule it in one click.",
    specs: [
      ["Output", "8-digit BTKI heading, dotted display and compact form"],
      ["Evidence", "Confidence score plus the alternatives that were rejected"],
      ["Override", "Any registered code, recomputed instantly across duty and VAT"],
      ["Fallback", "Unmatched text stays in the filing set and is flagged, never silently dropped"],
    ],
  },
  {
    id: "facility",
    label: "02 — Facility arithmetic",
    title: "Two duty computations per line, not one exemption flag",
    body:
      "The engine keeps the MFN assessment and the facility assessment side by side. That is what makes a partial release legible: 25% of a line leaving the enclave produces 25% of that line's duty, and nothing else changes.",
    specs: [
      ["Regimes", "PPFTZ-01 entry, PPFTZ-02 zone-to-zone, PPFTZ-03 mainland release"],
      ["Base", "Customs value = CIF; BM and BMAD on value, PPN on value + duty"],
      ["Excise", "Cukai goods are ineligible for the facility and keep their own MFN rate — 30% on ethyl alcohol"],
      ["Assets", "Non-production goods sit at 15% BM + 11% PPN unless a masterlist is applied"],
    ],
  },
  {
    id: "compliance",
    label: "03 — Screening",
    title: "Findings are blocking or advisory, and always quotable",
    body:
      "Before export, each line runs through the restriction rules that decide whether a declaration can even be submitted. Every finding carries a stable code, the position that triggered it and a sentence you can paste into a broker note.",
    specs: [
      ["Blocking", "Pre-border lartas, excise ineligibility, an empty filing set"],
      ["Advisory", "Post-border lartas, SNI, anti-dumping by origin, low classifier confidence"],
      ["Preference", "ATIGA Form D, ACFTA Form E and IJEPA surfaced per country of origin"],
      ["Traceability", "The same finding appears in the JSON body, the XML document and the screen"],
    ],
  },
  {
    id: "interchange",
    label: "04 — Interchange",
    title: "A payload a gateway could actually accept",
    body:
      "The declaration compiles into two artefacts from one in-memory model: a REST-shaped JSON body in Indonesian field names, and a CEISA-flavoured XML document. Both carry the same totals, the same findings and the same declaration reference.",
    specs: [
      ["JSON", "Nested header, facility block, per-line tariff and facility split, validation report"],
      ["XML", "CEISA4 namespace, element-per-value, permit elements per line"],
      ["Reference", "Idempotency key derived from the document number and the final HS set"],
      ["Export", "Download, copy to clipboard, or a CSV line schedule with the duty split"],
    ],
  },
  {
    id: "architecture",
    label: "05 — Architecture",
    title: "Deterministic, local, and honest about its limits",
    body:
      "Nothing in this build calls a classification service. The register, the rules and the arithmetic all ship with the application, which is why the same invoice always produces the same declaration — and why the document never leaves the tab.",
    specs: [
      ["Runtime", "React 19, TypeScript, Vite. No server round-trip for classification"],
      ["Document", "PDF text layer read in-browser; images are staged but not OCR'd"],
      ["Persistence", "Theme and optional session only. No invoice is stored anywhere"],
      ["Transmission", "None. The build is a sandbox and says so in the payload"],
    ],
  },
];

export function FeaturesPage({
  onNavigate,
  onOpenLegal,
}: {
  onNavigate: (p: Page) => void;
  onOpenLegal?: (doc: LegalDoc) => void;
}) {
  return (
    <div className="bg-paper">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1120px] px-5 pt-12 pb-10 sm:px-8">
          <div className="font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">Capabilities</div>
          <h1 className="display mt-3 max-w-[620px] text-[32px] text-ink sm:text-[38px]">
            What the engine does, and where it stops
          </h1>
          <p className="mt-4 max-w-[540px] text-[13px] leading-[1.65] text-ink-2">
            A customs declaration is a legal document before it is a software output. Everything below is scoped to
            preparation and validation — the signature, the submission and the liability stay with a licensed broker.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <Tag>BTKI 2022</Tag>
            <Tag>PP 10/2012</Tag>
            <Tag>PMK 47/PMK.04/2012</Tag>
            <Tag>CEISA 4.0</Tag>
            <Tag tone="warn">sandbox build</Tag>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        {BLOCKS.map((b, i) => (
          <section
            key={b.id}
            id={b.id}
            className={`grid gap-5 py-9 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12 ${
              i < BLOCKS.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <div>
              <div className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">{b.label}</div>
            </div>
            <div className="max-w-[640px]">
              <h2 className="text-[16px] leading-snug font-medium tracking-[-0.01em] text-ink">{b.title}</h2>
              <p className="mt-2.5 text-[12.5px] leading-[1.7] text-ink-2">{b.body}</p>
              <dl className="mt-5 overflow-hidden rounded-[6px] border border-line bg-surface">
                {b.specs.map(([k, v], j) => (
                  <div
                    key={k}
                    className={`grid gap-1 px-3 py-2 sm:grid-cols-[120px_1fr] sm:gap-4 ${
                      j < b.specs.length - 1 ? "border-b border-line" : ""
                    }`}
                  >
                    <dt className="font-mono text-[10px] tracking-[0.05em] text-ink-3 uppercase">{k}</dt>
                    <dd className="text-[11.5px] leading-[1.55] text-ink-2">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-line bg-sunken/40">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[13px] font-medium text-ink">See it run on a real consignment</div>
            <p className="mt-1 text-[11.5px] text-ink-2">
              Bring your own invoice · {KPB.facilityForm} · {KPB.authority}
            </p>
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => onNavigate("pricing")}>
              Pricing
            </Btn>
            <Btn variant="primary" iconRight={ArrowRight} onClick={() => onNavigate("terminal")}>
              Open the terminal
            </Btn>
          </div>
        </div>
      </section>

      <SiteFooter onNavigate={onNavigate} onOpenLegal={onOpenLegal} />
    </div>
  );
}
