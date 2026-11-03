import type { LegalDoc } from "../data/legal";
import { useState } from "react";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { Btn, Tag } from "./ui";
import { SiteFooter } from "./SiteFooter";
import { REGISTER_SIZE } from "../data/tariff";
import type { Page } from "../App";

interface QA {
  q: string;
  a: string;
}

const GROUPS: { id: string; title: string; items: QA[] }[] = [
  {
    id: "basics",
    title: "The basics",
    items: [
      {
        q: "What does PortSync actually do?",
        a: "You drop in a commercial invoice. The tool reads it in your browser, matches every line item to an Indonesian tariff heading (BTKI 2022), and then shows what that consignment would cost in duty and tax — first at standard MFN rates, then under the Batam free-zone facility. You see taxable lines, reduced lines, non-taxed lines, and how much the legal relief is worth, before anything is keyed into a customs system.",
      },
      {
        q: "Is this an official government website?",
        a: "No — emphatically not. PortSync is an independent software tool with no affiliation to, endorsement from, or relationship with Indonesian Customs (DJBC), BP Batam, the Ministry of Finance, CEISA 4.0, or any other government body. Nothing it produces is official.",
      },
      {
        q: "Who is it for?",
        a: "Importers and manufacturers operating in or through the Batam free trade zone, their customs and procurement staff, and licensed brokers who want a fast first pass before formal classification. If you are just curious what your shipment would cost at Batam versus a mainland port, it works for that too.",
      },
      {
        q: "Do I need an account?",
        a: "No. The terminal is free and anonymous. There is nothing to sign up for in this build — accounts on the login screen exist for a future version and are stored locally on your device only.",
      },
      {
        q: "Does it cost anything?",
        a: "No. The build you are using is free while in development. See the pricing page for what a paid tier would look like; there is no billing today.",
      },
    ],
  },
  {
    id: "documents",
    title: "Documents & OCR",
    items: [
      {
        q: "What files can I upload?",
        a: "PDF invoices (with a text layer or scanned), plus JPG/PNG photos of paper invoices. Clean digital PDFs read best; phone photos of paper work but the OCR figures should be checked. The file never leaves your browser.",
      },
      {
        q: "Why did my upload fail?",
        a: "The usual causes: a photo that is too blurry, skewed or dark for OCR; a scanned PDF whose text could not be recovered; or an invoice layout the parser could not find a line-item table in. The error message tells you which stage failed. If a PDF persistently fails, it usually means the document is image-only and the OCR pass could not recover a recognisable table — try a sharper photo or the original PDF.",
      },
      {
        q: "The OCR misread a number. Can I fix it?",
        a: "Yes — open the Lines view and click the quantity or unit price directly in the table. Type the correction and press Enter: every total, flag and tax figure recomputes instantly, and the amber \u201ccheck figures\u201d flag clears on that row.",
      },
      {
        q: "What are the amber \u201ccheck qty × price\u201d flags?",
        a: "The tool cross-checks every line: quantity × unit price should equal the printed line amount. When it does not — the classic OCR failure where $5,100.00 becomes $510,000.00 — the row is flagged so you know exactly which figure to verify against the original document.",
      },
      {
        q: "What does the \u201cFigures may contain OCR errors\u201d banner mean?",
        a: "The recognised line amounts do not add up to the grand total stated on the document itself. Something was misread or missed. Open Lines, look for amber rows, and correct them; the banner disappears once the document reconciles.",
      },
      {
        q: "Why are some lines grey, saying \u201cneeds an HS code\u201d?",
        a: "The register covers about " + REGISTER_SIZE + " tariff subheadings. Goods outside it are never guessed — they are flagged for you (or a broker) to classify manually. You can pick any code from the dropdown on the line and the calculation updates immediately.",
      },
    ],
  },
  {
    id: "tax",
    title: "Tax & the legal side",
    items: [
      {
        q: "How can the tax legally go down?",
        a: "Two mechanisms, both lawful. First, the Batam free trade zone: under the KPBPB framework, bea masuk (import duty) and PPN are suspended while goods remain inside the zone — the tool shows what is genuinely \u201cheld, not forgiven\u201d. Second, free-trade agreements: when the origin qualifies, preferential rates apply on presentation of the right form (Form E for ACFTA/China, Form D for ATIGA, Form IJ for IJEPA/Japan). The summary names exactly which mechanism applies to each line and why.",
      },
      {
        q: "Is the reduced tax figure something I can rely on?",
        a: "No — treat it as a well-researched estimate. The arithmetic follows the published rules (PP 10/2012, PMK 47/PMK.04/2012 and the FTA rate tables), but eligibility is ultimately determined by a customs officer, and edge cases (specific HS codes, origin rules, masterlists) can change the answer. Verify with a licensed broker before acting on it.",
      },
      {
        q: "Where do the tariff rates come from?",
        a: "Indonesian MFN rates from the World Bank WITS/TRAINS database (2022 snapshot), matched to BTKI 2022 headings. They are not a live feed from DJBC and may have changed. The Sources page documents this in detail.",
      },
      {
        q: "Can the exported files be submitted to CEISA 4.0?",
        a: "Not directly. The JSON and XML exports are shaped like the PPFTZ-01 interchange formats so a broker or filing system can map them, but a declaration must be signed and submitted under a licensed broker's or importer's credentials. Nothing is transmitted by this tool.",
      },
    ],
  },
  {
    id: "ai",
    title: "AI, accuracy & honesty",
    items: [
      {
        q: "Is this AI?",
        a: "Parts of it. Document reading (OCR), text matching and the classifier are automated, probabilistic systems — the same family of techniques as modern AI. The tariff lookup and the tax arithmetic are deterministic rules. The important thing to understand: the AI parts make mistakes, and the tool is designed on the assumption that they will.",
      },
      {
        q: "How accurate is it?",
        a: "Honest answer: it depends on the input. Clean digital PDFs read nearly perfectly and the arithmetic is exact for the rules it implements. Skewed phone photos lose lines and misread digits — that is why every figure is cross-checked against the document's own totals and flagged when it does not reconcile. The tool is designed to fail loudly rather than silently: what it shows, it shows with its confidence and alternatives attached.",
      },
      {
        q: "What if it classifies something wrong?",
        a: "Every line shows its heading, confidence score and the alternatives that were considered, and any heading can be overridden in one click. If you find a systematic error, report it on the contact page — the register improves from those reports.",
      },
      {
        q: "Do you train AI on my invoices?",
        a: "Never. Documents are processed locally in your browser and are never uploaded to us at all. There is nothing to train on. See the Privacy & Trade Data statement.",
      },
    ],
  },
  {
    id: "misc",
    title: "Practical bits",
    items: [
      {
        q: "Does it work on my phone?",
        a: "Yes. The whole flow — upload, classify, read the summary, correct figures — is usable from a phone browser, and the layout adapts down to small screens.",
      },
      {
        q: "Why does the exchange rate look different from the market rate?",
        a: "Duty in Indonesia is computed on the kurs pabean published by customs, not the market spot rate. The terminal uses a representative kurs pabean value and shows the market rate separately, for reference only.",
      },
      {
        q: "Can I use the output in a dispute?",
        a: "No. The output is an unofficial estimate from an unaffiliated tool. For disputes, audits or anything formal, you need the official determination of DJBC or advice from a licensed professional.",
      },
      {
        q: "Something is broken or a figure looks wrong. What do I do?",
        a: "Verify independently first — never act on a figure you suspect. Then tell us via the contact page with the invoice layout (not the numbers) so the parser and register can be fixed for everyone.",
      },
    ],
  },
];

