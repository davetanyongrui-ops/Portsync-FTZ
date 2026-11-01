import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, Download, X } from "lucide-react";
import { copyText, downloadText } from "../lib/download";
import { cn } from "../lib/cn";
import { Btn, Tag, type Tone } from "./ui";

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
          ? "text-[#9cc3de]"
          : m[2] !== undefined
            ? "text-[#8fc9a8]"
            : m[3] !== undefined
              ? "text-[#d8b273]"
              : "text-[#b9a3d4]"
        : m[1] !== undefined
          ? "text-[#9cc3de]"
          : m[2] !== undefined
            ? "text-[#8fc9a8]"
            : m[3] !== undefined
              ? "text-[#d8b273]"
              : "text-[#5d6268]";
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
    <div className="scroll-thin min-h-0 flex-1 overflow-auto rounded-[6px] border border-[#23262b] bg-[#0f1113]">
      <div className="py-2 font-mono text-[11.5px] leading-[1.75]">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[42px_1fr] transition-colors hover:bg-white/[0.03]">
            <span className="tnum sticky left-0 bg-[#0f1113] pr-2.5 text-right text-[10px] text-[#4b5057] select-none">
              {i + 1}
            </span>
            <span className="whitespace-pre pr-5 text-[#c8ccd2]">{tokenize(l, kind)}</span>
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
  PASS: "ok",
  PASS_WITH_WARNINGS: "warn",
  READY_WITH_BLOCKERS: "bad",
};

type Tab = "json" | "xml" | "summary" | "clearance";

const TABS: { key: Tab; label: string }[] = [
  { key: "json", label: "JSON payload" },
  { key: "xml", label: "CEISA XML" },
  { key: "summary", label: "Summary" },
  { key: "clearance", label: "Clearance" },
];

