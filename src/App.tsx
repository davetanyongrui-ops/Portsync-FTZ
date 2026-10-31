import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Zap } from "lucide-react";
import { TopBar } from "./components/TopBar";
import { LeftPanel, PIPELINE, type AnalyzeState } from "./components/LeftPanel";
import type { UploadedFile } from "./components/UploadZone";
import { RightPanel } from "./components/RightPanel";
import { PayloadModal, type ModalPayload } from "./components/PayloadModal";
import { ToastStack, type Toast } from "./components/Toasts";
import { DEMO_INVOICES, getInvoice } from "./data/fixtures";
import { PPN_RATE, PPH22_RATE, FX } from "./data/constants";
import { buildDeclaration, computeLine } from "./lib/engine";
import { buildCeisaXml, buildPpftzPayload, idempotencyKey, validationReport } from "./lib/payload";
import { downloadText } from "./lib/download";
import { fmtIdr, fmtUsd } from "./lib/format";
import { cn } from "./lib/cn";
import type { Overrides } from "./lib/engine";

const FILE_BASE = (docNo: string) => docNo.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase();
const selectAllOf = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, true]));

/** Filename keyword -> fixture whose grammar the agent replays for an uploaded document. */
const KEYWORD_FIXTURE: Record<string, string> = {
  greentech: "gt",
  shenzhen: "gt",
  solar: "gt",
  inverter: "gt",
  battery: "gt",
  ess: "gt",
  johor: "jis",
  pneumatic: "jis",
  valve: "jis",
  spares: "jis",
  bearing: "jis",
  sensor: "jis",
  precision: "smp",
  machining: "smp",
  alloy: "smp",
  electronics: "smp",
};

