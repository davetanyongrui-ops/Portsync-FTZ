import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Table2 } from "lucide-react";
import { TopBar } from "./components/TopBar";
import { LeftPanel, PIPELINE, type AnalyzeState } from "./components/LeftPanel";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { LegalModal, type LegalDocType } from "./components/LegalModal";
import { getSession, logOut, type AuthUser } from "./lib/auth";
import type { UploadedFile } from "./components/UploadZone";
import { RightPanel } from "./components/RightPanel";
import { PayloadModal, type ModalPayload } from "./components/PayloadModal";
import { ToastStack, type Toast } from "./components/Toasts";
import { HomePage } from "./components/HomePage";
import { FeaturesPage } from "./components/FeaturesPage";
import { PricingPage } from "./components/PricingPage";
import { ContactPage } from "./components/ContactPage";
import { SourcesPage } from "./components/SourcesPage";
import { getInvoice, registerInvoice, updateLine } from "./data/invoice-store";
import { parseRawInvoice, type SourceMeta } from "./lib/parser";
import { extractDocument, type ExtractProgress } from "./lib/ocr";
import { DEFAULT_DESTINATION, getDestination } from "./data/destinations";
import { PPN_RATE, PPH22_RATE } from "./data/constants";
import { FX, refreshFx, subscribeFx } from "./lib/fx";
import { buildDeclaration, computeLine } from "./lib/engine";
import { buildCeisaXml, buildPpftzPayload, idempotencyKey, validationReport } from "./lib/payload";
import { downloadText } from "./lib/download";
import { fmtIdr, fmtUsd } from "./lib/format";
import { cn } from "./lib/cn";
import { getInitialTheme, setThemeInStorage, type Theme } from "./lib/theme";
import type { Overrides } from "./lib/engine";
import type { InvoiceLine } from "./types";

const FILE_BASE = (docNo: string) => docNo.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase();
const selectAllOf = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, true]));

export type Page = "terminal" | "home" | "features" | "pricing" | "contact" | "sources" | "login" | "signup";

