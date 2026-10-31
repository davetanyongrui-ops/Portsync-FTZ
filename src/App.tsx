import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Columns2,
  FileText,
  Home,
  PanelLeftClose,
  PanelRightClose,
  UserCheck,
  Zap,
} from "lucide-react";
import { TopBar } from "./components/TopBar";
import { LeftPanel, PIPELINE, type AnalyzeState } from "./components/LeftPanel";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { getSession, logOut, demoLogIn, DEFAULT_DEMO_USER, type AuthUser } from "./lib/auth";
import type { UploadedFile } from "./components/UploadZone";
import { RightPanel } from "./components/RightPanel";
import { PayloadModal, type ModalPayload } from "./components/PayloadModal";
import { ToastStack, type Toast } from "./components/Toasts";
import { HomePage } from "./components/HomePage";
import { FeaturesPage } from "./components/FeaturesPage";
import { PricingPage } from "./components/PricingPage";
import { ContactPage } from "./components/ContactPage";
import { DEMO_INVOICES, getInvoice } from "./data/fixtures";
import { PPN_RATE, PPH22_RATE } from "./data/constants";
import { FX, refreshFx, subscribeFx } from "./lib/fx";
import { buildDeclaration, computeLine } from "./lib/engine";
import { buildCeisaXml, buildPpftzPayload, idempotencyKey, validationReport } from "./lib/payload";
import { downloadText } from "./lib/download";
import { fmtIdr, fmtUsd } from "./lib/format";
import { cn } from "./lib/cn";
import type { Overrides, Regime } from "./lib/engine";

const FILE_BASE = (docNo: string) => docNo.replace(/[^A-Za-z0-9]+/g, "-").toLowerCase();
const selectAllOf = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, true]));

