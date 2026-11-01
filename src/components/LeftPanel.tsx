import { Check, Loader2, RotateCcw, Sparkle } from "lucide-react";
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

export function LeftPanel({
  invoice,
  uploaded,
  reading,
  sourceFile,
  onUpload,
  onClearUpload,
  onReject,
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

        {!hasDocument && !reading && (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[6px] border border-dashed border-line-strong px-4 py-10 text-center">
            <div className="font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase">No document</div>
            <p className="mx-auto mt-2 max-w-[320px] text-[12px] leading-relaxed text-ink-2">
              Load a commercial invoice to begin. Nothing is preloaded and nothing is saved — the consignment you see is
              only ever the file you supplied.
            </p>
            <ul className="mx-auto mt-3 max-w-[320px] space-y-1 text-left font-mono text-[10px] leading-relaxed text-ink-3">
              <li>· digital PDF — text layer read directly</li>
              <li>· scanned PDF or photo — Tesseract OCR</li>
              <li>· needs a quantity, a unit and a unit price per line</li>
            </ul>
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
