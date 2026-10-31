import { CheckCircle2, FileSearch, LayoutDashboard, ShieldCheck, Sparkles, Zap } from "lucide-react";

export function HomePage({ onNavigate }: { onNavigate: (p: any) => void }) {
  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.08),_transparent_60%)]" />
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-[12px] font-medium text-blue-700 shadow-2xs backdrop-blur">
            <Sparkles size={13} /> Batam Automated Customs &amp; Tariff Agent
          </div>
          <h1 className="mt-6 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
            PortSync FTZ
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-slate-600">
            Classify supplier invoices against the BTKI register, apply PPFTZ-01/02/03 facility rules, and generate
            CEISA-ready declarations — all in the browser.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("dashboard")}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-[13.5px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <LayoutDashboard size={16} /> Open Dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate("features")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-[13.5px] font-medium text-slate-700 shadow-2xs transition-all hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Explore features
            </button>
          </div>

          <div className="mt-14 w-full max-w-5xl">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_30px_80px_-30px_rgba(37,99,235,0.25)]">
              <div className="flex items-center gap-1.5 px-3 py-2">
                <span className="size-2.5 rounded-full bg-rose-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[11px] text-slate-400">portsync-ftz · dashboard</span>
              </div>
              <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                {["Total CIF Value", "FTZ Exemption Savings", "Final Duty Payable"].map((k, i) => (
                  <div key={k} className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{k}</div>
                    <div className={`mt-2 text-lg font-bold ${i === 1 ? "text-emerald-600" : i === 2 ? "text-amber-600" : "text-slate-900"}`}>
                      {i === 0 ? "$ 46,022.00" : i === 1 ? "−Rp 14.2 jt" : "Rp 0"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                  <Zap size={12} className="text-blue-600" /> Interactive Customs Declaration
                </div>
                <div className="mt-3 space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                      <span className="tnum text-[11px] text-slate-400">{String(n).padStart(2, "0")}</span>
                      <span className="flex-1 text-[12px] text-slate-700">Sample classified line item…</span>
                      <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] text-blue-700">8504.40.90</span>
                      <span className="text-[11px] font-semibold text-emerald-600">saved</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Built for customs brokers</h2>
          <p className="mt-2 text-[14px] text-slate-600">Everything you need to prepare a PPFTZ declaration.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Zap, title: "BTKI Classification", desc: "Agent maps each invoice line to a BTKI HS code with confidence scores and broker overrides." },
            { icon: ShieldCheck, title: "FTZ Facility Engine", desc: "Applies PPFTZ-01/02/03 regimes, computing duty payable and exemption savings." },
            { icon: FileSearch, title: "3-Way Document Audit", desc: "Cross-checks Commercial Invoice, Packing List, and Bill of Lading." },
            { icon: Sparkles, title: "AI Tariff & FTA Advisor", desc: "Form D/ATIGA opportunities, Masterlist balance, audit-defense references." },
            { icon: LayoutDashboard, title: "CEISA-Ready Payload", desc: "Validated JSON/XML payloads plus simulated clearance status." },
            { icon: CheckCircle2, title: "Sandbox Safe", desc: "Nothing is transmitted — verify live data before filing." },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 ring-1 ring-blue-100">
                <f.icon size={20} />
              </div>
              <div className="mt-4 text-[14px] font-semibold text-slate-900">{f.title}</div>
              <div className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}