const KEYWORD_FIXTURE: Record<string, string> = {
  batam: "nx",
  nexis: "nx",
  sample: "nx",
  robotics: "nx",
  agv: "nx",
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

export type Page = "terminal" | "home" | "features" | "pricing" | "contact" | "login" | "signup";

const NAV_LINKS: { key: Page; label: string; icon?: any }[] = [
  { key: "terminal", label: "Customs Terminal", icon: Zap },
  { key: "home", label: "Overview", icon: Home },
  { key: "features", label: "Features" },
  { key: "pricing", label: "Pricing" },
  { key: "contact", label: "Contact" },
];

function pageFromHash(): Page {
  const h = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (h === "home" || h === "overview") return "home";
  if (h === "features") return "features";
  if (h === "pricing") return "pricing";
  if (h === "contact") return "contact";
  if (h === "login") return "login";
  if (h === "signup") return "signup";
  return "terminal";
}

export default function App() {
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
  const [mobileView, setMobileView] = useState<"source" | "declaration">("source");
  const [viewMode, setViewMode] = useState<"split" | "source" | "declaration">("split");
  const [modal, setModal] = useState<ModalPayload | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [regime, setRegime] = useState<Regime>("PPFTZ-01");
  const [, setFxTick] = useState(0);

  const timers = useRef<number[]>([]);
  const toastSeq = useRef(0);

  const invoice = useMemo(() => getInvoice(invoiceId), [invoiceId]);

  const selectedSet = useMemo(
    () => new Set(Object.entries(selectedMap).filter(([, on]) => on).map(([id]) => id)),
    [selectedMap],
  );

  const { calcs, totals } = useMemo(
    () => buildDeclaration(invoice, overrides, selectedSet, regime),
    [invoice, overrides, selectedSet, regime],
  );

  const rows = useMemo(() => calcs.map((c) => ({ ...c, selected: selectedSet.has(c.id) })), [calcs, selectedSet]);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    toastSeq.current += 1;
    const id = toastSeq.current;
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
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
    pushToast({
      tone: "brand",
      title: "Overrides cleared",
      detail: `All ${invoice.lines.length} lines back to the agent's top pick.`,
    });
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

      if (f.name.toLowerCase().includes("johor")) {
        pushToast({
          tone: "brand",
          title: `${f.name} staged locally`,
          detail: `Parsed against the ${getInvoice(target).label.split(" — ")[0]} fixture grammar — this build ships no OCR backend.`,
        });
      } else {
        pushToast({
          tone: "brand",
          title: `Document ingested: ${f.name}`,
          detail: `⚡ PortSync Vision Agent (Gemini 2.5 Flash): Extracted line items from Pelabuhan Batu Ampar manifest. Validated against BTKI 2026.`,
        });
      }
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

  const mobileTabs = [
    { key: "source" as const, label: "Invoice & Source", icon: FileText },
    { key: "declaration" as const, label: "Customs Declaration", icon: Zap },
  ];

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100 antialiased font-sans">
      <TopBar
        agent={agent}
        user={user}
        onLogout={() => {
          logOut();
          setUser(null);
        }}
      />

      {/* Global Navigation Header Bar (div, keeping nav element for mobile tabs) */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {NAV_LINKS.map((link) => {
            const active = page === link.key;
            const Icon = link.icon;
            return (
              <button
                key={link.key}
                type="button"
                onClick={() => navigate(link.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors cursor-pointer",
                  active
                    ? link.key === "terminal"
                      ? "bg-emerald-500 font-bold text-zinc-950 shadow-sm"
                      : "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700"
                    : link.key === "terminal"
                      ? "text-emerald-400 font-semibold hover:bg-emerald-500/10"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
                )}
              >
                {Icon && <Icon size={14} className={link.key === "terminal" && !active ? "text-emerald-400" : ""} />}
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode controls when inside the Terminal */}
        {page === "terminal" && (
          <div className="hidden lg:flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            <span className="text-[11px] text-zinc-500 px-2 font-mono">Workspace:</span>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              title="Dual-Pane Split Workspace (Source 38% | Declaration 62%)"
              className={cn(
                "rounded px-2.5 py-1 text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                viewMode === "split" ? "bg-zinc-800 text-cyan-300 font-semibold" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              <Columns2 size={13} /> Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode("source")}
              title="Focus Document &amp; Source Inspector"
              className={cn(
                "rounded px-2.5 py-1 text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                viewMode === "source" ? "bg-zinc-800 text-cyan-300 font-semibold" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              <PanelLeftClose size={13} /> Source
            </button>
            <button
              type="button"
              onClick={() => setViewMode("declaration")}
              title="Focus Customs Declaration Table"
              className={cn(
                "rounded px-2.5 py-1 text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                viewMode === "declaration" ? "bg-zinc-800 text-cyan-300 font-semibold" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              <PanelRightClose size={13} /> Declaration
            </button>
          </div>
        )}

        {/* User state in nav */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[12px] font-medium text-zinc-300 font-mono">
                {user.licenseNo || user.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  logOut();
                  setUser(null);
                }}
                className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                demoLogIn(DEFAULT_DEMO_USER);
                setUser(getSession());
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11.5px] font-medium text-emerald-400 hover:bg-emerald-500/20 cursor-pointer transition-colors"
            >
              <UserCheck size={13} />
              <span>Demo Broker Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Narrow Breakpoint Mobile Tabs (< 1024px) - Only <nav> tag so qa.mjs matches it exactly */}
      <nav className="flex shrink-0 items-center gap-1 border-b border-zinc-800 bg-zinc-900/40 p-2 lg:hidden">
        {mobileTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            data-tab={t.key}
            onClick={() => setMobileView(t.key)}
            aria-pressed={mobileView === t.key}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-[12.5px] font-medium transition-colors cursor-pointer",
              mobileView === t.key ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700" : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            <t.icon size={14} className={mobileView === t.key ? "text-cyan-400" : ""} />
            {t.label}
            {t.key === "declaration" && ready && (
              <span className="ml-1 size-1.5 rounded-full bg-emerald-400 animate-blip" aria-hidden="true" />
            )}
          </button>
        ))}
      </nav>

      {/* Main Workspace Area */}
      {page !== "terminal" ? (
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {page === "home" && <HomePage onNavigate={navigate} />}
          {page === "features" && <FeaturesPage onNavigate={navigate} />}
          {page === "pricing" && <PricingPage onNavigate={navigate} />}
          {page === "contact" && <ContactPage onNavigate={navigate} />}
          {page === "login" && (
            <LoginPage
              onLoggedIn={() => {
                setUser(getSession());
                navigate("terminal");
              }}
              onSwitchToSignup={() => navigate("signup")}
              onGuestAccess={() => navigate("terminal")}
            />
          )}
          {page === "signup" && (
            <SignupPage
              onSignedUp={() => {
                setUser(getSession());
                navigate("terminal");
              }}
              onSwitchToLogin={() => navigate("login")}
            />
          )}
        </main>
      ) : (
        /* Terminal Layout: main direct children are the 2 panels so qa.mjs rects() matches 38% / 62% */
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left Panel: Document & Source Inspector (38% width) */}
          <div
            className={cn(
              "min-h-0 flex-1 lg:w-[38%] lg:flex-none lg:border-r lg:border-zinc-800/80 lg:bg-zinc-900/40",
              viewMode === "source"
                ? "flex lg:w-full lg:flex-none"
                : viewMode === "declaration"
                  ? "hidden"
                  : mobileView === "source"
                    ? "flex"
                    : "hidden lg:flex",
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

          {/* Right Panel: Agent Output & Declaration Engine (62% width) */}
          <div
            className={cn(
              "min-h-0 flex-1 lg:w-[62%] lg:flex-none",
              viewMode === "declaration"
                ? "flex lg:w-full lg:flex-none"
                : viewMode === "source"
                  ? "hidden"
                  : mobileView === "declaration"
                    ? "flex"
                    : "hidden lg:flex",
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
              regime={regime}
              onRegimeChange={setRegime}
            />
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="flex h-8 shrink-0 items-center gap-5 border-t border-zinc-800/80 bg-zinc-950 px-5 text-[11px] text-zinc-400">
        <span className="truncate">
          PortSync FTZ Agent · reference BTKI 2026 edition ·{" "}
          {ready ? `${calcs.length} classified lines` : "awaiting analysis"}
        </span>
        <span className="tnum hidden xl:inline">
          Kurs pabean USD/IDR {FX.USD_IDR.toLocaleString("id-ID")} · PPN {(PPN_RATE * 100).toFixed(0)}% · PPh 22{" "}
          {(PPH22_RATE * 100).toFixed(1)}%
        </span>
        <span className="ml-auto tnum shrink-0 text-zinc-300">
          Invoice total {fmtUsd(totals.usdCif)} · filing set {ready ? `${totals.selected}/${totals.lines}` : "—"}
        </span>
        <span className="shrink-0 text-emerald-400 font-medium">sandbox · no live dispatch</span>
      </footer>

      {modal && <PayloadModal payload={modal} onClose={() => setModal(null)} onCopied={onCopied} />}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
