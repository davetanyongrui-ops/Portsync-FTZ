import { useState } from "react";
import { ArrowRight, Check, ChevronDown, ChevronRight, FileSearch, RotateCcw, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import type { DemoInvoice, LineCalc } from "../types";
import { fmtDate } from "../lib/format";
import { cn } from "../lib/cn";
import { Btn, Pill } from "./ui";
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

export function LeftPanel({
  invoice,
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
    <section className="scroll-thin flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto bg-slate-50/70 p-5">
      <div className="flex shrink-0 items-center gap-2.5">
        <FileSearch size={16} className="shrink-0 text-blue-600" />
        <h2 className="truncate text-[13.5px] font-semibold tracking-tight text-slate-900">
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

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-slate-900">{invoice.supplier.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[11.5px] text-slate-500">
                {invoice.consignee.name}
                <ArrowRight size={11} className="text-slate-400" />
                <span className="text-slate-400">KPBPB Batam</span>
              </div>
            </div>
            <Pill tone="brand" className="shrink-0">
              {invoice.currency}
            </Pill>
          </div>
          <div className="tnum mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-200/70 pt-2.5 text-[11.5px] text-slate-500">
            <span>{invoice.docNo}</span>
            <span className="text-slate-300">·</span>
            <span>{fmtDate(invoice.docDate)}</span>
            <span className="text-slate-300">·</span>
            <span>ETA {fmtDate(invoice.freight.eta)}</span>
            <span className="text-slate-300">·</span>
            <span>{invoice.lines.length} line items</span>
          </div>
          <p className="mt-2.5 text-[12px] leading-relaxed text-slate-500 italic">{invoice.headline}</p>
        </div>

        {uploaded && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11.5px] leading-relaxed text-amber-800">
            <TriangleAlert size={14} className="mt-px shrink-0 text-amber-500" />
            <span>
              <b className="font-semibold text-amber-900">{uploaded.name}</b> is staged locally. This build ships no OCR
              backend, so the agent parses it against the fixture grammar and reports those values.
            </span>
          </div>
        )}

        {status === "analyzing" && (
          <ul className="animate-rise space-y-1.5 rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
            {PIPELINE.map((s, i) => (
              <li
                key={s}
                className={cn(
                  "flex items-center gap-2.5 text-[11.5px] transition-colors",
                  i < stage ? "text-emerald-600" : i === stage ? "text-blue-600" : "text-slate-400",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded-full border",
                    i < stage
                      ? "border-emerald-400 bg-emerald-50"
                      : i === stage
                        ? "animate-blip border-blue-400 bg-blue-50"
                        : "border-slate-300",
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
        activeId={activeId}
        onActive={onActive}
      />

      <div className="shrink-0 rounded-xl border border-slate-200 bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => setAuditOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
          aria-expanded={auditOpen}
        >
          <ShieldCheck size={14} className="shrink-0 text-blue-600" />
          <span className="text-[12.5px] font-semibold tracking-tight text-slate-900">3-Way Document Audit</span>
          <span className="ml-auto text-slate-400">
            {auditOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </button>
        {auditOpen && (
          <div className="space-y-3 border-t border-slate-200/70 px-3.5 py-3">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-5 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <div className="px-2.5 py-2">Check</div>
                <div className="px-2.5 py-2">Commercial Invoice</div>
                <div className="px-2.5 py-2">Packing List</div>
                <div className="px-2.5 py-2">Bill of Lading</div>
                <div className="px-2.5 py-2">Result</div>
              </div>
              <div className="divide-y divide-slate-100 text-[11.5px] text-slate-700">
                <div className="grid grid-cols-5">
                  <div className="px-2.5 py-2">Gross Weight Match</div>
                  <div className="px-2.5 py-2">1,420 kg</div>
                  <div className="px-2.5 py-2">1,420 kg</div>
                  <div className="px-2.5 py-2">1,420 kg</div>
                  <div className="px-2.5 py-2">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                      PASS
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5">
                  <div className="px-2.5 py-2">Declared Currency</div>
                  <div className="px-2.5 py-2">USD</div>
                  <div className="px-2.5 py-2">USD</div>
                  <div className="px-2.5 py-2">USD</div>
                  <div className="px-2.5 py-2">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                      PASS
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-5">
                  <div className="px-2.5 py-2">Consignee NPWP / NIB Registration</div>
                  <div className="px-2.5 py-2">Active</div>
                  <div className="px-2.5 py-2">Active</div>
                  <div className="px-2.5 py-2">Active</div>
                  <div className="px-2.5 py-2">
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                      VERIFIED
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11.5px] text-slate-500">
              <span>Simulate B/L discrepancy</span>
              <button
                type="button"
                onClick={() => setShowDiscrepancy((v) => !v)}
                className={
                  showDiscrepancy
                    ? "rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-amber-700"
                    : "rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-500"
                }
              >
                {showDiscrepancy ? "On" : "Off"}
              </button>
            </div>
            {showDiscrepancy && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800">
                Alert: B/L item count (15 crates) exceeds Invoice total (12 crates) - Flagged for review before CEISA
                filing.
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

        <div className="flex items-center justify-between gap-3 text-[11.5px] text-slate-500">
          <span>Reference BTKI register · deterministic, zero-latency</span>
          {analyzed && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex shrink-0 items-center gap-1.5 text-slate-500 transition-colors hover:text-slate-900"
            >
              <RotateCcw size={11} /> Reset overrides
            </button>
          )}
        </div>
      </div>
    </section>
  );
}