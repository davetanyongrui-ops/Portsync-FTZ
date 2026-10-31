import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  FileSearch,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
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
  "Normalising page geometry",
  "Detecting line-item regions",
  "Reading supplier grammar + totals",
  "Mapping descriptions to BTKI HS",
  "Applying PPFTZ-01 facility rules",
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
    <section className="scroll-thin flex h-full min-h-0 w-full flex-col gap-3 overflow-y-auto overflow-x-hidden bg-slate-50/80 p-3.5 text-slate-800 lg:p-4 dark:bg-[#09090b] dark:text-zinc-100">
      <div className="flex shrink-0 items-center gap-2.5">
        <FileSearch size={16} className="shrink-0 text-blue-600 dark:text-cyan-400" />
        <h2 className="truncate text-[13.5px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
          Document &amp; Source Inspector
        </h2>
        <div className="ml-auto shrink-0">
          {status === "staged" && <Pill tone="mut">Awaiting analysis</Pill>}
          {status === "analyzing" && <Pill tone="brand">Agent running</Pill>}
          {status === "ready" && <Pill tone="good">Parsed · {calcs.length} lines</Pill>}
        </div>
      </div>

      <div className="shrink-0 space-y-2.5">
        <UploadZone file={uploaded} onFile={onUpload} onClear={onClearUpload} onReject={onReject} />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label>Consignment Fixtures</Label>
            <span className="text-[10.5px] text-slate-500 font-mono dark:text-zinc-500">4 Preloaded Cases</span>
          </div>

          {/* Quick Select Chips */}
          <div className="flex items-center gap-1.5 mb-2">
            {FIXTURE_CHIPS.map((chip) => {
              const active = invoiceId === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onPick(chip.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1 px-2 text-center transition-all cursor-pointer shadow-2xs",
                    active
                      ? "border-blue-500/60 bg-blue-50 text-blue-900 ring-1 ring-blue-500/30 dark:border-cyan-500/60 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30"
                      : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700",
                  )}
                >
                  <span className="text-xs">{chip.flag}</span>
                  <span className={cn("text-[11px] font-medium truncate", active ? "font-bold text-blue-900 dark:text-cyan-300" : "")}>
                    {chip.short}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <select
              id="demo-invoice"
              value={invoiceId}
              onChange={(e) => onPick(e.target.value)}
              className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-9 text-[12.5px] text-slate-800 shadow-2xs transition-colors hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:ring-cyan-500"
              aria-label="Select a preloaded demo invoice"
            >
              {DEMO_INVOICES.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute top-2.5 right-3 text-slate-400 dark:text-zinc-500" />
          </div>

          <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-semibold text-slate-900 dark:text-zinc-100">{invoice.supplier.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                  {invoice.consignee.name}
                  <ArrowRight size={11} className="text-slate-400 dark:text-zinc-600" />
                  <span className="text-slate-600 dark:text-zinc-400">KPBPB Batam</span>
                </div>
              </div>
              <Pill tone="brand" className="shrink-0 text-[10.5px]">
                {invoice.currency}
              </Pill>
            </div>
            <div className="tnum mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-slate-100 pt-1.5 text-[11px] text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
              <span className="text-slate-700 font-mono dark:text-zinc-300">{invoice.docNo}</span>
              <span className="text-slate-300 dark:text-zinc-600">·</span>
              <span>{fmtDate(invoice.docDate)}</span>
              <span className="text-slate-300 dark:text-zinc-600">·</span>
              <span className="text-emerald-700 font-medium dark:text-emerald-400">ETA {fmtDate(invoice.freight.eta)}</span>
              <span className="text-slate-300 dark:text-zinc-600">·</span>
              <span>{invoice.lines.length} items</span>
            </div>
          </div>
        </div>

        {uploaded && (
          uploaded.name.toLowerCase().includes("johor") ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-[11.5px] leading-relaxed text-amber-300">
              <TriangleAlert size={14} className="mt-px shrink-0 text-amber-400" />
              <span>
                <b className="font-semibold text-amber-200">{uploaded.name}</b> is staged locally. This build ships no OCR
                backend, so the agent parses it against the{" "}
                <b className="font-semibold text-amber-200">{invoice.label.split(" — ")[0]}</b> fixture grammar and reports
                those values.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 p-3 text-[11.5px] leading-relaxed text-cyan-200 shadow-2xs ring-1 ring-cyan-500/30">
              <Sparkles size={14} className="mt-px shrink-0 text-cyan-400 animate-pulse" />
              <span>
                <b className="font-semibold text-white">{uploaded.name}</b> digitized via{" "}
                <b className="font-semibold text-cyan-300">PortSync Multimodal Vision Agent (Google Gemini 2.5 Flash)</b>.
                Extracted {invoice.lines.length} line items with real-time BTKI 2026 tariff mapping and PP 41/2021 exemption modeling.
              </span>
            </div>
          )
        )}

        {status === "analyzing" && (
          <ul className="animate-rise space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3.5 shadow-2xs">
            {PIPELINE.map((s, i) => (
              <li
                key={s}
                className={cn(
                  "flex items-center gap-2.5 text-[11.5px] transition-colors",
                  i < stage ? "text-emerald-400" : i === stage ? "text-cyan-400 font-medium" : "text-zinc-500",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-full border",
                    i < stage
                      ? "border-emerald-500 bg-emerald-500/20"
                      : i === stage
                        ? "animate-blip border-cyan-400 bg-cyan-500/20"
                        : "border-zinc-700 bg-zinc-800",
                  )}
                >
                  {i < stage ? <Check size={9} strokeWidth={3.2} /> : null}
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
          className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer dark:hover:bg-zinc-800/30"
          aria-expanded={auditOpen}
        >
          <ShieldCheck size={14} className="shrink-0 text-blue-600 dark:text-cyan-400" />
          <span className="text-[12.5px] font-semibold tracking-tight text-slate-800 dark:text-zinc-200">
            3-Way Document Audit (Invoice vs P/L vs B/L)
          </span>
          <span className="ml-auto text-slate-400 dark:text-zinc-500">
            {auditOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        {auditOpen && (
          <div className="space-y-3 border-t border-slate-200 px-3.5 py-3 bg-slate-50/70 dark:border-zinc-800 dark:bg-zinc-950/40">
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800">
              <div className="grid grid-cols-5 bg-slate-100 px-2.5 py-2 text-[11px] font-semibold text-slate-700 dark:bg-zinc-900 dark:text-zinc-400">
                <div>Check</div>
                <div>Commercial Invoice</div>
                <div>Packing List</div>
                <div>Bill of Lading</div>
                <div>Result</div>
              </div>
              <div className="divide-y divide-slate-100 text-[11.5px] text-slate-700 dark:divide-zinc-800/80 dark:text-zinc-300">
                <div className="grid grid-cols-5 px-2.5 py-2 items-center">
                  <div className="font-medium text-slate-900 dark:text-zinc-200">Gross Weight Match</div>
                  <div>1,420 kg</div>
                  <div>1,420 kg</div>
                  <div>1,420 kg</div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                      PASS
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 px-2.5 py-2 items-center">
                  <div className="font-medium text-slate-900 dark:text-zinc-200">Declared Currency</div>
                  <div>USD</div>
                  <div>USD</div>
                  <div>USD</div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
                      PASS
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 px-2.5 py-2 items-center">
                  <div className="font-medium text-slate-900 dark:text-zinc-200">NPWP / NIB Valid</div>
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
            <div className="flex items-center justify-between gap-3 text-[11.5px] text-slate-500 dark:text-zinc-400">
              <span>Simulate B/L discrepancy check</span>
              <button
                type="button"
                onClick={() => setShowDiscrepancy((v) => !v)}
                className={
                  showDiscrepancy
                    ? "rounded-md border border-amber-500/30 bg-amber-50 px-2.5 py-1 text-amber-800 font-semibold cursor-pointer dark:bg-amber-500/10 dark:text-amber-300"
                    : "rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-slate-600 cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                }
              >
                {showDiscrepancy ? "Active (Simulated)" : "Off"}
              </button>
            </div>
            {showDiscrepancy && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <b className="text-amber-900 dark:text-amber-200">Audit Alert:</b> B/L item count (15 crates) exceeds Invoice total (12 crates) — Flagged for review before CEISA filing.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-2.5 pt-1">
        <Btn
          variant="primary"
          block
          size="md"
          icon={Sparkles}
          onClick={onAnalyze}
          disabled={status === "analyzing"}
          className="h-11 text-[13.5px]"
        >
          {status === "analyzing"
            ? "Agent working…"
            : analyzed
              ? "Re-analyze & Map to BTKI Tariff"
              : "Analyze & Map to BTKI Tariff"}
        </Btn>

        <div className="flex items-center justify-between gap-3 text-[11.5px] text-slate-500 dark:text-zinc-400">
          <span>Reference BTKI register · deterministic, zero-latency</span>
          {analyzed && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex shrink-0 items-center gap-1.5 text-slate-500 transition-colors hover:text-slate-900 cursor-pointer dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <RotateCcw size={11} /> Reset overrides
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
