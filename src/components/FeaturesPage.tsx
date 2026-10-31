import { ArrowRight, FileSearch, LayoutDashboard, ShieldCheck, Sparkles, Zap } from "lucide-react";

export function FeaturesPage({ onNavigate }: { onNavigate: (p: any) => void }) {
  const features = [
    { icon: Zap, title: "BTKI Classification", desc: "Agent maps each invoice line to a BTKI HS code with confidence scores and broker override options." },
    { icon: ShieldCheck, title: "FTZ Facility Engine", desc: "Applies PPFTZ-01/02/03 regimes, computing duty payable and exemption savings automatically." },
    { icon: FileSearch, title: "3-Way Document Audit", desc: "Cross-checks Commercial Invoice, Packing List, and Bill of Lading for discrepancies." },
    { icon: Sparkles, title: "AI Tariff & FTA Advisor", desc: "Surfaces Form D/ATIGA opportunities, BP Batam Masterlist balance, and audit-defense references." },
    { icon: LayoutDashboard, title: "CEISA-Ready Payload", desc: "Generates validated JSON/XML payloads and simulates customs clearance status." },
    { icon: ShieldCheck, title: "Sandbox Safe", desc: "Nothing is transmitted to a customs system — verify live data before filing." },
  ];
  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50">
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Features</h1>
        <p className="mt-2 text-[14px] text-slate-600">Everything you need to prepare a PPFTZ declaration.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-blue-600">
                <f.icon size={16} />
              </div>
              <div className="mt-3 text-[13.5px] font-semibold text-slate-900">{f.title}</div>
              <div className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{f.desc}</div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onNavigate("pricing")}
          className="mt-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-700 hover:text-blue-800"
        >
          See pricing <ArrowRight size={14} />
        </button>
      </section>
    </div>
  );
}
