import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  FileSearch,
  RotateCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { DemoInvoice, LineCalc } from "../types";
import { DEMO_INVOICES } from "../data/fixtures";
import { fmtDate } from "../lib/format";
import { cn } from "../lib/cn";
import { Btn, Label, Pill } from "./ui";
import { InvoicePage } from "./InvoicePage";
import type { UploadedFile } from "./UploadZone";
import { UploadZone } from "./UploadZone";

export const PIPELINE = [
  "Normalising document geometry",
  "Segmenting line-item table coordinates",
  "Extracting supplier grammar & CIF totals",
  "Matching descriptions to BTKI 8-digit tariff",
  "Evaluating Batam PPFTZ-01 facility exemption",
];

export type AnalyzeState = "staged" | "analyzing" | "ready";

const FIXTURE_CHIPS = [
  { id: "smp", flag: "🇸🇬", short: "Singapore Precision", tag: "8 Lines · Alloy", origin: "SG" },
  { id: "gt", flag: "🇨🇳", short: "Greentech Shenzhen", tag: "5 Lines · Solar/ESS", origin: "CN" },
  { id: "jis", flag: "🇲🇾", short: "Johor Industrial", tag: "7 Lines · Valves/AD", origin: "MY" },
  { id: "nx", flag: "🇮🇩", short: "Batam FTZ Sample", tag: "5 Lines · Robotics/AGV", origin: "SG" },
];

