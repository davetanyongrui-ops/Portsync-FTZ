import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { Btn } from "./ui";

export type LegalDocType = "disclaimer" | "tos" | "privacy";

const DOCS: { id: LegalDocType; label: string; title: string; updated: string }[] = [
  { id: "disclaimer", label: "Statutory disclaimer", title: "Statutory disclaimer", updated: "October 2026" },
  { id: "tos", label: "Terms of service", title: "Terms of service", updated: "October 2026" },
  { id: "privacy", label: "Trade data", title: "Privacy & trade data", updated: "October 2026" },
];

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="flex items-baseline gap-2 text-[12.5px] font-semibold text-ink">
        <span className="font-mono text-[10.5px] text-ink-3">{n}</span>
        {title}
      </h3>
      <div className="mt-1.5 space-y-2 text-[12.5px] leading-[1.7] text-ink-2">{children}</div>
    </section>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[7px] size-[3px] shrink-0 rounded-full bg-line-strong" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalModal({ initialDoc = "disclaimer", onClose }: { initialDoc?: LegalDocType; onClose: () => void }) {
  const [doc, setDoc] = useState<LegalDocType>(initialDoc);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const meta = DOCS.find((d) => d.id === doc)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Legal and compliance"
        onClick={(e) => e.stopPropagation()}
        className="animate-rise flex h-full max-h-[min(720px,90vh)] w-full max-w-[860px] flex-col overflow-hidden rounded-[8px] border border-line bg-surface shadow-[var(--shadow-modal)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 className="text-[13.5px] font-semibold tracking-[-0.01em] text-ink">Legal &amp; compliance</h2>
            <p className="mt-0.5 text-[11px] text-ink-3">
              PortSync Logistics Systems · KPBPB Batam · {meta.updated}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto grid size-7 cursor-pointer place-items-center rounded-[4px] text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-44 shrink-0 border-r border-line bg-sunken/50 p-2 sm:block" aria-label="Legal documents">
            {DOCS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDoc(d.id)}
                className={cn(
                  "block w-full cursor-pointer rounded-[4px] px-2 py-1.5 text-left text-[12px] transition-colors",
                  doc === d.id ? "bg-surface font-medium text-ink ring-1 ring-line" : "text-ink-2 hover:text-ink",
                )}
              >
                {d.label}
              </button>
            ))}
          </nav>

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-3 flex gap-1.5 sm:hidden">
              {DOCS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDoc(d.id)}
                  className={cn(
                    "cursor-pointer rounded-[4px] border px-2 py-1 text-[11px]",
                    doc === d.id ? "border-ink bg-ink text-paper" : "border-line text-ink-2",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="max-w-[68ch]">
              <h1 className="display text-[22px] text-ink">{meta.title}</h1>

              {doc === "disclaimer" && (
                <>
                  <div className="mt-3 rounded-[5px] border border-warn/30 bg-warn-soft px-3 py-2 text-[11.5px] leading-relaxed text-warn">
                    PortSync FTZ is a pre-filing validation and decision-support system. It does not replace the
                    statutory authority of a licensed customs broker (PPJK) or the determinations of the Directorate
                    General of Customs and Excise (DJBC).
                  </div>
                  <Section n="1" title="Legislative scope">
                    <p>
                      The engine is built against the statutory framework of the Batam free trade zone and free port
                      (KPBPB):
                    </p>
                    <List
                      items={[
                        <>
                          <strong>Law No. 17 of 2006</strong> amending Law No. 10 of 1995 on customs.
                        </>,
                        <>
                          <strong>Government Regulation No. 10 of 2012</strong> on the customs, tax and excise treatment
                          of goods entering, leaving and remaining within a designated free trade zone, with{" "}
                          <strong>PMK 47/PMK.04/2012</strong> on the procedures for entry and release.
                        </>,
                        <>
                          <strong>Perka BP Batam 8/2019</strong> (as amended) on the administration of entry into and
                          release from the Batam free zone.
                        </>,
                        <>
                          <strong>BTKI 2022</strong>, the Indonesian customs tariff book established by PMK
                          26/PMK.010/2022 and used as the classification reference in this build.
                        </>,
                      ]}
                    />
                  </Section>
                  <Section n="2" title="Professional verification">
                    <p>
                      Tariff classification, CIF derivation, lartas flags and the generated CEISA payloads are advisory
                      pre-declaration assessments. Any declaration transmitted to CEISA 4.0 through the national single
                      window must be signed and submitted under the licence of an authorised PPJK or a licensed importer
                      holding a valid NIB.
                    </p>
                  </Section>
                  <Section n="3" title="Limitation of liability">
                    <p>PortSync is not liable for:</p>
                    <List
                      items={[
                        "Duty re-assessments, SPTNP notices or administrative surcharges imposed by a customs auditor.",
                        "Clearance delay, container detention or demurrage at Batu Ampar or Sekupang.",
                        "Red-channel inspection triggered by physical discrepancy, a missing surveyor report or an uncertified SNI standard.",
                        "An officer's determination on facility eligibility versus standard MFN duty.",
                      ]}
                    />
                  </Section>
                  <p className="mt-5 border-t border-line pt-3 text-[11px] text-ink-3">
                    Reference: BP Batam directorate of customs clearance and KPU Bea dan Cukai Tipe B Batam.
                  </p>
                </>
              )}

              {doc === "tos" && (
                <>
                  <Section n="1" title="Agreement and scope">
                    <p>
                      These terms form a binding agreement between you — personally or on behalf of an enterprise,
                      forwarder or licensed brokerage — and PortSync Logistics Systems, governing access to the customs
                      automation terminal.
                    </p>
                  </Section>
                  <Section n="2" title="Authorised use">
                    <p>You represent and warrant that:</p>
                    <List
                      items={[
                        "You hold valid corporate standing, NPWP and customs permissions to operate within KPBPB Batam.",
                        "Uploaded invoices, packing lists and transport documents describe genuine, unmanipulated transactions.",
                        "You will not use the system to misclassify export-controlled goods, dual-use technology, narcotics or weapons.",
                      ]}
                    />
                  </Section>
                  <Section n="3" title="Intellectual property">
                    <p>
                      The extraction heuristics, validation rules and interface are the property of PortSync Logistics
                      Systems. The BTKI nomenclature and the underlying regulations remain public domain material of the
                      Ministry of Finance of the Republic of Indonesia.
                    </p>
                  </Section>
                  <Section n="4" title="Availability">
                    <p>
                      Scheduled maintenance, changes to the official INSW schema and interruptions at DJBC are outside
                      our control and do not constitute a breach of any service commitment.
                    </p>
                  </Section>
                  <Section n="5" title="Governing law">
                    <p>
                      These terms are governed by the laws of the Republic of Indonesia. Any dispute is brought
                      exclusively before the District Court of Batam, Riau Islands.
                    </p>
                  </Section>
                </>
              )}

              {doc === "privacy" && (
                <>
                  <div className="mt-3 rounded-[5px] border border-ok/30 bg-ok-soft px-3 py-2 text-[11.5px] leading-relaxed text-ok">
                    Invoices, unit prices, supplier names and consignee manifests are treated as trade secrets. Handling
                    follows the Indonesian personal data protection law, UU No. 27/2022.
                  </div>
                  <Section n="1" title="No model training on your invoices">
                    <p>
                      Invoice text, pricing schedules, supplier masterlists and product descriptions are never used to
                      train a public model. Classification runs against the statutory tariff register and closed
                      rule sets, so volumes, margins and procurement relationships stay confidential.
                    </p>
                  </Section>
                  <Section n="2" title="Local-first processing">
                    <p>
                      Parsing, text-layout recognition and PDF rendering happen in your browser runtime. In this build
                      the document never leaves the tab at all — there is no upload endpoint, and the payload you
                      download is generated on your machine.
                    </p>
                  </Section>
                  <Section n="3" title="Storage">
                    <p>
                      The only thing persisted is your theme choice and, if you sign in, a session record in local
                      storage. Clearing site data removes both.
                    </p>
                  </Section>
                  <Section n="4" title="Your rights">
                    <p>
                      Under UU No. 27/2022 you may access, rectify or erase any stored session record. In this build that
                      is a single action: sign out, or clear site data for the origin.
                    </p>
                  </Section>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-line px-4 py-2.5">
          <span className="hidden font-mono text-[10px] text-ink-3 sm:inline">KPBPB Batam · sandbox build</span>
          <Btn size="sm" variant="primary" onClick={onClose} className="ml-auto">
            Close
          </Btn>
        </div>
      </div>
    </div>
  );
}
