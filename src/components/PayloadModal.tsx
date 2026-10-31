import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Braces, Copy, Download, ShieldCheck, X } from "lucide-react";
import { copyText, downloadText } from "../lib/download";
import { cn } from "../lib/cn";
import { Btn, Pill, type Tone } from "./ui";

const JSON_TOKEN =
  /("(?:[^"\\]|\\.)*")(?=\s*:)|("(?:[^"\\]|\\.)*")|(-?\b\d+(?:\.\d+)?\b)|\b(true|false|null)\b/g;

const XML_TOKEN = /(<\/?[A-Za-z0-9:._-]+)|("[^"]*")|((?:[A-Za-z-]+)=)|(<!--[\s\S]*?-->)/g;

function tokenize(line: string, kind: "json" | "xml"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = kind === "json" ? new RegExp(JSON_TOKEN.source, "g") : new RegExp(XML_TOKEN.source, "g");
  let last = 0;
  let n = 0;
  for (const m of line.matchAll(re)) {
    const at = m.index ?? 0;
    if (at < last) continue;
    if (at > last) out.push(line.slice(last, at));
    const cls =
      kind === "json"
        ? m[1] !== undefined
          ? "text-blue-300"
          : m[2] !== undefined
            ? "text-emerald-300"
            : m[3] !== undefined
              ? "text-amber-300"
              : "text-violet-300"
        : m[1] !== undefined
          ? "text-blue-300"
          : m[2] !== undefined
            ? "text-emerald-300"
            : m[3] !== undefined
              ? "text-violet-300"
              : "text-slate-400";
    out.push(
      <span key={`${n}-${at}`} className={cls}>
        {m[0]}
      </span>,
    );
    n += 1;
    last = at + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

function CodeBlock({ text, kind }: { text: string; kind: "json" | "xml" }) {
  const lines = useMemo(() => text.split("\n"), [text]);
  return (
    <div className="scroll-thin min-h-0 flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-900">
      <div className="font-mono text-[12px] leading-[1.7]">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[44px_1fr] hover:bg-slate-800/70">
            <span className="tnum sticky left-0 bg-slate-900 px-2.5 text-right text-slate-500 select-none">{i + 1}</span>
            <span className="whitespace-pre pr-5 text-slate-200">{tokenize(l, kind)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface ModalPayload {
  json: string;
  xml: string;
  fileNameBase: string;
  key: string;
  status: "PASS" | "PASS_WITH_WARNINGS" | "READY_WITH_BLOCKERS";
  blocking: number;
  warnings: number;
  payableLabel: string;
  savedLabel: string;
}

const STATUS_TONE: Record<ModalPayload["status"], Tone> = {
  PASS: "good",
  PASS_WITH_WARNINGS: "warn",
  READY_WITH_BLOCKERS: "bad",
};

export function PayloadModal({
  payload,
  onClose,
  onCopied,
}: {
  payload: ModalPayload;
  onClose: () => void;
  onCopied: (ok: boolean, label: string) => void;
}) {
  const [tab, setTab] = useState<"summary" | "json" | "clearance">("summary");
  const text = tab === "json" ? payload.json : payload.json;
  const bytes = useMemo(() => new Blob([text]).size, [text]);
  const lineCount = useMemo(() => text.split("\n").length, [text]);
  const [clearanceStep, setClearanceStep] = useState(0);

  useEffect(() => {
    if (tab !== "clearance") return;
    setClearanceStep(0);
    const t1 = window.setTimeout(() => setClearanceStep(1), 600);
    const t2 = window.setTimeout(() => setClearanceStep(2), 1400);
    const t3 = window.setTimeout(() => setClearanceStep(3), 2200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [tab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="PPFTZ-01 declaration payload"
        onClick={(e) => e.stopPropagation()}
        className="animate-pop flex h-full max-h-[min(780px,92vh)] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_40px_120px_-32px_rgba(15,23,42,0.25)]"
      >
        <div className="flex items-start gap-4 border-b border-slate-200 px-5 py-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-blue-600">
            <Braces size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-[14px] font-semibold tracking-tight text-slate-900">
                PPFTZ-01 Declaration Payload — validated
              </h3>
              <Pill tone={STATUS_TONE[payload.status]}>{payload.status}</Pill>
            </div>
            <div className="tnum mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-slate-500">
              <span>schema PPFTZ-01/4.2</span>
              <span>idempotency {payload.key}</span>
              <span className="text-emerald-700">saving {payload.savedLabel}</span>
              <span className={payload.payableLabel === "Rp 0" ? "text-emerald-700" : "text-amber-700"}>
                payable {payload.payableLabel}
              </span>
              <span>
                {payload.blocking} blocking · {payload.warnings} warnings
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
            aria-label="Close payload"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2">
          {(
            [
              ["summary", "Summary", ShieldCheck],
              ["json", "JSON Payload", Braces],
              ["clearance", "Clearance Status", ShieldCheck],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                tab === k ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800",
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
          <div className="tnum ml-auto text-[11.5px] text-slate-500">
            {lineCount.toLocaleString("en-US")} lines · {(bytes / 1024).toFixed(1)} KB · UTF-8
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          {tab === "summary" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-[13px] font-semibold text-slate-800">Declaration summary</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Status</div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-900">{payload.status.replace(/_/g, " ")}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Idempotency key</div>
                  <div className="mt-1 font-mono text-[12px] text-slate-700">{payload.key}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Schema</div>
                  <div className="mt-1 font-mono text-[12px] text-slate-700">PPFTZ-01/4.2</div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">FTZ savings</div>
                  <div className="mt-1 text-[13px] font-bold text-emerald-700">{payload.savedLabel}</div>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-amber-700">Payable after facility</div>
                  <div className="mt-1 text-[13px] font-bold text-amber-700">{payload.payableLabel}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Findings</div>
                  <div className="mt-1 text-[13px] font-semibold text-slate-900">{payload.blocking} blocking · {payload.warnings} warnings</div>
                </div>
              </div>
              <p className="text-[11.5px] leading-relaxed text-slate-500">
                Lines filed are listed in the JSON payload tab. Nothing has been transmitted to a customs system.
              </p>
            </div>
          ) : tab === "clearance" ? (
            <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="text-[12.5px] font-semibold tracking-tight text-slate-800">Simulated Customs Clearance Status</div>
              <ol className="mt-2 space-y-3">
                {[
                  { n: 1, label: "Validation Passed", done: clearanceStep >= 1 },
                  { n: 2, label: "INSW Handshake OK", done: clearanceStep >= 2 },
                  { n: 3, label: "Electronic Endorsement Approved (Hijau / Green Line)", done: clearanceStep >= 3 },
                ].map((s) => (
                  <li key={s.n} className="flex items-center gap-3 text-[13px]">
                    <span
                      className={
                        s.done
                          ? "grid size-7 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "grid size-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-400"
                      }
                    >
                      {s.done ? "✓" : s.n}
                    </span>
                    <span className={s.done ? "font-medium text-emerald-700" : "text-slate-500"}>{`${s.n}. ${s.label}`}</span>
                  </li>
                ))}
              </ol>
              {clearanceStep >= 3 && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700">
                  Electronic Endorsement Approved — Green Line (Hijau)
                </div>
              )}
            </div>
          ) : (
            <CodeBlock text={text} kind="json" />
          )}
          <p className="mt-3 shrink-0 text-[11.5px] leading-relaxed text-slate-500">
            Generated locally by the PortSync agent against the reference BTKI register. Nothing has been transmitted to
            a customs system — verify live BTKI, INATRADE and kurs pabean values before filing.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3.5">
          <Btn
            variant="ghost"
            size="sm"
            icon={Download}
            onClick={() =>
              downloadText(
                `${payload.fileNameBase}.json`,
                text,
                "application/json",
              )
            }
          >
            Download JSON
          </Btn>
          <div className="ml-auto flex items-center gap-3">
            <Btn size="sm" variant="secondary" onClick={onClose}>
              Close
            </Btn>
            <Btn
              size="sm"
              variant="primary"
              icon={Copy}
              onClick={async () => {
                const ok = await copyText(text);
                onCopied(ok, "PPFTZ-01 JSON payload");
              }}
            >
              Copy to clipboard
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}