export function LeftPanel({
  invoice,
  invoiceId,
  onPick,
  uploaded,
  onUpload,
  onClearUpload,
  onReject,
  status,
  stage,
  calcs,
  activeId,
  onActive,
  onAnalyze,
  onReset,
}: {
  invoice: DemoInvoice;
  invoiceId: string;
  onPick: (id: string) => void;
  uploaded: UploadedFile | null;
  onUpload: (f: UploadedFile) => void;
  onClearUpload: () => void;
  onReject: (message: string) => void;
  status: AnalyzeState;
  stage: number;
  calcs: LineCalc[];
  activeId: string | null;
  onActive: (id: string | null) => void;
  onAnalyze: () => void;
  onReset: () => void;
}) {
  const analyzed = status === "ready";
  const [auditOpen, setAuditOpen] = useState(false);
  const [showDiscrepancy, setShowDiscrepancy] = useState(true);

  return (
    <section className="scroll-thin flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto overflow-x-hidden bg-slate-50/70 p-4.5 text-slate-800 lg:p-6 dark:bg-[#0c0d0e] dark:text-zinc-100">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg border border-blue-500/30 bg-blue-50 text-blue-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400">
          <FileSearch size={17} strokeWidth={2.2} />
        </div>
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Document &amp; Manifest Inspector
          </h2>
          <div className="text-[11.5px] text-slate-500 dark:text-zinc-400">
            Source document extraction &amp; optical validation
          </div>
        </div>
        <div className="ml-auto shrink-0">
          {status === "staged" && <Pill tone="mut">Awaiting analysis</Pill>}
          {status === "analyzing" && <Pill tone="brand">Extraction running</Pill>}
          {status === "ready" && <Pill tone="good">Parsed · {calcs.length} lines</Pill>}
        </div>
      </div>

      <div className="shrink-0 space-y-3.5">
        <UploadZone file={uploaded} onFile={onUpload} onClear={onClearUpload} onReject={onReject} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Consignment Fixtures</Label>
            <span className="text-[11px] text-slate-500 font-mono dark:text-zinc-400">
              4 Pre-audited Manifests
            </span>
          </div>

          {/* Clean 2-column or wrapping selector */}
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            {uploaded && !uploaded.name.toLowerCase().includes("johor") && (
              <button
                type="button"
                onClick={() => onPick(invoice.id)}
                className={cn(
                  "col-span-2 flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all cursor-pointer shadow-2xs",
                  invoice.id.startsWith("uploaded-")
                    ? "border-blue-500/60 bg-blue-50 text-blue-900 ring-1 ring-blue-500/30 dark:border-cyan-500/60 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30 font-semibold"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300",
                )}
                title={uploaded.name}
              >
                <span className="text-sm">📄</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold truncate">{uploaded.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Custom Uploaded Consignment</div>
                </div>
              </button>
            )}

            {FIXTURE_CHIPS.map((chip) => {
              const active = invoiceId === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onPick(chip.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all cursor-pointer shadow-2xs",
                    active
                      ? "border-blue-500/60 bg-blue-50 text-blue-950 ring-1 ring-blue-500/40 dark:border-cyan-500/60 dark:bg-cyan-500/10 dark:text-cyan-200 dark:ring-cyan-500/30 font-semibold"
                      : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-zinc-700",
                  )}
                >
                  <span className="text-base">{chip.flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold truncate text-slate-900 dark:text-zinc-100">
                      {chip.short}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                      {chip.tag}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <select
              id="demo-invoice"
              value={invoiceId}
              onChange={(e) => onPick(e.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-300 bg-white px-3.5 pr-10 text-[13px] font-medium text-slate-800 shadow-2xs transition-colors hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:ring-cyan-500"
              aria-label="Select a preloaded demo invoice"
            >
              {!DEMO_INVOICES.some((inv) => inv.id === invoiceId) && (
                <option value={invoiceId}>
                  📄 [Custom Upload] {invoice.label}
                </option>
              )}
              {DEMO_INVOICES.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.label}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute top-3 right-3 text-slate-400 dark:text-zinc-500" />
          </div>

          <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-slate-900 dark:text-zinc-100">
                  {invoice.supplier.name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11.5px] text-slate-500 dark:text-zinc-400">
                  <span>{invoice.consignee.name}</span>
                  <ArrowRight size={12} className="text-slate-400 dark:text-zinc-600" />
                  <span className="font-medium text-slate-700 dark:text-zinc-300">KPBPB Batam Enclave</span>
                </div>
              </div>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                {invoice.currency}
              </span>
            </div>
            <div className="mt-2.5 border-t border-slate-100 pt-2 flex items-center justify-between text-[11.5px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
              <span>Dated: {fmtDate(invoice.docDate)}</span>
              <span>Incoterm: <strong className="text-slate-700 dark:text-zinc-300">{invoice.freight.incoterm}</strong></span>
            </div>
          </div>
        </div>

        {uploaded && invoice.id.startsWith("uploaded-") && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-50/90 p-3.5 text-[12px] leading-relaxed text-blue-950 shadow-2xs dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-200">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-blue-600 dark:text-cyan-400" />
            <div>
              <strong className="font-semibold text-blue-950 dark:text-white">{uploaded.name}</strong> digitized via PortSync Automated Customs Vision Engine.
              Extracted {invoice.lines.length} lines with real-time BTKI tariff mapping under PMK 185/2022.
            </div>
          </div>
        )}

        {status === "analyzing" && (
          <ul className="animate-rise space-y-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
            {PIPELINE.map((s, i) => (
              <li
                key={s}
                className={cn(
                  "flex items-center gap-3 text-[12px] transition-colors",
                  i < stage ? "text-emerald-700 dark:text-emerald-400 font-medium" : i === stage ? "text-blue-600 dark:text-cyan-400 font-semibold" : "text-slate-400 dark:text-zinc-500",
                )}
              >
                <span
                  className={cn(
                    "grid size-4.5 shrink-0 place-items-center rounded-full border",
                    i < stage
                      ? "border-emerald-500 bg-emerald-500/20"
                      : i === stage
                        ? "animate-blip border-blue-500 bg-blue-500/20 dark:border-cyan-400 dark:bg-cyan-500/20"
                        : "border-slate-300 bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800",
                  )}
                >
                  {i < stage ? <Check size={10} strokeWidth={3.2} /> : null}
                </span>
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <InvoicePage
        invoice={invoice}
        calcs={calcs}
        analyzed={analyzed}
        analyzing={status === "analyzing"}
        activeId={activeId}
        onActive={onActive}
      />

      {/* 3-Way Document Audit Visualizer */}
      <div className="shrink-0 rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <button
          type="button"
          onClick={() => setAuditOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors cursor-pointer dark:hover:bg-zinc-800/30"
          aria-expanded={auditOpen}
        >
          <ShieldCheck size={16} className="shrink-0 text-blue-600 dark:text-cyan-400" />
          <span className="text-[13px] font-bold tracking-tight text-slate-800 dark:text-zinc-200">
            3-Way Cross-Document Audit (Invoice vs P/L vs B/L)
          </span>
          <span className="ml-auto text-slate-400 dark:text-zinc-500">
            {auditOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
        </button>
        {auditOpen && (
          <div className="space-y-3.5 border-t border-slate-200 px-4 py-3.5 bg-slate-50/70 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
              <div className="grid grid-cols-5 bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider dark:bg-zinc-900 dark:text-zinc-400">
                <div>Check</div>
                <div>Commercial Inv</div>
                <div>Packing List</div>
                <div>Bill of Lading</div>
                <div>Audit Result</div>
              </div>
              <div className="divide-y divide-slate-100 text-[12px] text-slate-700 dark:divide-zinc-800/80 dark:text-zinc-300">
                <div className="grid grid-cols-5 px-3 py-2.5 items-center">
                  <div className="font-semibold text-slate-900 dark:text-zinc-200">Gross Weight</div>
                  <div>1,420 kg</div>
                  <div>1,420 kg</div>
                  <div>1,420 kg</div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                      PASS
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 px-3 py-2.5 items-center">
                  <div className="font-semibold text-slate-900 dark:text-zinc-200">Declared Currency</div>
                  <div>USD</div>
                  <div>USD</div>
                  <div>USD</div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                      PASS
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 px-3 py-2.5 items-center">
                  <div className="font-semibold text-slate-900 dark:text-zinc-200">NIB / PPJK Standing</div>
                  <div>Active (OSS)</div>
                  <div>Active (OSS)</div>
                  <div>Active (OSS)</div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                      VERIFIED
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 text-[12px] text-slate-500 dark:text-zinc-400">
              <span>B/L Crate Discrepancy Simulator</span>
              <button
                type="button"
                onClick={() => setShowDiscrepancy((v) => !v)}
                className={
                  showDiscrepancy
                    ? "rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-1 text-amber-800 font-semibold cursor-pointer dark:bg-amber-500/10 dark:text-amber-300"
                    : "rounded-lg border border-slate-300 bg-slate-100 px-3 py-1 text-slate-600 cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                }
              >
                {showDiscrepancy ? "Alert Active" : "Disabled"}
              </button>
            </div>
            {showDiscrepancy && (
              <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 px-3.5 py-2.5 text-[12px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                <strong className="font-bold text-amber-950 dark:text-amber-200">Pre-Filing Discrepancy:</strong> B/L count (15 crates) exceeds commercial invoice total (12 crates) — Flagged to prevent Jalur Merah inspection delay.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-3 pt-1">
        <Btn
          variant="primary"
          block
          size="md"
          icon={Zap}
          onClick={onAnalyze}
          disabled={status === "analyzing"}
          className="h-11.5 text-[14px]"
        >
          {status === "analyzing"
            ? "Executing extraction & BTKI classification…"
            : analyzed
              ? "Re-analyze & Map to BTKI Tariff"
              : "Analyze & Map to BTKI Tariff"}
        </Btn>

        <div className="flex items-center justify-between gap-3 text-[12px] text-slate-500 dark:text-zinc-400">
          <span>BTKI 2026 Reference Register · Deterministic</span>
          {analyzed && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex shrink-0 items-center gap-1.5 font-medium text-slate-600 transition-colors hover:text-slate-900 cursor-pointer dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <RotateCcw size={12} /> Reset overrides
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
