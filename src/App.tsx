import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home, LayoutDashboard, FileSearch as FileSearchIcon } from "lucide-react";
import { TopBar } from "./components/TopBar";
import { LeftPanel, PIPELINE, type AnalyzeState } from "./components/LeftPanel";
import type { UploadedFile } from "./components/UploadZone";
import { RightPanel } from "./components/RightPanel";
import { PayloadModal, type ModalPayload } from "./components/PayloadModal";
import { ToastStack, type Toast } from "./components/Toasts";
import { HomePage } from "./components/HomePage";
import { FeaturesPage } from "./components/FeaturesPage";
import { PricingPage } from "./components/PricingPage";
import { ContactPage } from "./components/ContactPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { DEMO_INVOICES, getInvoice } from "./data/fixtures";
import { PPN_RATE, PPH22_RATE } from "./data/constants";
import { buildDeclaration, computeLine } from "./lib/engine";
import { buildCeisaXml, buildPpftzPayload, idempotencyKey, validationReport } from "./lib/payload";
import { downloadText } from "./lib/download";
import { fmtIdr, fmtUsd } from "./lib/format";
import { cn } from "./lib/cn";
import { getSession, logOut, type AuthUser } from "./lib/auth";
import { FX, refreshFx, subscribeFx } from "./lib/fx";
import type { Overrides, Regime } from "./lib/engine";

const FILE_BASE = (docNo: string) => docNo.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase();
const selectAllOf = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, true]));

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

export type Page = "home" | "features" | "pricing" | "contact" | "dashboard" | "inspector";

const PUBLIC_PAGES: { key: Page; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "features", label: "Features" },
  { key: "pricing", label: "Pricing" },
  { key: "contact", label: "Contact" },
];

const APP_PAGES: { key: Page; label: string; icon: typeof Home }[] = [
  { key: "inspector", label: "Document & Source Inspector", icon: FileSearchIcon },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function pageFromHash(): Page {
  const h = window.location.hash.replace(/^#\/?/, "");
  const valid: Page[] = ["home", "features", "pricing", "contact", "dashboard", "inspector"];
  if (valid.includes(h as Page)) return h as Page;
  return "inspector";
}

export default function App() {
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<AuthUser | null>(() => getSession());
  const [page, setPage] = useState<Page>(pageFromHash);
  const [invoiceId, setInvoiceId] = useState(DEMO_INVOICES[0]!.id);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<AnalyzeState>("staged");
  const [stage, setStage] = useState(0);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>(() =>
    selectAllOf(DEMO_INVOICES[0]!.lines.map((l) => l.id)),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalPayload | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [regime, setRegime] = useState<Regime>("PPFTZ-01");
  const [fxTick, setFxTick] = useState(0);

  const timers = useRef<number[]>([]);
  const toastSeq = useRef(0);

  const invoice = useMemo(() => getInvoice(invoiceId), [invoiceId]);

  const selectedSet = useMemo(
    () => new Set(Object.entries(selectedMap).filter(([, on]) => on).map(([id]) => id)),
    [selectedMap],
  );

  const { calcs, totals } = useMemo(
    () => buildDeclaration(invoice, overrides, selectedSet, regime),
    [invoice, overrides, selectedSet, regime, fxTick],
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
    window.location.hash = p === "home" ? "#/" : `#/${p}`;
    setPage(p);
  }, []);

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
      setRegime("PPFTZ-01");
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
      const before = computeLine(line, undefined, regime);
      const after = computeLine(line, hs, regime);
      pushToast({
        tone: "warn",
        title: `POS ${line.pos} re-mapped to ${hs}`,
        detail: `Standard duty ${fmtIdr(before.standard.total)} → ${fmtIdr(after.standard.total)}; payable after facility ${fmtIdr(after.payable)}.`,
      });
    },
    [invoice, pushToast, regime],
  );

  const handleUpload = useCallback(
    (f: UploadedFile) => {
      setUploaded(f);
      const text = `${f.name} ${f.extractedText || ""}`.toLowerCase();
      const hit = Object.keys(KEYWORD_FIXTURE).find((k) => text.includes(k));
      const target = hit ? KEYWORD_FIXTURE[hit]! : invoiceId;
      if (target !== invoiceId) pickInvoice(target);
      pushToast({
        tone: "brand",
        title: `${f.name} staged locally`,
        detail: f.extractedText
          ? `Extracted ${f.extractedText.length} chars from PDF and matched to ${getInvoice(target).label.split(" — ")[0]}.`
          : `Parsed against the ${getInvoice(target).label.split(" — ")[0]} fixture grammar — this build ships no OCR backend.`,
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

  const isProtected = page === "dashboard" || page === "inspector";

  if (!user && isProtected) {
    return authView === "login" ? (
      <LoginPage onLoggedIn={() => setUser(getSession())} onSwitchToSignup={() => setAuthView("signup")} />
    ) : (
      <SignupPage onSignedUp={() => setUser(getSession())} onSwitchToLogin={() => setAuthView("login")} />
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 antialiased">
      <TopBar agent={agent} />

      <nav className="flex shrink-0 flex-wrap items-center border-b border-slate-200 bg-white px-4 py-2 lg:px-6">
        <div className="hidden flex-1 sm:block" />
        <div className="flex flex-wrap items-center justify-center gap-1">
          {PUBLIC_PAGES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => navigate(p.key)}
              aria-current={page === p.key ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                page === p.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {p.label}
            </button>
          ))}
          {user &&
            APP_PAGES.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => navigate(p.key)}
                  aria-current={page === p.key ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    page === p.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              );
            })}
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          {user ? (
            <>
              <span className="hidden text-[12px] font-medium text-slate-700 sm:inline">{user.name}</span>
              <button
                type="button"
                onClick={() => { logOut(); setUser(null); setPage("home"); }}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setAuthView("login"); navigate("home"); }}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => { setAuthView("signup"); navigate("home"); }}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {page === "home" && <HomePage onNavigate={navigate} />}
        {page === "features" && <FeaturesPage onNavigate={navigate} />}
        {page === "pricing" && <PricingPage onNavigate={navigate} />}
        {page === "contact" && <ContactPage onNavigate={navigate} />}
        {page === "dashboard" && (
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
            regime={regime}
            onRegimeChange={setRegime}
          />
        )}
        {page === "inspector" && (
          <LeftPanel
            invoice={invoice}
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
        )}
      </main>

      <footer className="flex h-8 shrink-0 items-center gap-5 border-t border-slate-200 bg-white px-5 text-[11px] text-slate-500">
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
        <span className="shrink-0 text-emerald-700">sandbox · no live dispatch</span>
      </footer>

      {modal && <PayloadModal payload={modal} onClose={() => setModal(null)} onCopied={onCopied} />}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}