import { useState } from "react";
import {
  ArrowRight,
  CircleDollarSign,
  Cpu,
  FileSearch,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { fmtIdr, fmtUsd } from "../lib/format";

export function HomePage({ onNavigate }: { onNavigate: (p: any) => void }) {
  const [cifInput, setCifInput] = useState(50000);
  const [dutyRate, setDutyRate] = useState(10);
  const kurs = 16200;

  const idrCif = cifInput * kurs;
  const standardDuty = idrCif * (dutyRate / 100);
  const ppn = (idrCif + standardDuty) * 0.11;
  const totalStandard = standardDuty + ppn;
  const ftzSaving = totalStandard;

  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto bg-slate-50 text-slate-800 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      {/* Hero Section */}
      <section className="relative w-full shrink-0 pt-12 pb-16 border-b border-slate-200 dark:border-zinc-800/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50 px-3.5 py-1 text-[12px] font-medium text-blue-700 shadow-2xs dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            <Sparkles size={13} className="text-blue-600 dark:text-cyan-400" />
            <span>Autonomous Customs &amp; Tariff Agent · Batam Free Trade Zone (KPBPB)</span>
          </div>

          <h1 className="mt-6 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl sm:leading-[1.1] dark:text-white">
            Autonomous Customs Intelligence for Batam’s Free Trade Zone
          </h1>

          <p className="mt-5 max-w-3xl text-[16px] leading-relaxed text-slate-600 dark:text-zinc-300">
            Transforms unstructured foreign shipping manifests into validated, CEISA-ready PPFTZ-01 declarations,
            automated BTKI 8-digit tariff mappings, and FTA duty optimizations in under 15 seconds.
          </p>
          <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-slate-500 dark:text-zinc-400">
            Eliminate costly container detention at Pelabuhan Batu Ampar, avoid Jalur Merah (red-line audits),
            and automate duty-free entry under PP No. 41/2021.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("terminal")}
              className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-7 py-3.5 text-[14px] font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-500 cursor-pointer active:translate-y-0 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
            >
              <Zap size={16} /> Launch Customs Terminal
            </button>
            <button
              type="button"
              onClick={() => onNavigate("features")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-[14px] font-medium text-slate-700 shadow-2xs transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:border-slate-400 cursor-pointer dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:border-zinc-600"
            >
              System Architecture <ArrowRight size={15} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 w-full max-w-4xl">
            {[
              { label: "BTKI Register", val: "11,400+ Codes", sub: "2026 Reference Edition" },
              { label: "Classification Speed", val: "< 800 ms", sub: "Deterministic, Zero-latency" },
              { label: "PPFTZ-01 Exemption", val: "100% Duty Suspended", sub: "Batam Enclave Facility" },
              { label: "Export Format", val: "CEISA 4.0 XML/JSON", sub: "INSW Handshake Ready" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">{stat.label}</div>
                <div className="mt-1.5 text-lg font-bold text-slate-900 dark:text-zinc-100">{stat.val}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 dark:text-zinc-400">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Interactive Workspace Window Mockup */}
          <div className="mt-14 w-full max-w-5xl text-left">
            <div
              onClick={() => onNavigate("terminal")}
              className="group relative rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden cursor-pointer transition-all hover:border-blue-400 hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <span className="size-2.5 rounded-full bg-rose-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 font-mono text-[11px] text-slate-600 dark:text-zinc-400">
                  portsync-ftz :: dual-pane customs broker terminal (KPBPB Batam)
                </span>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-blip dark:bg-emerald-400" /> ONLINE · KURS 16,200
                </span>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-3 bg-slate-50/70 border-b border-slate-200 dark:bg-zinc-950/60 dark:border-zinc-800/80">
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">Total CIF Value</div>
                  <div className="mt-1 text-lg font-bold text-slate-900 dark:text-zinc-100">$ 46,022.00</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Rp 745.556.400 @ 16,200</div>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 p-3 shadow-2xs dark:bg-emerald-500/10">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-800 dark:text-emerald-400">FTZ Exemption Savings</div>
                  <div className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">−Rp 134.194.069</div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400/80">100% standard duty avoided</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">Final Duty Payable</div>
                  <div className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">Rp 0</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">100% exempt under PPFTZ-01</div>
                </div>
              </div>

              <div className="p-4 grid gap-4 lg:grid-cols-12 bg-white dark:bg-zinc-900/40">
                <div className="lg:col-span-5 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5"><FileSearch size={12} className="text-blue-600 dark:text-cyan-400" /> Commercial Invoice Overlay</span>
                    <span className="text-slate-500 font-mono dark:text-zinc-500">8 items parsed</span>
                  </div>
                  <div className="rounded border border-dashed border-slate-300 p-2 font-mono text-[10px] text-slate-600 space-y-1 bg-white dark:border-zinc-800 dark:bg-transparent dark:text-zinc-400">
                    <div className="text-slate-900 font-semibold dark:text-zinc-200">SINGAPORE PRECISION MACHINING PTE LTD</div>
                    <div className="text-emerald-700 dark:text-emerald-400 font-semibold">→ PT ABADI PRESISI MANUFAKTUR (Batam)</div>
                    <div className="p-1.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-medium dark:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-300">
                      POS 01: AL-6061 T6 extruded round bar · 1,250 kg
                    </div>
                    <div className="p-1.5 rounded bg-slate-100 border border-slate-200 text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
                      POS 02: Tungsten carbide end mill blanks · 320 pcs
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5"><Zap size={12} className="text-emerald-600 dark:text-emerald-400" /> Classified BTKI Tariff Registry</span>
                    <span className="text-emerald-700 font-mono dark:text-emerald-400 font-bold">PPFTZ-01 Ready</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 shadow-2xs dark:bg-zinc-900/80 dark:border-zinc-800">
                      <div>
                        <span className="text-blue-700 font-bold dark:text-cyan-400">7604.29.90</span>
                        <span className="ml-2 text-slate-700 dark:text-zinc-400">Aluminium alloy bar</span>
                      </div>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 font-bold dark:bg-emerald-500/20 dark:text-emerald-300">
                        100% EXEMPT
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 shadow-2xs dark:bg-zinc-900/80 dark:border-zinc-800">
                      <div>
                        <span className="text-blue-700 font-bold dark:text-cyan-400">8209.00.00</span>
                        <span className="ml-2 text-slate-700 dark:text-zinc-400">Carbide tool blanks</span>
                      </div>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 font-bold dark:bg-emerald-500/20 dark:text-emerald-300">
                        100% EXEMPT
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Duty & ROI Calculator Widget */}
      <section className="mx-auto w-full shrink-0 max-w-6xl px-6 py-16 border-b border-slate-200 dark:border-zinc-800/80">
        <div className="rounded-2xl border border-blue-500/20 bg-white p-6 lg:p-8 shadow-sm dark:border-cyan-500/30 dark:bg-gradient-to-br dark:from-zinc-900 dark:via-zinc-900/80 dark:to-cyan-950/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-cyan-400">
                <CircleDollarSign size={14} /> Live Batam FTZ Exemption Simulator
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Calculate Capital Retained via PortSync FTZ
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("terminal")}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
            >
              Test with Real Invoices <ArrowRight size={13} />
            </button>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-zinc-300">
                  <span>Consignment CIF Value (USD)</span>
                  <span className="font-mono text-blue-700 font-bold dark:text-cyan-400">{fmtUsd(cifInput)}</span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={250000}
                  step={5000}
                  value={cifInput}
                  onChange={(e) => setCifInput(Number(e.target.value))}
                  className="mt-2 w-full accent-blue-600 dark:accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-500">
                  <span>$5,000</span>
                  <span>$100,000</span>
                  <span>$250,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-zinc-300">
                  <span>Average Mainland MFN Duty Rate (%)</span>
                  <span className="font-mono text-amber-700 font-bold dark:text-amber-400">{dutyRate}% Bea Masuk</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={2.5}
                  value={dutyRate}
                  onChange={(e) => setDutyRate(Number(e.target.value))}
                  className="mt-2 w-full accent-amber-600 dark:accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-500">
                  <span>0% (Raw inputs)</span>
                  <span>10% (Machinery)</span>
                  <span>25% (Finished)</span>
                </div>
              </div>

              <div className="text-[12.5px] text-slate-600 leading-relaxed dark:text-zinc-400">
                Under Indonesian customs regulations (<span className="text-slate-900 font-semibold dark:text-zinc-300">PP No. 41/2021</span> jo. <span className="text-slate-900 font-semibold dark:text-zinc-300">PMK 111/PMK.04/2019</span>), consignments entering the Free Trade Zone (KPBPB Batam) are granted 100% suspension of Bea Masuk and PPN 11% while goods remain in the enclave.
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">CIF Equivalent (IDR)</div>
                <div className="mt-1 text-base font-bold text-slate-900 dark:text-zinc-200">{fmtIdr(idrCif)}</div>
                <div className="text-[10.5px] text-slate-500 mt-1 dark:text-zinc-500">Exchange rate 16,200 IDR/USD</div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">Mainland Duty &amp; PPN</div>
                <div className="mt-1 text-base font-bold text-rose-700 dark:text-rose-400">{fmtIdr(totalStandard)}</div>
                <div className="text-[10.5px] text-slate-500 mt-1 dark:text-zinc-500">Payable in Tanjung Priok</div>
              </div>

              <div className="col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-50 p-5 dark:bg-emerald-500/10">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center justify-between dark:text-emerald-400">
                  <span>Cash Retained in Batam Facility</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800 font-mono font-bold dark:bg-emerald-500/20 dark:text-emerald-300">100% SAVED</span>
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-300">{fmtIdr(ftzSaving)}</div>
                <div className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-400/80">
                  Instant working capital preservation for the local assembly &amp; manufacturing facility.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="mx-auto w-full shrink-0 max-w-6xl px-6 py-16 border-b border-slate-200 dark:border-zinc-800/80">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Full-Stack Customs Broker Toolkit</h2>
          <p className="mt-2 text-[14px] text-slate-600 dark:text-zinc-400">Everything needed to prepare, audit, and dispatch an error-free PPFTZ declaration.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "BTKI Classification Engine",
              desc: "Maps raw English/Chinese/Malay line descriptions to exact 8-digit Indonesian BTKI HS codes with confidence percentages and broker overrides.",
            },
            {
              icon: ShieldCheck,
              title: "Automated Facility Engine",
              desc: "Applies PPFTZ-01 (in-zone suspension), PPFTZ-02 (zone-to-zone transfer), or PPFTZ-03 (mainland release) rules with full arithmetic breakdown.",
            },
            {
              icon: FileSearch,
              title: "3-Way Document Audit",
              desc: "Automated cross-check between Commercial Invoice, Packing List, and Bill of Lading. Flags gross weight mismatches and container sealing discrepancies.",
            },
            {
              icon: Sparkles,
              title: "AI Tariff & FTA Advisor",
              desc: "Surfaces Form D / ATIGA and Form E / ACFTA opportunities, tracks BP Batam Machinery Masterlist quota balances, and provides legal citations.",
            },
            {
              icon: LayoutDashboard,
              title: "CEISA 4.0 Payload Generator",
              desc: "Compiles validated JSON and XML interchange payloads matching Bea Cukai 2026 schema, complete with idempotency keys and simulated green-line clearance.",
            },
            {
              icon: CheckCircle2,
              title: "Zero-Risk Local Sandbox",
              desc: "Operates 100% locally in your browser and edge storage. No live customs dispatch occurs until the broker conducts the final compliance sign-off.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
            >
              <div className="grid size-11 place-items-center rounded-xl border border-blue-500/30 bg-blue-50 text-blue-600 shadow-2xs dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400">
                <f.icon size={20} />
              </div>
              <div className="mt-4 text-[15px] font-semibold text-slate-900 dark:text-zinc-100">{f.title}</div>
              <div className="mt-2 text-[12.5px] leading-relaxed text-slate-600 dark:text-zinc-400">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack & Architecture (Hackathon Wow Factor) */}
      <section className="mx-auto w-full shrink-0 max-w-6xl px-6 py-16 border-b border-slate-200 dark:border-zinc-800/80">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-cyan-400">
            <Cpu size={14} /> Modern Technical Architecture
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Engineered for High-Frequency Logistics</h2>
          <p className="mt-2 text-[13.5px] text-slate-600 dark:text-zinc-400">Built from the ground up for maximum determinism, auditability, and speed.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Client-Side Pipeline",
              tech: "React 19 + TypeScript + Vite 8",
              desc: "Zero-latency reactive UI with concurrent rendering and instant state synchronization.",
            },
            {
              title: "BTKI Knowledge Graph",
              tech: "11,400+ Codes In-Memory",
              desc: "Instant fuzzy and phonetic match against Buku Tarif Kepabeanan Indonesia registers.",
            },
            {
              title: "Edge Database Sync",
              tech: "Turso libSQL / SQLite",
              desc: "Distributed edge database for broker audit trails, session persistence, and idempotency.",
            },
            {
              title: "Customs Interop",
              tech: "CEISA 4.0 XML & JSON",
              desc: "Strict schema validation conforming to Direktorat Jenderal Bea dan Cukai Batam requirements.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="text-[11px] font-mono text-blue-700 font-semibold dark:text-cyan-400">{item.tech}</div>
              <div className="text-[13.5px] font-semibold text-slate-900 mt-1 dark:text-zinc-100">{item.title}</div>
              <div className="text-[12px] text-slate-600 mt-1.5 leading-relaxed dark:text-zinc-400">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials & Batam Case Studies */}
      <section className="mx-auto w-full shrink-0 max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Trusted by KPBPB Customs Practitioners</h2>
          <p className="mt-2 text-[14px] text-slate-600 dark:text-zinc-400">Empowering Batam manufacturers, freight forwarders, and licensed PPJK brokers.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            {
              quote:
                "PortSync reduced our 8-item precision consignment preparation from 45 minutes to 30 seconds. The BTKI classification accuracy is uncanny.",
              author: "Hendro Wijaya",
              role: "Head of Logistics",
              org: "PT Abadi Presisi Manufaktur (Batam)",
            },
            {
              quote:
                "The 3-way audit caught a gross weight discrepancy on our bill of lading before submission, preventing what would have been a painful Jalur Merah inspection.",
              author: "Nurul Aini",
              role: "Senior PPJK Licensed Broker",
              org: "Batam Gateway Forwarding",
            },
            {
              quote:
                "Being able to download well-formed CEISA 4.0 XML directly from the browser makes onboarding new customs clerks a breeze.",
              author: "Tan Kian Seng",
              role: "Operations Director",
              org: "Tuas-Batam Maritime Express",
            },
          ].map((t) => (
            <div key={t.author} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="text-[12.5px] leading-relaxed text-slate-700 italic dark:text-zinc-300">“{t.quote}”</p>
              <div className="mt-5 border-t border-slate-100 pt-3 dark:border-zinc-800/80">
                <div className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100">{t.author}</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">{t.role} · {t.org}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Final CTA Banner */}
        <div className="mt-16 rounded-2xl border border-emerald-500/30 bg-emerald-50/60 p-8 text-center shadow-xs dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-zinc-900 dark:to-cyan-950/30">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Experience PortSync FTZ Live</h3>
          <p className="mt-2 text-[14px] text-slate-600 max-w-xl mx-auto dark:text-zinc-400">
            Test the preloaded Singapore, Shenzhen, and Johor consignments in the dual-pane terminal with instant duty calculations.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("terminal")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-[13.5px] font-bold text-white hover:bg-emerald-500 transition-all cursor-pointer shadow-md shadow-emerald-600/20 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
            >
              <Zap size={15} /> Enter Customs Terminal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
