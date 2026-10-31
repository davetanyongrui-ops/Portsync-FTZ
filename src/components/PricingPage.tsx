import { useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export function PricingPage({ onNavigate }: { onNavigate: (p: any) => void }) {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Starter / Evaluation",
      price: "Free",
      period: "forever",
      desc: "For individual customs brokers and testing consignments.",
      highlight: false,
      features: [
        "3 preloaded demo fixtures (Singapore, Shenzhen, Johor)",
        "Deterministic BTKI 2026 classification",
        "PPFTZ-01, PPFTZ-02, PPFTZ-03 regimes",
        "CEISA 4.0 JSON & XML payload export",
        "Local sandbox client-side execution",
      ],
      cta: "Launch Free Sandbox",
      action: () => onNavigate("terminal"),
    },
    {
      name: "Professional Broker",
      price: annual ? "$39" : "$49",
      period: "/ month",
      desc: "For active customs PPJK agencies and logistics operators.",
      highlight: true,
      badge: "Most Popular",
      features: [
        "Everything in Starter, plus:",
        "Unlimited document OCR ingestion (PDF/PNG)",
        "3-Way Document Audit (Invoice vs P/L vs B/L)",
        "AI Tariff & FTA Advisor (Form D/E & Masterlist)",
        "Turso libSQL distributed session audit log",
        "Priority Batam customs regulations updates",
      ],
      cta: "Start 14-Day Free Trial",
      action: () => onNavigate("terminal"),
    },
    {
      name: "Enterprise FTZ Facility",
      price: "Custom",
      period: "annual contract",
      desc: "For large FTZ manufacturers, shipyards, and port authorities.",
      highlight: false,
      features: [
        "Dedicated on-prem or private cloud instance",
        "Direct CEISA 4.0 INSW API gateway connector",
        "ERP integration (SAP S/4HANA, Oracle, Odoo)",
        "Multi-user RBAC with digital signature audit",
        "Dedicated Customs Compliance SLA & 24/7 Desk",
      ],
      cta: "Contact Enterprise Sales",
      action: () => onNavigate("contact"),
    },
  ];

  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50 text-slate-800 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <section className="mx-auto w-full shrink-0 max-w-6xl px-6 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            <Sparkles size={13} /> Transparent, Value-Driven Pricing
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Choose the Plan Built for Your Operations
          </h1>
          <p className="mt-3 text-[14.5px] text-slate-600 dark:text-zinc-400">
            Accelerate customs clearance, eliminate filing errors, and retain capital with automated Batam FTZ facilities.
          </p>

          {/* Billing Switch */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/80">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                !annual ? "bg-white text-slate-900 shadow-2xs font-semibold dark:bg-zinc-800 dark:text-white" : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                annual ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-zinc-950" : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Annual Billing
              <span className={`rounded px-1.5 py-0.5 text-[10px] ${annual ? "bg-emerald-700 text-white font-bold dark:bg-zinc-950 dark:text-emerald-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"}`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                p.highlight
                  ? "border-emerald-500/60 bg-white shadow-lg ring-1 ring-emerald-500/40 dark:border-emerald-500/50 dark:bg-gradient-to-b dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/20 dark:shadow-xl dark:shadow-emerald-500/10"
                  : "border-slate-200 bg-white shadow-sm hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-slate-900 dark:text-zinc-100">{p.name}</span>
                  {p.badge && (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{p.price}</span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">{p.period}</span>
                </div>
                <p className="mt-2 text-[12.5px] text-slate-600 leading-relaxed dark:text-zinc-400">{p.desc}</p>

                <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 dark:border-zinc-800/80">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12.5px] text-slate-700 dark:text-zinc-300">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={p.action}
                className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all cursor-pointer ${
                  p.highlight
                    ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                    : "border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {p.cta} <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto border-t border-slate-200 pt-12 dark:border-zinc-800/80">
          <h2 className="text-xl font-bold text-slate-900 text-center dark:text-white">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-4">
            {[
              {
                q: "What is the legal basis for the 100% duty exemption in Batam?",
                a: "Under Government Regulation PP No. 41/2021 (implementing the KPBPB Free Trade Zone statutory framework), goods imported into Batam are granted suspension of Bea Masuk, PPN 11%, and PPh Pasal 22 while remaining inside the designated bonded enclave.",
              },
              {
                q: "Can I submit the generated XML directly into CEISA 4.0?",
                a: "Yes. The generated CEISA XML payload complies with the official EDI schema of the Directorate General of Customs and Excise (DJBC) Batam. You can paste the payload or upload the XML file into your CEISA 4.0 gateway.",
              },
              {
                q: "How does the broker override feature work?",
                a: "While the BTKI engine classifies items automatically with high precision, customs brokers retain the statutory authority to override any HS code. The engine immediately recomputes the MFN vs FTZ duty breakdown and logs the decision with an idempotency key.",
              },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="text-[13.5px] font-semibold text-slate-900 dark:text-zinc-200">{faq.q}</div>
                <div className="mt-2 text-[12.5px] text-slate-600 leading-relaxed dark:text-zinc-400">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
