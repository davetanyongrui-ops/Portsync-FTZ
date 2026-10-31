import {
  ArrowRight,
  CheckCircle2,
  FileSearch,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export function FeaturesPage({ onNavigate }: { onNavigate: (p: any) => void }) {
  const deepFeatures = [
    {
      category: "Classification & Intelligence",
      icon: Zap,
      title: "Deterministic BTKI 2026 Semantic Classifier",
      desc: "Instant alignment of supplier descriptions (in English, Chinese, or Malay) to the official Buku Tarif Kepabeanan Indonesia (BTKI) 8-digit HS register.",
      points: [
        "Confidence rating (0–100%) computed for every line item",
        "Top alternative HS candidates surfaced with classification rationale",
        "1-click broker overrides with recalculation of duty and tax obligations",
        "Deterministic local evaluation with zero network lag",
      ],
    },
    {
      category: "Customs Regimes & Facilities",
      icon: ShieldCheck,
      title: "PPFTZ-01, 02 & 03 Facility Calculation Engine",
      desc: "Full automated adherence to Batam Free Trade Zone (KPBPB) statutory regulations (PP 156/2015 jo. PMK 111/PMK.04/2019).",
      points: [
        "PPFTZ-01: In-zone processing with complete suspension of Bea Masuk and 11% PPN",
        "PPFTZ-02: Zone-to-zone bonded transit between Batam, Bintan, and Karimun enclaves",
        "PPFTZ-03: Mainland clearance to Jakarta/Surabaya with standard MFN tariff assessment",
        "Accurate allocation of sea freight & marine insurance pro-rata across all lines",
      ],
    },
    {
      category: "Compliance & Pre-Filing Audit",
      icon: FileSearch,
      title: "3-Way Cross-Document Verification Audit",
      desc: "Multi-document consistency check comparing Commercial Invoices, Packing Lists, and Ocean Bills of Lading before filing.",
      points: [
        "Gross vs Net weight reconciliation down to 1 kg tolerance",
        "Declared currency and exchange rate alignment check",
        "Consignee NPWP, NIB, and API registration validation against customs registry",
        "Simulated discrepancy alerts to avoid red-channel physical inspections",
      ],
    },
    {
      category: "Tariff Optimization",
      icon: Sparkles,
      title: "AI Tariff Optimization & FTA Advisory",
      desc: "Maximizes duty savings through preferential trade agreements and government capital equipment quotas.",
      points: [
        "ATIGA Form D & ACFTA Form E preferential tariff identification",
        "Anti-Dumping Duty (BMAD) and safeguard screening by country of origin",
        "BP Batam Machinery Masterlist quota balance tracking & auto-deduction",
        "Direct citation of legal basis (e.g. SOP Bea Cukai Batam KEP-54/KPU.02/2023)",
      ],
    },
    {
      category: "Interchange & Integration",
      icon: LayoutDashboard,
      title: "CEISA 4.0 & INSW Payload Generator",
      desc: "Produces fully structured, syntax-highlighted declarations ready for direct submission to the Indonesian National Single Window.",
      points: [
        "Interchange XML matching Bea Cukai Batam EDI specifications",
        "JSON payload formatted according to the latest CEISA 4.0 REST schema",
        "Cryptographic idempotency keys generated for audit trails",
        "Simulated clearance pipeline demonstrating validation and Green Line endorsement",
      ],
    },
    {
      category: "Security & Architecture",
      icon: Lock,
      title: "Zero-Risk Local Sandbox Architecture",
      desc: "Client-side first execution ensures your commercial invoice pricing and proprietary manufacturing BOMs never leak.",
      points: [
        "All calculations occur inside the secure client sandbox",
        "Offline-capable with fallback authentication and local state persistence",
        "Turso libSQL distributed edge database integration for enterprise sync",
        "Export and copy with 1-click clipboard and file download utilities",
      ],
    },
  ];

  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto bg-zinc-950 text-zinc-100 antialiased">
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11.5px] font-medium text-cyan-300">
            <Sparkles size={13} /> Complete Technical Capability Matrix
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Features &amp; Customs Engine
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
            PortSync FTZ combines automated OCR document ingestion, deterministic BTKI tariff classification, and
            official CEISA 4.0 EDI generator for Batam Free Trade Zone operators.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {deepFeatures.map((f) => (
            <div
              key={f.title}
              className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm hover:border-zinc-700 hover:bg-zinc-850/80 transition-all"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                    <f.icon size={18} />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                      {f.category}
                    </span>
                    <h3 className="text-[16px] font-bold text-zinc-100 leading-snug">{f.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">{f.desc}</p>
                <ul className="mt-4 space-y-2 border-t border-zinc-800/80 pt-3">
                  {f.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-[12px] text-zinc-300">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div>
            <h4 className="text-[16px] font-bold text-white">Experience all features in the live Terminal</h4>
            <p className="text-[13px] text-zinc-400 mt-0.5">Test real invoices with 8-digit BTKI classification and export XML.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("pricing")}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 cursor-pointer"
            >
              View Pricing
            </button>
            <button
              type="button"
              onClick={() => onNavigate("terminal")}
              className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 cursor-pointer flex items-center gap-1.5"
            >
              Launch Terminal <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