export default function App() {
  const [invoiceId, setInvoiceId] = useState(DEMO_INVOICES[0]!.id);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<AnalyzeState>("staged");
  const [stage, setStage] = useState(0);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>(() =>
    selectAllOf(DEMO_INVOICES[0]!.lines.map((l) => l.id)),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"source" | "declaration">("source");
  const [modal, setModal] = useState<ModalPayload | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const timers = useRef<number[]>([]);
  const toastSeq = useRef(0);

  const invoice = useMemo(() => getInvoice(invoiceId), [invoiceId]);

  const selectedSet = useMemo(
    () => new Set(Object.entries(selectedMap).filter(([, on]) => on).map(([id]) => id)),
    [selectedMap],
  );

  const { calcs, totals } = useMemo(
    () => buildDeclaration(invoice, overrides, selectedSet),
    [invoice, overrides, selectedSet],
  );

  const rows = useMemo(() => calcs.map((c) => ({ ...c, selected: selectedSet.has(c.id) })), [calcs, selectedSet]);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const pickInvoice = useCallback(
    (id: string) => {
      clearTimers();
      const next = getInvoice(id);
      setInvoiceId(id);
      setOverrides({});
      setSelectedMap(selectAllOf(next.lines.map((l) => l.id)));
      setActiveId(null);
      setStage(0);
      setStatus("staged");
    },
    [clearTimers],
  );

  const analyze = useCallback(() => {
    clearTimers();
    setStatus("analyzing");
    setStage(0);
    setActiveId(null);

    const step = 215;
    for (let i = 1; i <= PIPELINE.length; i += 1) {
      timers.current.push(window.setTimeout(() => setStage(i), i * step));
    }
    timers.current.push(
      window.setTimeout(() => {
        setStatus("ready");
        setSelectedMap(selectAllOf(invoice.lines.map((l) => l.id)));
        const report = validationReport(calcs, totals);
        pushToast({
          tone: "good",
          title: `Analysis complete — ${invoice.lines.length} line items mapped to BTKI`,
          detail: `${report.blocking.length} blocking · ${report.warnings.length} warnings · standard duty ${fmtIdr(
            totals.standard.total,
          )}, of which ${fmtIdr(totals.saved)} avoided under PPFTZ-01.`,
        });
      }, PIPELINE.length * step + 260),
    );
  }, [clearTimers, invoice, calcs, totals, pushToast]);

  const resetOverrides = useCallback(() => {
    setOverrides({});
    setSelectedMap(selectAllOf(invoice.lines.map((l) => l.id)));
    setActiveId(null);
    pushToast({ tone: "brand", title: "Overrides cleared", detail: `All ${invoice.lines.length} lines back to the agent's top pick.` });
  }, [invoice, pushToast]);

  const toggleLine = useCallback((id: string) => {
    setSelectedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const selectAll = useCallback(
    (on: boolean) => {
      setSelectedMap(Object.fromEntries(invoice.lines.map((l) => [l.id, on])));
    },
    [invoice],
  );

  const overrideLine = useCallback(
    (id: string, hs: string) => {
      const line = invoice.lines.find((l) => l.id === id);
      if (!line) return;
      setOverrides((prev) => ({ ...prev, [id]: hs }));
      if (hs === line.hs) return;
      const before = computeLine(line);
      const after = computeLine(line, hs);
      pushToast({
        tone: "warn",
        title: `POS ${line.pos} re-mapped to ${hs}`,
        detail: `Standard duty ${fmtIdr(before.standard.total)} → ${fmtIdr(after.standard.total)}; payable after facility ${fmtIdr(after.payable)}.`,
      });
    },
    [invoice, pushToast],
  );

  const handleUpload = useCallback(
    (f: UploadedFile) => {
      setUploaded(f);
      const name = f.name.toLowerCase();
      const hit = Object.keys(KEYWORD_FIXTURE).find((k) => name.includes(k));
      const target = hit ? KEYWORD_FIXTURE[hit]! : invoiceId;
      if (target !== invoiceId) pickInvoice(target);
      pushToast({
        tone: "brand",
        title: `${f.name} staged locally`,
        detail: `Parsed against the ${getInvoice(target).label.split(" — ")[0]} fixture grammar — this build ships no OCR backend.`,
      });
    },
    [invoiceId, pickInvoice, pushToast],
  );

  const handleReject = useCallback(
    (message: string) => pushToast({ tone: "bad", title: "Document rejected", detail: message }),
    [pushToast],
  );

  const stamp = () => new Date().toISOString();

  const downloadXml = useCallback(() => {
    const xml = buildCeisaXml(invoice, rows, totals, stamp());
    const file = `${FILE_BASE(invoice.docNo)}-ppftz-ceisa.xml`;
    downloadText(file, xml, "application/xml");
    pushToast({
      tone: "brand",
      title: "CEISA-ready XML downloaded",
      detail: `${file} · ${totals.selected} line(s), ${fmtIdr(totals.payable)} payable after the FTZ facility.`,
    });
  }, [invoice, rows, totals, pushToast]);

  const openPayload = useCallback(() => {
    const generatedAt = stamp();
    const payload = buildPpftzPayload(invoice, rows, totals, { generatedAt, draft: false });
    const json = JSON.stringify(payload, null, 2);
    const xml = buildCeisaXml(invoice, rows, totals, generatedAt);
    const report = validationReport(calcs, totals);
    setModal({
      json,
      xml,
      fileNameBase: `${FILE_BASE(invoice.docNo)}-ppftz-01`,
      key: idempotencyKey(invoice.docNo, calcs),
      status:
        report.blocking.length > 0 ? "READY_WITH_BLOCKERS" : report.warnings.length > 0 ? "PASS_WITH_WARNINGS" : "PASS",
      blocking: report.blocking.length,
      warnings: report.warnings.length,
      payableLabel: totals.payable === 0 ? "Rp 0" : fmtIdr(totals.payable),
      savedLabel: fmtIdr(totals.saved),
    });
  }, [invoice, rows, totals, calcs]);

  const onCopied = useCallback(
    (ok: boolean, label: string) =>
      pushToast(
        ok
          ? {
              tone: "good",
              title: `${label} copied`,
              detail: "Paste into the CEISA 4.0 request body — no transmission has occurred from this build.",
            }
          : {
              tone: "bad",
              title: "Clipboard blocked",
              detail: "Your browser refused the copy request. Use Download instead.",
            },
      ),
    [pushToast],
  );

  const ready = status === "ready";

  const agent =
    status === "analyzing"
      ? { text: "Agent running · mapping BTKI", tone: "busy" as const }
      : ready
        ? {
            text: `Agent ready · ${totals.lines} lines${totals.blocked > 0 ? ` · ${totals.blocked} blocked` : ""}`,
            tone: "ready" as const,
          }
        : { text: "Agent idle · awaiting analysis", tone: "idle" as const };

  const tabs = [
    { key: "source" as const, label: "Invoice & Source", icon: FileText },
    { key: "declaration" as const, label: "Customs Declaration", icon: Zap },
  ];

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <TopBar agent={agent} />

      <nav className="flex shrink-0 items-center gap-1 border-b border-zinc-800/80 bg-zinc-900/40 p-2 lg:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            data-tab={t.key}
            onClick={() => setMobileView(t.key)}
            aria-pressed={mobileView === t.key}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-[12.5px] font-medium transition-colors",
              mobileView === t.key ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            <t.icon size={14} />
            {t.label}
            {t.key === "declaration" && ready && (
              <span className="ml-1 size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            )}
          </button>
        ))}
      </nav>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div
          className={cn(
            "min-h-0 flex-1 lg:w-[38%] lg:flex-none lg:border-r lg:border-zinc-800/80 lg:bg-zinc-900/40",
            mobileView === "source" ? "flex" : "hidden lg:flex",
          )}
        >
          <LeftPanel
            invoice={invoice}
            invoiceId={invoiceId}
            onPick={pickInvoice}
            uploaded={uploaded}
            onUpload={handleUpload}
            onClearUpload={() => setUploaded(null)}
            onReject={handleReject}
            status={status}
            stage={stage}
            calcs={calcs}
            activeId={activeId}
            onActive={setActiveId}
            onAnalyze={analyze}
            onReset={resetOverrides}
          />
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 lg:w-[62%] lg:flex-none",
            mobileView === "declaration" ? "flex" : "hidden lg:flex",
          )}
        >
          <RightPanel
            invoice={invoice}
            calcs={calcs}
            totals={totals}
            ready={ready}
            selectedIds={selectedSet}
            activeId={activeId}
            onActive={setActiveId}
            onToggle={toggleLine}
            onSelectAll={selectAll}
            onOverride={overrideLine}
            onDownloadXml={downloadXml}
            onOpenPayload={openPayload}
          />
        </div>
      </main>

      <footer className="flex h-8 shrink-0 items-center gap-5 border-t border-zinc-800/80 bg-zinc-950 px-5 text-[11px] text-zinc-500">
        <span className="truncate">
          PortSync FTZ Agent · reference BTKI 2026 edition ·{" "}
          {ready ? `${calcs.length} classified lines` : "awaiting analysis"}
        </span>
        <span className="tnum hidden xl:inline">
          Kurs pabean USD/IDR {FX.USD_IDR.toLocaleString("id-ID")} · PPN {(PPN_RATE * 100).toFixed(0)}% · PPh 22{" "}
          {(PPH22_RATE * 100).toFixed(1)}%
        </span>
        <span className="ml-auto tnum shrink-0">
          Invoice total {fmtUsd(totals.usdCif)} · filing set {ready ? `${totals.selected}/${totals.lines}` : "—"}
        </span>
        <span className="shrink-0 text-emerald-400">sandbox · no live dispatch</span>
      </footer>

      {modal && <PayloadModal payload={modal} onClose={() => setModal(null)} onCopied={onCopied} />}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
