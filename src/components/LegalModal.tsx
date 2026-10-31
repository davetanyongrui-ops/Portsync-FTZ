import { useState, useEffect } from "react";
import {
  FileText,
  Lock,
  Scale,
  ShieldAlert,
  ShieldCheck,
  X,
  Printer,
  Copy,
  Check,
  Building2,
  FileCheck2,
} from "lucide-react";
import { cn } from "../lib/cn";

export type LegalDocType = "disclaimer" | "tos" | "privacy";

interface LegalModalProps {
  initialDoc?: LegalDocType;
  onClose: () => void;
}

export function LegalModal({ initialDoc = "disclaimer", onClose }: LegalModalProps) {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4.5 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-blue-500/20 bg-blue-50 text-blue-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400">
              <Scale size={20} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold tracking-tight text-slate-900 dark:text-white">
                  PortSync FTZ Legal &amp; Regulatory Compliance
                </h2>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                  PMK 185/2022
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-zinc-400">
                Statutory customs guidance, terms of service, and commercial trade privacy standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white cursor-pointer transition-colors shadow-2xs"
              title="Print regulatory documentation"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white cursor-pointer transition-colors shadow-2xs"
              title="Copy shareable link"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 cursor-pointer transition-colors ml-1"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex shrink-0 border-b border-slate-200 bg-white px-6 pt-2 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            {[
              { id: "disclaimer" as LegalDocType, label: "Statutory Disclaimer", icon: ShieldAlert },
              { id: "tos" as LegalDocType, label: "Terms of Service", icon: FileText },
              { id: "privacy" as LegalDocType, label: "Privacy & Trade Data Security", icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeDoc === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDoc(tab.id)}
                  className={cn(
                    "flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-semibold transition-colors cursor-pointer",
                    active
                      ? "border-blue-600 text-blue-700 dark:border-cyan-400 dark:text-cyan-300"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-700",
                  )}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-[13.5px] leading-relaxed text-slate-700 dark:text-zinc-300">
          {activeDoc === "disclaimer" && (
            <div className="space-y-6 animate-fade-in">
              {/* Highlight Regulatory Alert */}
              <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 p-4.5 dark:border-amber-500/30 dark:bg-amber-500/10">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={20} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="text-[13.5px] font-bold text-amber-900 dark:text-amber-300">
                      Statutory Customs Authority Notice (Republic of Indonesia)
                    </h4>
                    <p className="mt-1 text-[12.5px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                      PortSync FTZ is a pre-filing compliance validation and decision-support system. It does not replace the statutory authority of certified Customs Brokers (PPJK) or the official determinations of the Directorate General of Customs and Excise (Direktorat Jenderal Bea dan Cukai - DJBC).
                    </p>
                  </div>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600 dark:text-cyan-400" />
                  1. Legislative Scope &amp; Regulatory Framework
                </h3>
                <p>
                  PortSync FTZ has been constructed in strict conformance with the trade facilitation and customs statutory provisions of the <strong>Batam Free Trade Zone and Free Port (Kawasan Perdagangan Bebas dan Pelabuhan Bebas Batam - KPBPB)</strong> under:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-300">
                  <li><strong>Law No. 17 of 2006</strong> amending Law No. 10 of 1995 on Customs (Undang-Undang Kepabeanan).</li>
                  <li><strong>Government Regulation (PP) No. 41 of 2021</strong> concerning the Administration of the Batam, Bintan, and Karimun Free Trade Zone and Free Port.</li>
                  <li><strong>Minister of Finance Regulation (PMK) No. 185/PMK.04/2022</strong> regarding Customs Procedures for Entering and Releasing Goods to and from Free Trade Zones.</li>
                  <li><strong>BTKI 2026 Edition</strong> (Buku Tarif Kepabeanan Indonesia) published by the Ministry of Finance.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck2 size={16} className="text-blue-600 dark:text-cyan-400" />
                  2. Mandatory Professional Verification (PPJK Requirement)
                </h3>
                <p>
                  All BTKI 8-digit tariff classifications, CIF value derivations, Lartas (prohibited/restricted) risk flags, and generated CEISA 4.0 XML/JSON payloads are provided as <em>advisory pre-declaration assessments</em>.
                </p>
                <p>
                  In accordance with Indonesian Customs Regulations, any final customs declaration (specifically PPFTZ-01 for offshore entry, PPFTZ-02 for inter-zone transfers, and PPFTZ-03 for local deliveries) transmitted to CEISA 4.0 via the National Single Window (INSW) must be authenticated and submitted under the electronic signature and license of an authorized <strong>Pengusaha Pengurusan Jasa Kepabeanan (PPJK)</strong> or licensed importer holding a valid <strong>NIB (Nomor Induk Berusaha)</strong>.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  3. Limitation of Statutory Liability
                </h3>
                <p>
                  Under no circumstances shall PortSync FTZ, its software engineers, algorithmic authors, or corporate contributors be held liable for:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-300">
                  <li>Import duty re-assessments, tax discrepancy notices (Surat Penetapan Tarif dan/atau Nilai Pabean - SPTNP), or administrative surcharges imposed by customs auditors.</li>
                  <li>Delays in physical clearance, container detention, or port demurrage incurred at Pelabuhan Batu Ampar or Sekupang terminal.</li>
                  <li>Red-channel inspections (Jalur Merah) triggered by physical discrepancy, missing surveyor reports (LS), or uncertified SNI standards.</li>
                  <li>Decisions rendered by customs officials regarding the eligibility of FTZ duty exemption versus standard MFN import duty.</li>
                </ul>
              </section>

              <section className="space-y-2 border-t border-slate-200 pt-4 dark:border-zinc-800 text-[12px] text-slate-500 dark:text-zinc-400">
                <p>
                  Official Reference: BP Batam Directorate of Customs Clearance &amp; KPU Bea dan Cukai Tipe B Batam. Last updated: October 2026.
                </p>
              </section>
            </div>
          )}

          {activeDoc === "tos" && (
            <div className="space-y-6 animate-fade-in">
              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  1. Agreement to Terms &amp; Institutional Scope
                </h3>
                <p>
                  These Terms of Service constitute a legally binding agreement between you (whether acting personally or on behalf of an enterprise, freight forwarder, or licensed customs brokerage) and PortSync Logistics Systems regarding access to the PortSync FTZ compliance and customs automation terminal.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  2. Authorized Commercial Use &amp; Broker Conduct
                </h3>
                <p>
                  You represent and warrant that:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-300">
                  <li>You maintain valid corporate standing, tax identification (NPWP), and customs permissions under Indonesian law to operate within KPBPB Batam.</li>
                  <li>Uploaded commercial invoices, packing lists, and transport documents represent genuine, unmanipulated commercial transactions.</li>
                  <li>You will not use the system to deliberately misclassify strategic export-controlled goods, dual-use technology, or prohibited narcotics/weapons.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  3. Intellectual Property &amp; Algorithmic Output
                </h3>
                <p>
                  The heuristics, extraction algorithms, validation engine rules, and user interfaces comprising PortSync FTZ are the proprietary intellectual property of PortSync Logistics Systems. The BTKI tariff nomenclature and statutory regulations incorporated within the system remain public domain property of the Ministry of Finance of the Republic of Indonesia.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  4. API Availability &amp; Gateway Upgrades
                </h3>
                <p>
                  PortSync FTZ is engineered for 99.9% uptime. However, scheduled maintenance, updates to official INSW schema versions, or interruptions on third-party customs servers (CEISA 4.0 DJBC) are beyond our control and shall not constitute a breach of service commitments.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  5. Governing Law &amp; Jurisdiction
                </h3>
                <p>
                  These terms are governed by and construed in accordance with the laws of the Republic of Indonesia. Any legal action or arbitration arising out of or related to these terms shall be instituted exclusively in the District Court of Batam (Pengadilan Negeri Batam), Riau Islands Province.
                </p>
              </section>
            </div>
          )}

          {activeDoc === "privacy" && (
            <div className="space-y-6 animate-fade-in">
              {/* Security Banner */}
              <div className="rounded-xl border border-emerald-300/80 bg-emerald-50/90 p-4.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={20} className="shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="text-[13.5px] font-bold text-emerald-900 dark:text-emerald-300">
                      Commercial Trade Secrets &amp; PDP Law Compliance
                    </h4>
                    <p className="mt-1 text-[12.5px] text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
                      We treat all commercial invoices, item unit prices, supplier names, and consignee manifests as strict trade secrets. Processing adheres to Indonesian Personal Data Protection Law (UU No. 27/2022).
                    </p>
                  </div>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  1. Zero Model Retraining on Private Invoices
                </h3>
                <p>
                  <strong>We do not use your commercial invoice text, pricing schedules, supplier masterlists, or proprietary product descriptions to train public AI models.</strong>
                </p>
                <p>
                  Our BTKI classification engine runs deterministic matching against statutory tariff registers and closed enterprise embeddings. Your trade volumes, margins, and procurement relationships remain strictly confidential to your organization.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  2. Client-Side &amp; Edge Processing Architecture
                </h3>
                <p>
                  Whenever possible, document parsing, OCR text layout recognition, and PDF rendering are conducted client-side within your browser runtime using WebAssembly and isolated Web Workers. Document bytes do not persist on external servers once classification is rendered.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  3. Encrypted Data Transmission &amp; Storage
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-zinc-300">
                  <li><strong>In Transit:</strong> All data exchanged between your client and our API endpoints is secured using TLS 1.3 cryptography with strict cipher suites.</li>
                  <li><strong>At Rest:</strong> User credentials, broker license identifiers, and audit logs are safeguarded in an enterprise libSQL/Turso cloud database with full AES-256 disk encryption.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                  4. Your Statutory Rights (UU No. 27/2022)
                </h3>
                <p>
                  Under Indonesian PDP regulations, you maintain the right to access, rectify, and permanently erase any stored declaration history, session records, or company profiles upon written request or via the terminal dashboard.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/60 text-[12px] text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Kawasan Pabean Batam Enclave Security Protocol</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 text-[12.5px] font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer transition-colors shadow-xs"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
}