function pageFromHash(): Page {
  const h = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (h === "home" || h === "overview") return "home";
  if (h === "features") return "features";
  if (h === "pricing") return "pricing";
  if (h === "contact") return "contact";
  if (h === "sources" || h === "provenance") return "sources";
  if (h === "login") return "login";
  if (h === "signup") return "signup";
  return "terminal";
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => getSession());
  const [page, setPage] = useState<Page>(pageFromHash);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [status, setStatus] = useState<AnalyzeState>("staged");
  const [stage, setStage] = useState(0);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [masterlistMap, setMasterlistMap] = useState<Record<string, boolean>>({});
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"source" | "declaration">("source");
  const [modal, setModal] = useState<ModalPayload | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [destinationId, setDestinationId] = useState(DEFAULT_DESTINATION.id);
  /** Bumped when a stored line is corrected, so the memoised invoice recomputes. */
  const [docVersion, setDocVersion] = useState(0);
  const [reading, setReading] = useState<ExtractProgress | null>(null);
  const [, setFxTick] = useState(0);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);

  useEffect(() => {
    setThemeInStorage(theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "light" ? "dark" : "light")), []);

  const timers = useRef<number[]>([]);
  const toastSeq = useRef(0);

  const invoice = useMemo(() => getInvoice(invoiceId), [invoiceId, docVersion]);

  const selectedSet = useMemo(
    () => new Set(Object.entries(selectedMap).filter(([, on]) => on).map(([id]) => id)),
    [selectedMap],
  );

  const destination = useMemo(() => getDestination(destinationId), [destinationId]);

  const { calcs, totals } = useMemo(
    () => buildDeclaration(invoice, overrides, selectedSet, destinationId, masterlistMap),
    [invoice, overrides, selectedSet, destinationId, masterlistMap],
  );

  const rows = useMemo(() => calcs.map((c) => ({ ...c, selected: selectedSet.has(c.id) })), [calcs, selectedSet]);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    // Keep the stack to two and clear it itself — a card that sits over the line
    // table for ten seconds hides the numbers the user just asked for.
    setToasts((prev) => [...prev.slice(-1), { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    const handler = () => setPage(pageFromHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  useEffect(() => {
    const unsub = subscribeFx(() => setFxTick((n) => n + 1));
    refreshFx();
    return () => unsub();
  }, []);

  const navigate = useCallback((p: Page) => {
    window.location.hash = p === "terminal" ? "#/" : `#/${p}`;
    setPage(p);
  }, []);

  const triggerAnalysis = useCallback(
    (targetId: string, customFileName?: string, quiet = false) => {
      const currentInv = getInvoice(targetId);
      if (!currentInv) return;
      clearTimers();
      setStatus("analyzing");
      setStage(0);
      setActiveId(null);

      const step = 150;
      for (let i = 1; i <= PIPELINE.length; i += 1) {
        timers.current.push(window.setTimeout(() => setStage(i), i * step));
      }
      timers.current.push(
        window.setTimeout(() => {
          setStatus("ready");
          setSelectedMap(selectAllOf(currentInv.lines.map((l) => l.id)));
          const defaultCalcs = buildDeclaration(
            currentInv,
            {},
            new Set(currentInv.lines.map((l) => l.id)),
            destinationId,
          );
          const report = validationReport(defaultCalcs.calcs, defaultCalcs.totals);
          // The upload path already reported what it read; a second toast for the
          // same action just covers the table the user is trying to read.
          if (quiet) return;
          pushToast({
            tone: "ok",
            title: `${currentInv.lines.length} lines classified`,
            detail: `${customFileName ? `${customFileName} · ` : ""}${report.blocking.length} blocking · ${
              report.warnings.length
            } warnings · ${fmtIdr(defaultCalcs.totals.payable - defaultCalcs.totals.pph22)} payable on this filing set.`,
          });
        }, PIPELINE.length * step + 200),
      );
    },
    [clearTimers, destinationId, pushToast],
  );

  const analyze = useCallback(() => {
    if (invoiceId) triggerAnalysis(invoiceId);
  }, [triggerAnalysis, invoiceId]);

  const resetOverrides = useCallback(() => {
    setOverrides({});
    setMasterlistMap({});
    if (!invoice) return;
    setSelectedMap(selectAllOf(invoice.lines.map((l) => l.id)));
    setActiveId(null);
    pushToast({
      tone: "brand",
      title: "Overrides cleared",
      detail: `All ${invoice.lines.length} lines back to the agent's top pick.`,
    });
  }, [invoice, pushToast]);

  const toggleMasterlist = useCallback(
    (id: string) => {
      if (!invoice) return;
      setMasterlistMap((prev) => {
        const next = !prev[id];
        const line = invoice.lines.find((l) => l.id === id);
        pushToast({
          tone: next ? "ok" : "warn",
          title: next ? "BP Batam masterlist applied" : "Masterlist exemption removed",
          detail: next
            ? `POS ${line?.pos ?? ""} granted 100% duty and PPN suspension under an approved masterlist.`
            : `POS ${line?.pos ?? ""} reverted to the restricted exemption (15% BM + 11% PPN).`,
        });
        return { ...prev, [id]: next };
      });
    },
    [invoice, pushToast],
  );

  const toggleLine = useCallback((id: string) => {
    setSelectedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const selectAll = useCallback(
    (on: boolean) =>
      setSelectedMap(invoice ? Object.fromEntries(invoice.lines.map((l) => [l.id, on])) : {}),
    [invoice],
  );

  /** Correct an OCR-misread quantity or unit price; everything downstream recomputes.
   * The corrected figures become the line's reference amount — the human has
   * verified the row, so its reconciliation flag clears. */
  const editLine = useCallback(
    (lineId: string, patch: Partial<Pick<InvoiceLine, "qty" | "unitCifUsd">>) => {
      if (!invoiceId) return;
      const line = getInvoice(invoiceId)?.lines.find((l) => l.id === lineId);
      if (!line) return;
      const qty = patch.qty ?? line.qty;
      const unit = patch.unitCifUsd ?? line.unitCifUsd;
      updateLine(invoiceId, lineId, {
        ...patch,
        docAmountUsd: Math.round(qty * unit * 100) / 100,
      });
      setDocVersion((v) => v + 1);
    },
    [invoiceId],
  );

  /**
   * Document-level OCR checksum: the line figures against the total the
   * document itself states. A disagreement means at least one recognised
   * number is wrong even when each row reconciles internally.
   */
  const docCheck = useMemo(() => {
    if (!invoice?.docTotalUsd || totals.usdCif <= 0) return null;
    const stated = invoice.docTotalUsd;
    const computed = totals.usdCif;
    return Math.abs(computed - stated) > Math.max(1, stated * 0.02)
      ? { stated, computed }
      : null;
  }, [invoice, totals.usdCif]);

  const overrideLine = useCallback(
    (id: string, hs: string) => {
      if (!invoice) return;
      const line = invoice.lines.find((l) => l.id === id);
      if (!line) return;
      setOverrides((prev) => ({ ...prev, [id]: hs }));
      if (hs === line.hs) return;
      const ctx = { treatment: destination.treatment };
      const before = computeLine(line, undefined, ctx);
      const after = computeLine(line, hs, ctx);
      pushToast({
        tone: "warn",
        title: `POS ${line.pos} re-mapped to ${hs}`,
        detail: `Standard duty ${fmtIdr(before.standard.total)} → ${fmtIdr(after.standard.total)}; payable after facility ${fmtIdr(after.payable)}.`,
      });
    },
    [invoice, pushToast, destination],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      setReading({ phase: "reading", label: "Opening the document", pct: 0.01 });
      try {
        const doc = await extractDocument(file, setReading);

        const meta: SourceMeta = {
          fileName: file.name,
          sizeKb: Math.round(file.size / 1024),
          pages: doc.pages,
          kind: /\.pdf$/i.test(file.name) ? "PDF" : "PNG",
          method: doc.method,
        };

        const parsed = parseRawInvoice(doc.text, meta);

        if (!parsed) {
          // Nothing readable came out. Say exactly that — and touch no state,
          // so the previous consignment stays loaded *consistently*: showing
          // the failed file's name above the old document's declaration is
          // how "nothing to declare" became "which document am I looking at".
          pushToast({
            tone: "bad",
            title: `Nothing to declare in ${file.name}`,
            detail:
              doc.text.trim().length < 40
                ? "No text was recovered from this file, even with OCR. Check the scan is legible and upright."
                : "Text was recovered but no item table could be found — no line with a quantity and a unit. The previous consignment is still loaded.",
          });
          return;
        }

        setSourceFile(file);
        setUploaded({
          name: file.name,
          sizeKb: meta.sizeKb,
          mime: file.type || "application/octet-stream",
          pages: doc.pages,
          method: doc.method,
        });

        registerInvoice(parsed);
        clearTimers();
        setInvoiceId(parsed.id);
        setOverrides({});
        setMasterlistMap({});
        setSelectedMap(selectAllOf(parsed.lines.map((l) => l.id)));
        setActiveId(null);

        const unclassified = parsed.lines.filter((l) => !l.hs).length;
        const lowConfidence = parsed.lines.filter((l) => l.hs && l.confidence < 0.7).length;

        pushToast({
          tone: unclassified ? "warn" : "brand",
          title: `${parsed.lines.length} line${parsed.lines.length > 1 ? "s" : ""} read from ${file.name}`,
          detail:
            (doc.method === "ocr"
              ? "Recognised by OCR — check the figures against the original. "
              : doc.method === "mixed"
                ? "Some pages were scanned and read by OCR. "
                : "") +
            (unclassified
              ? `${unclassified} line(s) matched no heading and need an HS code.`
              : lowConfidence
                ? `${lowConfidence} line(s) below 70% confidence need a decision.`
                : "Every line matched a heading in the register."),
        });

        triggerAnalysis(parsed.id, file.name, true);
        if (window.innerWidth < 1024) setMobileView("declaration");
      } catch (err) {
        pushToast({
          tone: "bad",
          title: "Document could not be read",
          detail: err instanceof Error ? err.message : "Unexpected error while reading the file.",
        });
      } finally {
        setReading(null);
      }
    },
    [clearTimers, pushToast, triggerAnalysis],
  );

  const handleReject = useCallback(
    (message: string) => pushToast({ tone: "bad", title: "Document rejected", detail: message }),
    [pushToast],
  );

  const stamp = () => new Date().toISOString();

  const downloadXml = useCallback(() => {
    if (!invoice) return;
    const xml = buildCeisaXml(invoice, rows, totals, stamp(), destination);
    const file = `${FILE_BASE(invoice.docNo)}-ppftz-ceisa.xml`;
    downloadText(file, xml, "application/xml");
    pushToast({
      tone: "brand",
      title: "CEISA XML downloaded",
      detail: `${file} · ${totals.selected} line(s), ${fmtIdr(totals.payable - totals.pph22)} payable at ${destination.port}.`,
    });
  }, [invoice, rows, totals, pushToast, destination]);

  const downloadCsv = useCallback(() => {
    const head = [
      "pos",
      "hs_code",
      "description",
      "qty",
      "uom",
      "origin",
      "cif_usd",
      "cif_idr",
      "bm_pct",
      "ppn_pct",
      "standard_idr",
      "coverage_pct",
      "payable_idr",
      "saved_idr",
      "lartas",
      "risk",
    ];
    const body = rows
      .filter((r) => r.selected)
      .map((r) =>
        [
          r.pos,
          r.hs,
          `"${r.line.raw.replace(/"/g, '""')}"`,
          r.qty,
          r.uom,
          r.line.origin,
          r.usdCif.toFixed(2),
          r.idrCif,
          Math.round(r.bmRate * 100),
          Math.round(r.ppnRate * 100),
          r.standard.total,
          Math.round(r.coverage * 100),
          r.payable,
          r.saved,
          r.lartas,
          r.risk,
        ].join(","),
      );
    if (!invoice) return;
    const file = `${FILE_BASE(invoice.docNo)}-lines.csv`;
    downloadText(file, [head.join(","), ...body].join("\n"), "text/csv");
    pushToast({
      tone: "neutral",
      title: "Line schedule exported",
      detail: `${file} · ${totals.selected} rows, duty split per line.`,
    });
  }, [invoice, rows, totals, pushToast]);

  const openPayload = useCallback(() => {
    if (!invoice) return;
    const generatedAt = stamp();
    const payload = buildPpftzPayload(invoice, rows, totals, { generatedAt, draft: false }, destination);
    const report = validationReport(calcs, totals);
    setModal({
      json: JSON.stringify(payload, null, 2),
      xml: buildCeisaXml(invoice, rows, totals, generatedAt, destination),
      fileNameBase: `${FILE_BASE(invoice.docNo)}-${destination.regime.toLowerCase()}`,
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
              tone: "ok",
              title: `${label} copied`,
              detail: "Paste into the CEISA 4.0 request body. Nothing has been transmitted from this build.",
            }
          : {
              tone: "bad",
              title: "Clipboard blocked",
              detail: "The browser refused the copy request. Use download instead.",
            },
      ),
    [pushToast],
  );

  const ready = status === "ready";

  const agent =
    status === "analyzing"
      ? { text: "classifying · BTKI lookup", tone: "busy" as const }
      : ready
        ? {
            text: `${totals.lines} lines${totals.blocked > 0 ? ` · ${totals.blocked} blocked` : " · clear"}`,
            tone: "ready" as const,
          }
        : { text: "awaiting analysis", tone: "idle" as const };

  const mobileTabs = [
    { key: "source" as const, label: "Source document", icon: FileText },
    { key: "declaration" as const, label: "Declaration", icon: Table2 },
  ];

  const chrome = page !== "login" && page !== "signup";

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-paper text-ink antialiased">
      {chrome && (
        <TopBar
          page={page}
          onNavigate={navigate}
          agent={agent}
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={() => {
            logOut();
            setUser(null);
          }}
          onOpenLegal={(doc) => setLegalDoc(doc)}
        />
      )}

      {page === "terminal" && (
        <nav
          className="flex shrink-0 items-stretch border-b border-line bg-surface lg:hidden"
          aria-label="Terminal panels"
        >
          {mobileTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              data-tab={t.key}
              onClick={() => setMobileView(t.key)}
              aria-pressed={mobileView === t.key}
              className={cn(
                "flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 border-b-2 text-[12px] transition-colors",
                mobileView === t.key
                  ? "border-ink font-medium text-ink"
                  : "border-transparent text-ink-3 hover:text-ink",
              )}
            >
              <t.icon size={13} strokeWidth={2} />
              {t.label}
              {t.key === "declaration" && ready && (
                <span className="ml-0.5 size-[5px] rounded-full bg-ok" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>
      )}

      {page !== "terminal" ? (
        <main className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          {page === "home" && <HomePage onNavigate={navigate} onOpenLegal={(doc) => setLegalDoc(doc)} />}
          {page === "features" && <FeaturesPage onNavigate={navigate} onOpenLegal={(doc) => setLegalDoc(doc)} />}
          {page === "pricing" && <PricingPage onNavigate={navigate} onOpenLegal={(doc) => setLegalDoc(doc)} />}
          {page === "contact" && <ContactPage onNavigate={navigate} onOpenLegal={(doc) => setLegalDoc(doc)} />}
          {page === "sources" && <SourcesPage onNavigate={navigate} onOpenLegal={(doc) => setLegalDoc(doc)} />}
          {page === "login" && (
            <LoginPage
              onLoggedIn={() => {
                setUser(getSession());
                navigate("terminal");
              }}
              onSwitchToSignup={() => navigate("signup")}
              onGuestAccess={() => navigate("terminal")}
              onOpenLegal={(doc) => setLegalDoc(doc)}
            />
          )}
          {page === "signup" && (
            <SignupPage
              onSignedUp={() => {
                setUser(getSession());
                navigate("terminal");
              }}
              onSwitchToLogin={() => navigate("login")}
              onOpenLegal={(doc) => setLegalDoc(doc)}
            />
          )}
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div
            className={cn(
              "min-h-0 shrink-0 border-line bg-paper lg:flex lg:w-[33%] lg:max-w-[400px] lg:min-w-[280px] lg:flex-none lg:border-r xl:w-[40%] xl:max-w-[520px] xl:min-w-[380px]",
              mobileView === "source" ? "flex flex-1" : "hidden",
            )}
          >
            <LeftPanel
              invoice={invoice}
              uploaded={uploaded}
              reading={reading}
              sourceFile={sourceFile}
              onUpload={handleUpload}
              onClearUpload={() => {
                clearTimers();
                setUploaded(null);
                setSourceFile(null);
                setInvoiceId(null);
                setOverrides({});
                setMasterlistMap({});
                setSelectedMap({});
                setActiveId(null);
                setStage(0);
                setStatus("staged");
              }}
              onReject={handleReject}
              status={status}
              stage={stage}
              calcs={calcs}
              activeId={activeId}
              onAnalyze={analyze}
              onReset={resetOverrides}
            />
          </div>

          <div
            className={cn(
              "min-h-0 min-w-0 flex-1 bg-surface",
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
              onEditLine={editLine}
              docCheck={docCheck}
              onDownloadXml={downloadXml}
              onDownloadCsv={downloadCsv}
              onOpenPayload={openPayload}
              destination={destination}
              onDestinationChange={setDestinationId}
              onToggleMasterlist={toggleMasterlist}
              onOpenLegal={(doc) => setLegalDoc(doc)}
            />
          </div>
        </main>
      )}

      {page === "terminal" && (
        <footer className="flex h-6 shrink-0 items-center gap-3 overflow-hidden border-t border-line bg-surface px-3 font-mono text-[10px] whitespace-nowrap text-ink-3">
          <span className="shrink-0 text-ink-2">BTKI 2022</span>
          <span className="hidden min-w-0 truncate sm:inline">
            {ready ? `${calcs.length} classified` : "idle"} · kurs {FX.USD_IDR.toLocaleString("id-ID")} · PPN{" "}
            {(PPN_RATE * 100).toFixed(0)}% · PPh 22 {(PPH22_RATE * 100).toFixed(1)}%
          </span>
          <span className="ml-auto hidden shrink-0 lg:inline">{invoice?.docNo ?? "no document"}</span>
          <span className="hidden shrink-0 xl:inline">
            {ready ? `${totals.selected}/${totals.lines} filed · ${fmtUsd(totals.usdCif)} CIF` : "no filing set"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-ink-2">
            <span className="size-[4px] rounded-full bg-warn" />
            sandbox<span className="hidden md:inline"> · nothing transmitted</span>
          </span>
        </footer>
      )}

      {legalDoc && <LegalModal initialDoc={legalDoc} onClose={() => setLegalDoc(null)} />}
      {modal && <PayloadModal payload={modal} onClose={() => setModal(null)} onCopied={onCopied} />}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