export function PayloadModal({
  payload,
  onClose,
  onCopied,
}: {
  payload: ModalPayload;
  onClose: () => void;
  onCopied: (ok: boolean, label: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("json");
  const [copied, setCopied] = useState(false);
  const content = tab === "xml" ? payload.xml : payload.json;
  const bytes = useMemo(() => new Blob([content]).size, [content]);
  const lineCount = useMemo(() => content.split("\n").length, [content]);
  const [clearanceStep, setClearanceStep] = useState(0);

  useEffect(() => {
    if (tab !== "clearance") return;
    setClearanceStep(0);
    const ts = [
      window.setTimeout(() => setClearanceStep(1), 420),
      window.setTimeout(() => setClearanceStep(2), 1000),
      window.setTimeout(() => setClearanceStep(3), 1600),
    ];
    return () => ts.forEach(window.clearTimeout);
  }, [tab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const steps = [
    "Schema validation against PPFTZ-01/4.2",
    "INSW handshake — gateway acknowledgement",
    "Electronic endorsement (jalur hijau)",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="PPFTZ-01 declaration payload"
        onClick={(e) => e.stopPropagation()}
        className="animate-rise flex h-full max-h-[min(800px,92vh)] w-full max-w-[960px] flex-col overflow-hidden rounded-[8px] border border-line bg-surface shadow-[var(--shadow-modal)]"
      >
        <div className="flex items-start gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[13.5px] font-semibold tracking-[-0.01em] text-ink">PPFTZ-01 declaration payload</h3>
              <Tag tone={STATUS_TONE[payload.status]}>{payload.status.replace(/_/g, " ")}</Tag>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-ink-3">
              <span>schema PPFTZ-01/4.2</span>
              <span className="text-line-strong">/</span>
              <span>{payload.key}</span>
              <span className="text-line-strong">/</span>
              <span>{payload.blocking} blocking · {payload.warnings} warnings</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-[4px] text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            aria-label="Close payload"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex shrink-0 items-stretch border-b border-line px-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "h-9 cursor-pointer border-b-2 px-2.5 text-[12px] transition-colors",
                tab === t.key ? "border-ink font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
          <span className="tnum ml-auto self-center font-mono text-[10px] text-ink-3">
            {lineCount.toLocaleString("en-US")} lines · {(bytes / 1024).toFixed(1)} kB · UTF-8
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
          {tab === "summary" ? (
            <div className="scroll-thin min-h-0 flex-1 overflow-auto rounded-[6px] border border-line">
              <div className="grid grid-cols-2 sm:grid-cols-3">
                {[
                  ["Status", payload.status.replace(/_/g, " ")],
                  ["Idempotency key", payload.key],
                  ["Schema", "PPFTZ-01/4.2"],
                  ["Facility relief", payload.savedLabel],
                  ["Payable after facility", payload.payableLabel],
                  ["Findings", `${payload.blocking} blocking · ${payload.warnings} warnings`],
                ].map(([k, v], i) => (
                  <div
                    key={k}
                    className={cn(
                      "border-line px-3 py-2.5",
                      i % 3 !== 2 && "sm:border-r",
                      i < 3 && "border-b",
                      "sm:[&:nth-child(-n+3)]:border-b sm:[&:nth-child(n+4)]:border-b-0",
                    )}
                  >
                    <div className="text-[10px] tracking-[0.06em] text-ink-3 uppercase">{k}</div>
                    <div className="mt-1 truncate font-mono text-[11.5px] text-ink">{v}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-line px-3 py-2.5 text-[11px] leading-relaxed text-ink-2">
                Selected lines are compiled into both a REST-shaped JSON body and a CEISA-flavoured XML document. Both
                carry the same totals, the same validation findings and the same idempotency key, so the gateway can
                reject a duplicate without re-reading the declaration.
              </div>
            </div>
          ) : tab === "clearance" ? (
            <div className="flex min-h-0 flex-1 flex-col justify-center rounded-[6px] border border-line px-4 py-6">
              <div className="mx-auto w-full max-w-[420px]">
                <div className="text-[10px] font-semibold tracking-[0.09em] text-ink-3 uppercase">
                  Simulated gateway sequence
                </div>
                <ol className="mt-3 space-y-2.5">
                  {steps.map((s, i) => {
                    const done = clearanceStep > i;
                    return (
                      <li key={s} className="flex items-center gap-2.5 text-[12px]">
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[9px]",
                            done ? "border-ok/40 bg-ok-soft text-ok" : "border-line bg-sunken text-ink-3",
                          )}
                        >
                          {done ? <Check size={10} strokeWidth={3.5} /> : i + 1}
                        </span>
                        <span className={done ? "text-ink" : "text-ink-3"}>{s}</span>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-3">
                  This animation is illustrative only. This build has no CEISA connection and transmits nothing;
                  clearance state is not asserted anywhere in the payload.
                </p>
              </div>
            </div>
          ) : tab === "xml" ? (
            <CodeBlock text={payload.xml} kind="xml" />
          ) : (
            <CodeBlock text={payload.json} kind="json" />
          )}

          <p className="shrink-0 text-[10.5px] leading-relaxed text-ink-3">
            Generated locally against the reference BTKI register. Verify live BTKI, INATRADE and the kurs pabean before
            filing.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-line px-3 py-2.5">
          <Btn
            size="sm"
            variant="secondary"
            icon={Download}
            onClick={() => downloadText(`${payload.fileNameBase}.json`, payload.json, "application/json")}
          >
            JSON
          </Btn>
          <Btn
            size="sm"
            variant="secondary"
            icon={Download}
            onClick={() => downloadText(`${payload.fileNameBase}.xml`, payload.xml, "application/xml")}
          >
            XML
          </Btn>
          <div className="ml-auto flex items-center gap-1.5">
            <Btn size="sm" variant="ghost" onClick={onClose}>
              Close
            </Btn>
            <Btn
              size="sm"
              variant="primary"
              icon={copied ? Check : Copy}
              onClick={async () => {
                const ok = await copyText(content);
                setCopied(ok);
                setTimeout(() => setCopied(false), 2000);
                onCopied(ok, tab === "xml" ? "CEISA XML" : "PPFTZ-01 JSON");
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
