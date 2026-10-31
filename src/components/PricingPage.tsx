import { ArrowRight, Check } from "lucide-react";

const plans = [
  { name: "Starter", price: "Free", desc: "For evaluation and small consignments.", features: ["3 demo invoices", "BTKI classification", "PPFTZ-01/02/03 regimes", "Sandbox payload export"] },
  { name: "Professional", price: "$49/mo", desc: "For active brokers and manufacturers.", features: ["Unlimited declarations", "Real OCR parsing", "Live BTKI feed", "Turso-backed history", "Priority support"] },
  { name: "Enterprise", price: "Custom", desc: "For large operators and FTZs.", features: ["Dedicated instance", "SSO & audit logs", "Custom tariff feeds", "SLA & onboarding"] },
];

export function PricingPage({ onNavigate }: { onNavigate: (p: any) => void }) {
  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50">
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pricing</h1>
        <p className="mt-2 text-[14px] text-slate-600">Choose the plan that fits your operation.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="text-[13px] font-semibold text-slate-900">{plan.name}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{plan.price}</div>
              <div className="mt-1 text-[12px] text-slate-500">{plan.desc}</div>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[12.5px] text-slate-700">
                    <Check size={13} className="text-emerald-600" /> {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Get started <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}