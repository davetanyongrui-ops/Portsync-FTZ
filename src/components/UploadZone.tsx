import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { FileText, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { cn } from "../lib/cn";
import type { ExtractProgress } from "../lib/ocr";

export interface UploadedFile {
  name: string;
  sizeKb: number;
  mime: string;
  pages?: number;
  /** How the text was obtained, shown so the user knows an OCR ran. */
  method?: "text-layer" | "ocr" | "mixed";
}

const ACCEPTED = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_KB = 25_000;

export function UploadZone({
  file,
  reading,
  onPick,
  onClear,
  onReject,
}: {
  file: UploadedFile | null;
  reading?: ExtractProgress | null;
  onPick: (file: File) => void;
  onClear: () => void;
  onReject: (message: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const take = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    const okType = ACCEPTED.includes(f.type) || /\.(pdf|png|jpe?g|webp)$/i.test(f.name);
    if (!okType) {
      onReject(`${f.name}: unsupported type. Accepted formats are PDF, PNG, JPG and WEBP.`);
      return;
    }
    const sizeKb = Math.round(f.size / 1024);
    if (sizeKb > MAX_KB) {
      onReject(`${f.name}: ${sizeKb.toLocaleString("en-US")} kB exceeds the 25 MB document cap.`);
      return;
    }
    onPick(f);
  };

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
      className="sr-only"
      onChange={(e) => {
        take(e.target.files);
        e.target.value = "";
      }}
    />
  );

  const dropProps = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      if (!reading) setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!reading) take(e.dataTransfer.files);
    },
    onClick: () => {
      if (!reading) inputRef.current?.click();
    },
    role: "button" as const,
    tabIndex: reading ? -1 : 0,
    onKeyDown: (e: KeyboardEvent) => {
      if (reading) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
  };

  /* ---- reading in progress ---- */
  if (reading) {
    return (
      <div>
        {picker}
        <div className="rounded-[5px] border border-brand/40 bg-brand-soft px-2.5 py-2">
          <div className="flex items-center gap-2">
            <Loader2 size={12} className="animate-spin text-brand" />
            <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-ink">
              {reading.label}
            </span>
            <span className="tnum shrink-0 font-mono text-[10px] text-ink-2">
              {Math.round(reading.pct * 100)}%
            </span>
          </div>
          <div className="mt-1.5 h-[2px] overflow-hidden rounded-full bg-brand/20">
            <div
              className="h-full bg-brand transition-[width] duration-300"
              style={{ width: `${Math.max(3, Math.round(reading.pct * 100))}%` }}
            />
          </div>
          {reading.phase === "recognise" && (
            <p className="mt-1 font-mono text-[9.5px] text-ink-3">
              Scanned page · running Tesseract OCR
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ---- a document is staged ---- */
  if (file) {
    const isPdf = /pdf/i.test(file.mime + file.name);
    const methodLabel =
      file.method === "ocr"
        ? "OCR"
        : file.method === "mixed"
          ? "text + OCR"
          : file.method === "text-layer"
            ? "text layer"
            : null;

    return (
      <div>
        {picker}
        <div
          {...dropProps}
          className={cn(
            "flex h-10 w-full cursor-pointer items-center gap-2 rounded-[5px] border px-2 transition-colors",
            dragging ? "border-brand bg-brand-soft" : "border-line-strong bg-surface hover:border-ink-3",
          )}
        >
          <span className="grid size-5 shrink-0 place-items-center rounded-[3px] bg-sunken text-ink-2">
            {isPdf ? <FileText size={11} /> : <ImageIcon size={11} />}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] text-ink">{file.name}</span>
          {methodLabel && (
            <span className="hidden shrink-0 rounded-[2px] bg-sunken px-1 font-mono text-[9px] tracking-wide text-ink-3 uppercase sm:inline">
              {methodLabel}
            </span>
          )}
          <span className="tnum hidden shrink-0 font-mono text-[10px] text-ink-3 sm:inline">
            {file.pages ? `${file.pages}p · ` : ""}
            {file.sizeKb.toLocaleString("en-US")} kB
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="grid size-5 shrink-0 cursor-pointer place-items-center rounded-[3px] text-ink-3 transition-colors hover:bg-sunken hover:text-bad"
            aria-label="Remove document"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    );
  }

  /* ---- empty ---- */
  return (
    <div>
      {picker}
      <div
        {...dropProps}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2.5 rounded-[5px] border border-dashed px-2.5 py-2 text-left transition-colors",
          dragging ? "border-brand bg-brand-soft" : "border-line-strong bg-surface hover:border-ink-3 hover:bg-sunken/60",
        )}
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-[3px] border border-line bg-sunken text-ink-3">
          <Upload size={12} strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block text-[12px] text-ink">
            {dragging ? "Release to read" : "Drop an invoice, packing list or scan"}
          </span>
          <span className="block font-mono text-[10px] text-ink-3">
            PDF · PNG · JPG — OCR runs on scans
          </span>
        </span>
      </div>
    </div>
  );
}
