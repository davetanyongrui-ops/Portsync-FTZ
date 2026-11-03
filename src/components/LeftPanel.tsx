import { useState } from "react";
import { Check, Copy, Loader2, RotateCcw, Sparkle, TriangleAlert } from "lucide-react";
import type { DemoInvoice, LineCalc } from "../types";
import { cn } from "../lib/cn";
import { Btn, Label } from "./ui";
import { DocumentView } from "./DocumentView";
import { AuditPanel } from "./AuditPanel";
import type { UploadedFile } from "./UploadZone";
import type { ExtractProgress } from "../lib/ocr";
import { UploadZone } from "./UploadZone";

export const PIPELINE = [
  "Reading document geometry",
  "Segmenting line-item table",
  "Extracting supplier grammar & CIF",
  "Matching descriptions to BTKI",
  "Applying the entry-point facility rules",
];

export type AnalyzeState = "staged" | "analyzing" | "ready";

export interface ReadDiagnostic {
  title: string;
  detail: string;
  info: string;
}

function DiagnosticCard({ d }: { d: ReadDiagnostic }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${d.title}\n${d.detail}\n---\n${d.info}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="rounded-[6px] border border-bad/35 bg-bad-soft/60 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <TriangleAlert size={13} className="mt-[2px] shrink-0 text-bad" strokeWidth={2.2} />
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-ink">{d.title}</div>
          <p className="mt-1 text-[11.5px] leading-[1.6] text-ink-2">{d.detail}</p>
          <p className="mt-1.5 text-[11px] leading-[1.6] text-ink-3">
            Tips: PDFs read best. For photos — flat, straight-on, well lit, all columns visible. Corrections are easy
            afterwards, but the line table must be found first.
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 pl-5">
        <button
          type="button"
          onClick={copy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] border border-line bg-surface px-2 py-1 font-mono text-[10px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
        >
          {copied ? <Check size={10} className="text-ok" /> : <Copy size={10} />}
          {copied ? "copied" : "copy diagnostics"}
        </button>
        <span className="font-mono text-[9.5px] text-ink-3">paste it to us via Contact to get the file fixed</span>
      </div>
    </div>
  );
}

export function LeftPanel({
  invoice,
  uploaded,
  reading,
  sourceFile,
  onUpload,
  onClearUpload,
  onReject,
  diagnostic,
  status,
  stage,
  calcs,
  activeId,
  onAnalyze,
  onReset,
}: {
  invoice: DemoInvoice | null;
  uploaded: UploadedFile | null;
  reading: ExtractProgress | null;
  /** The real file behind the parsed consignment; null before anything is uploaded. */
  sourceFile: File | null;
  onUpload: (file: File) => void;
  onClearUpload: () => void;
  onReject: (message: string) => void;
  diagnostic: ReadDiagnostic | null;
  status: AnalyzeState;
  stage: number;
  calcs: LineCalc[];
  activeId: string | null;
  onAnalyze: () => void;
  onReset: () => void;
}) {
  const analyzed = status === "ready";
  const analyzing = status === "analyzing";
  const hasDocument = invoice !== null;

  return (
    <section className="flex h-full min-h-0 w-full flex-col">
      {/* panel header — the primary action lives here so it never scrolls away */}
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-line px-3">
        <div className="min-w-0">
          <Label>Source document</Label>
          <div className="mt-0.5 truncate font-mono text-[11px] text-ink-2">
            {invoice?.fileName ?? "none loaded"}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {analyzed && (
            <Btn size="sm" variant="ghost" icon={RotateCcw} onClick={onReset} title="Reset every broker override">
              Reset
            </Btn>
          )}
          <Btn
            size="sm"
            variant="primary"
            icon={analyzing ? Loader2 : Sparkle}
            onClick={onAnalyze}
            disabled={analyzing || !hasDocument}
            className={analyzing ? "[&>svg]:animate-spin" : ""}
          >
            {analyzing ? "Classifying" : analyzed ? "Re-classify" : "Analyze & map"}
          </Btn>
        </div>
      </div>

      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <UploadZone
          file={uploaded}
          reading={reading}
          onPick={onUpload}
          onClear={onClearUpload}
          onReject={onReject}
        />

        {diagnostic && (
          <DiagnosticCard d={diagnostic} />
        )}

        {!hasDocument && !reading && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[6px] border border-dashed border-line-strong px-4 py-10 text-center">
            <div className="font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase">Three steps</div>
            <ol className="mx-auto mt-3 max-w-[320px] space-y-2.5 text-left">
              {[
                ["Drop your invoice", "PDF, scan or phone photo — it stays on your device."],
                ["Press Analyze", "The engine reads every line and matches it to the tariff book."],
                ["Read the summary", "Taxable, reduced, not taxed — with how and why for each."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-2.5">
                  <span className="grid size-4 shrink-0 place-items-center rounded-full bg-ink font-mono text-[9px] font-semibold text-paper">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[12px] font-medium text-ink">{t}</span>
                    <span className="block text-[11px] leading-snug text-ink-3">{b}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mx-auto mt-4 max-w-[320px] text-[11px] leading-relaxed text-ink-3">
              Nothing is saved or sent anywhere — when you close this tab, everything is gone.
            </p>
          </div>
        )}

        {/* classification pipeline */}
        {analyzing && (
          <div className="animate-fade rounded-[6px] border border-line bg-surface px-2.5 py-2">
            {PIPELINE.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "flex items-center gap-2 py-[3px] font-mono text-[10.5px] transition-colors",
                  i < stage ? "text-ink-3" : i === stage ? "text-ink" : "text-ink-3/50",
                )}
              >
                <span
                  className={cn(
                    "grid size-3 shrink-0 place-items-center rounded-[2px] border",
                    i < stage ? "border-ok/40 bg-ok-soft" : i === stage ? "border-brand/50 bg-brand-soft" : "border-line",
                  )}
                >
                  {i < stage && <Check size={7} strokeWidth={3.5} className="text-ok" />}
                </span>
                {s}
              </div>
            ))}
          </div>
        )}

        {sourceFile && (
          <DocumentView file={sourceFile} activePos={calcs.find((c) => c.id === activeId)?.pos ?? null} />
        )}

        {invoice && <AuditPanel invoice={invoice} calcs={calcs} ready={analyzed} />}
      </div>
    </section>
  );
}
