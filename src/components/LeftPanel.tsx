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
    <section className="scroll-thin flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto bg-zinc-950/60 p-5">
      <div className="flex shrink-0 items-center gap-2.5">
        <FileSearch size={16} className="shrink-0 text-cyan-400" />
        <h2 className="truncate text-[13.5px] font-semibold tracking-tight text-zinc-100">
          Document &amp; Source Inspector
        </h2>
        <div className="ml-auto shrink-0">
          {status === "staged" && <Pill tone="mut">Awaiting analysis</Pill>}
          {status === "analyzing" && <Pill tone="brand">Agent running</Pill>}
          {status === "ready" && <Pill tone="good">Parsed · {calcs.length} lines</Pill>}
        </div>
      </div>

      <div className="shrink-0 space-y-4">
        <UploadZone file={uploaded} onFile={onUpload} onClear={onClearUpload} onReject={onReject} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Consignment Fixtures</Label>
            <span className="text-[11px] text-zinc-500 font-mono">3 Preloaded Cases</span>
          </div>

          {/* Quick Select Chips */}
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            {FIXTURE_CHIPS.map((chip) => {
              const active = invoiceId === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onPick(chip.id)}
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-2 text-left transition-all cursor-pointer",
                    active
                      ? "border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30"
                      : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/50",
                  )}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <span className="text-sm">{chip.flag}</span>
                    <span className={cn("text-[11.5px] font-medium truncate", active ? "text-cyan-300" : "text-zinc-300")}>
                      {chip.short}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 font-mono">{chip.tag}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <select
              id="demo-invoice"
              value={invoiceId}
              onChange={(e) => onPick(e.target.value)}
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 pr-9 text-[13px] text-zinc-200 transition-colors hover:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              aria-label="Select a preloaded demo invoice"
            >
              {DEMO_INVOICES.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute top-3 right-3 text-zinc-500" />
          </div>

          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-zinc-100">{invoice.supplier.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-zinc-400">
                  {invoice.consignee.name}
                  <ArrowRight size={11} className="text-zinc-600" />
                  <span className="text-zinc-400">KPBPB Batam</span>
                </div>
              </div>
              <Pill tone="brand" className="shrink-0">
                {invoice.currency}
              </Pill>
            </div>
            <div className="tnum mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-zinc-800 pt-2.5 text-[11.5px] text-zinc-400">
              <span className="text-zinc-300 font-mono">{invoice.docNo}</span>
              <span className="text-zinc-600">·</span>
              <span>{fmtDate(invoice.docDate)}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-emerald-400">ETA {fmtDate(invoice.freight.eta)}</span>
              <span className="text-zinc-600">·</span>
              <span>{invoice.lines.length} line items</span>
            </div>
            <p className="mt-2.5 text-[12px] leading-relaxed text-zinc-400 italic">{invoice.headline}</p>
          </div>
        </div>

        {uploaded && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-[11.5px] leading-relaxed text-amber-300">
            <TriangleAlert size={14} className="mt-px shrink-0 text-amber-400" />
            <span>
              <b className="font-semibold text-amber-200">{uploaded.name}</b> is staged locally. This build ships no OCR
              backend, so the agent parses it against the{" "}
              <b className="font-semibold text-amber-200">{invoice.label.split(" — ")[0]}</b> fixture grammar and reports
              those values.
            </span>
          </div>
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
      <div className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-2xs">
        <button
          type="button"
          onClick={() => setAuditOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left hover:bg-zinc-800/30 transition-colors cursor-pointer"
          aria-expanded={auditOpen}
        >
          <ShieldCheck size={14} className="shrink-0 text-cyan-400" />
          <span className="text-[12.5px] font-semibold tracking-tight text-zinc-200">
            3-Way Document Audit (Invoice vs P/L vs B/L)
          </span>
          <span className="ml-auto text-zinc-500">
            {auditOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        {auditOpen && (
          <div className="space-y-3 border-t border-zinc-800 px-3.5 py-3 bg-zinc-950/40">
            <div className="overflow-hidden rounded-lg border border-zinc-800">
              <div className="grid grid-cols-5 bg-zinc-900 px-2.5 py-2 text-[11px] font-semibold text-zinc-400">
                <div>Check</div>
                <div>Commercial Invoice</div>
                <div>Packing List</div>
                <div>Bill of Lading</div>
                <div>Result</div>
              </div>
              <div className="divide-y divide-zinc-800/80 text-[11.5px] text-zinc-300">
                <div className="grid grid-cols-5 px-2.5 py-2 items-center">
                  <div className="font-medium text-zinc-200">Gross Weight Match</div>
                  <div>1,420 kg</div>
                  <div>1,420 kg</div>
                  <div>1,420 kg</div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-medium text-emerald-400">
                      PASS
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 px-2.5 py-2 items-center">
                  <div className="font-medium text-zinc-200">Declared Currency</div>
                  <div>USD</div>
                  <div>USD</div>
                  <div>USD</div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-medium text-emerald-400">
                      PASS
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5 px-2.5 py-2 items-center">
                  <div className="font-medium text-zinc-200">NPWP / NIB Valid</div>
                  <div>Active (OSS)</div>
                  <div>Active (OSS)</div>
                  <div>Active (OSS)</div>
                  <div>
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-medium text-emerald-400">
                      VERIFIED
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11.5px] text-zinc-400">
              <span>Simulate B/L discrepancy check</span>
              <button
                type="button"
                onClick={() => setShowDiscrepancy((v) => !v)}
                className={
                  showDiscrepancy
                    ? "rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-300 font-medium cursor-pointer"
                    : "rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-zinc-400 cursor-pointer"
                }
              >
                {showDiscrepancy ? "Active (Simulated)" : "Off"}
              </button>
            </div>
            {showDiscrepancy && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-300">
                <b className="text-amber-200">Audit Alert:</b> B/L item count (15 crates) exceeds Invoice total (12 crates) — Flagged for review before CEISA filing.
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

        <div className="flex items-center justify-between gap-3 text-[11.5px] text-zinc-400">
          <span>Reference BTKI register · deterministic, zero-latency</span>
          {analyzed && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex shrink-0 items-center gap-1.5 text-zinc-400 transition-colors hover:text-zinc-100 cursor-pointer"
            >
              <RotateCcw size={11} /> Reset overrides
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