export function FaqPage({
  onNavigate,
  onOpenLegal,
}: {
  onNavigate: (p: Page) => void;
  onOpenLegal?: (doc: LegalDoc) => void;
}) {
  const [openGroup, setOpenGroup] = useState<string>("basics");

  return (
    <div className="bg-paper">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1120px] px-5 pt-12 pb-8 sm:px-8">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
            <LifeBuoy size={12} strokeWidth={2} />
            Help &amp; FAQ
          </div>
          <h1 className="display mt-3 max-w-[620px] text-[32px] text-ink sm:text-[38px]">
            Questions, answered without the sales voice
          </h1>
          <p className="mt-4 max-w-[540px] text-[13px] leading-[1.65] text-ink-2">
            How the tool works, what it gets wrong, what the law actually says, and what it refuses to promise.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            <Tag>free · no account</Tag>
            <Tag>runs in your browser</Tag>
            <Tag tone="warn">not an official source</Tag>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12">
        <nav className="lg:sticky lg:top-4 lg:self-start" aria-label="FAQ sections">
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:pb-0">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setOpenGroup(g.id)}
                className={`shrink-0 cursor-pointer rounded-[5px] px-2.5 py-2 text-left text-[12px] transition-colors lg:w-full ${
                  openGroup === g.id ? "bg-surface font-medium text-ink ring-1 ring-line" : "text-ink-2 hover:text-ink"
                }`}
              >
                {g.title}
                <span className="hidden text-[10.5px] text-ink-3 lg:block">{g.items.length} questions</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="min-w-0 max-w-[72ch]">
          {GROUPS.map((g) => (
            <section key={g.id} className={openGroup === g.id ? "" : "hidden"} aria-label={g.title}>
              <div className="border-t border-line">
                {g.items.map((f) => (
                  <details key={f.q} className="group border-b border-line" open={g.items.length <= 4}>
                    <summary className="flex cursor-pointer list-none items-start gap-3 py-3.5 text-[13px] font-medium text-ink transition-colors hover:text-ink-2">
                      <span className="mt-[3px] text-[11px] leading-none text-ink-3 transition-transform group-open:rotate-45">
                        +
                      </span>
                      {f.q}
                    </summary>
                    <p className="pb-4 pl-6 pr-2 text-[12.5px] leading-[1.75] text-ink-2">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-8 rounded-[6px] border border-line bg-surface px-4 py-3.5">
            <div className="text-[12.5px] font-medium text-ink">Still stuck?</div>
            <p className="mt-1 text-[11.5px] leading-[1.6] text-ink-2">
              The legal position — what the tool is not, and what you accept by using it — lives in the disclaimer. The
              provenance of every data input lives on the Sources page.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn size="sm" variant="secondary" onClick={() => onOpenLegal?.("disclaimer")}>
                Read the disclaimer
              </Btn>
              <Btn size="sm" variant="secondary" onClick={() => onNavigate("sources")}>
                Data sources
              </Btn>
              <Btn size="sm" variant="primary" iconRight={ArrowRight} onClick={() => onNavigate("contact")}>
                Contact
              </Btn>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter onNavigate={onNavigate} onOpenLegal={onOpenLegal} />
    </div>
  );
}
