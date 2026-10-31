import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { CloudUpload, FileText, Image as ImageIcon, Paperclip, X } from "lucide-react";
import { cn } from "../lib/cn";
import { Label } from "./ui";
import { extractPdfText } from "../lib/pdf";

export interface UploadedFile {
  name: string;
  sizeKb: number;
  mime: string;
  extractedText?: string;
}

const ACCEPTED = ["application/pdf", "image/png", "image/jpeg"];
const MAX_KB = 25_000;

export function UploadZone({
  file,
  onFile,
  onClear,
  onReject,
}: {
  file: UploadedFile | null;
  onFile: (f: UploadedFile) => void;
  onClear: () => void;
  onReject: (message: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const take = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    const okType = ACCEPTED.includes(f.type) || /\.(pdf|png|jpe?g)$/i.test(f.name);
    if (!okType) {
      onReject(`${f.name}: unsupported type. Accepted PDF, PNG, JPG.`);
      return;
    }
    const sizeKb = Math.round(f.size / 1024);
    if (sizeKb > MAX_KB) {
      onReject(`${f.name}: ${sizeKb} kB exceeds the 25 MB document cap.`);
      return;
    }
    const base = { name: f.name, sizeKb, mime: f.type || "application/octet-stream" };
    onFile(base);
    if (/\.pdf$/i.test(f.name)) {
      extractPdfText(f)
        .then((txt) => {
          if (txt && txt.trim().length > 0) {
            onFile({ ...base, extractedText: txt });
          }
        })
        .catch(() => {});
    }
  };

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
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
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      take(e.dataTransfer.files);
    },
    onClick: () => inputRef.current?.click(),
    role: "button" as const,
    tabIndex: 0,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
  };

  if (file) {
    const isPdf = /pdf/i.test(file.mime + file.name);
    return (
      <div>
        <Label className="mb-2">Source Document</Label>
        {picker}
        <div
          {...dropProps}
          className={cn(
            "flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-dashed px-3 transition-colors",
            dragging ? "border-emerald-500/70 bg-emerald-500/10" : "border-zinc-700 bg-zinc-900/60 hover:border-zinc-500",
          )}
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-md border border-zinc-700 bg-zinc-800 text-cyan-400">
            {isPdf ? <FileText size={12} /> : <ImageIcon size={12} />}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-zinc-200">{file.name}</span>
          <span className="tnum hidden shrink-0 text-[11px] text-zinc-400 sm:inline">
            {file.sizeKb.toLocaleString("en-US")} kB · staged locally
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="grid size-6 shrink-0 place-items-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:border-rose-400 hover:text-rose-400"
            aria-label="Remove document"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label className="mb-2">Source Document</Label>
      {picker}
      <div
        {...dropProps}
        className={cn(
          "group flex items-center gap-3 rounded-xl border border-dashed px-3.5 py-3 text-left transition-colors cursor-pointer",
          dragging
            ? "border-emerald-500/70 bg-emerald-500/10"
            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80",
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors group-hover:border-cyan-500/40 group-hover:text-cyan-400">
          <CloudUpload size={17} />
        </span>
        <span className="min-w-0">
          <span className="block text-[12.5px] font-medium text-zinc-200">
            {dragging ? "Release to stage the document" : "Drop invoice or shipping manifest"}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Paperclip size={11} className="text-zinc-500" />
            PDF, PNG, JPG up to 25 MB — or pick a fixture below
          </span>
        </span>
      </div>
    </div>
  );
}
