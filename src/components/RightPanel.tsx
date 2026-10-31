import { useState } from "react";
import { ListChecks, Radar, Table2, Sparkles, ShieldCheck, MapPin } from "lucide-react";
import type { DeclarationTotals, DemoInvoice, LineCalc } from "../types";
import { REGIME_LABELS, type Regime } from "../lib/engine";
import { fmtIdr } from "../lib/format";
import { getFtaRecommendation } from "../lib/ftaAdvisor";
import { KpiRow } from "./KpiRow";
import { DeclarationTable } from "./DeclarationTable";
import { ActionFooter } from "./ActionFooter";
import { Btn, Label, Pill } from "./ui";
import { cn } from "../lib/cn";

const BERTHS = [
  { label: "Batam, Indonesia (KPBPB FTZ)", regime: "PPFTZ-01" as Regime },
  { label: "Jakarta, Indonesia (Tanjung Priok)", regime: "PPFTZ-03" as Regime },
  { label: "Surabaya, Indonesia (Tanjung Perak)", regime: "PPFTZ-03" as Regime },
  { label: "Singapore", regime: "PPFTZ-01" as Regime },
];

export function RightPanel({
  invoice,
  calcs,
  totals,
  ready,
  selectedIds,
  activeId,
  onActive,
  onToggle,
  onSelectAll,
  onOverride,
  onDownloadXml,
  onOpenPayload,
  regime = "PPFTZ-01",
  onRegimeChange,
}: {
  invoice: DemoInvoice;
  calcs: LineCalc[];
  totals: DeclarationTotals;
  ready: boolean;
  selectedIds: Set<string>;
  activeId: string | null;
  onActive: (id: string | null) => void;
  onToggle: (id: string) => void;
  onSelectAll: (on: boolean) => void;
  onOverride: (id: string, hs: string) => void;
  onDownloadXml: () => void;
  onOpenPayload: () => void;
  regime?: Regime;
  onRegimeChange?: (r: Regime) => void;
}) {
  const overrides = calcs.filter((c) => c.overridden).length;
  const allSelected = ready && calcs.every((c) => selectedIds.has(c.id));
  const [berth, setBerth] = useState(BERTHS[0]!.label);
  const [panelView, setPanelView] = useState<"items" | "regime" | "advisory">("items");

  const handleRegimeChange = (r: Regime) => {
    if (onRegimeChange) onRegimeChange(r);
  };

  return (
    <section className="scroll-thin flex h-full min-h-0 w-full flex-col gap-3 overflow-y-auto overflow-x-hidden bg-slate-50 text-slate-800 p-4 lg:gap-3.5 lg:p-5 dark:bg-[#09090b] dark:text-zinc-100">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center gap-2.5">
        <Radar size={16} className="shrink-0 text-blue-600 dark:text-cyan-400" />
        <h2 className="truncate text-[13.5px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
          Agent Output &amp; Declaration Engine
        </h2>
        <Pill tone="mut" title="Reference register, deterministic output. No CEISA dispatch.">
          SIMULATED
        </Pill>
        <div className="ml-auto flex items-center gap-3">
          {overrides > 0 && <Pill tone="warn">{overrides} HS override{overrides > 1 ? "s" : ""}</Pill>}
          <span className="tnum hidden text-[11.5px] text-slate-500 font-mono md:inline dark:text-zinc-400">{invoice.docNo}</span>
          <Btn size="sm" variant="ghost" onClick={() => onSelectAll(!allSelected)} disabled={!ready}>
            {allSelected ? "Deselect all" : "Select all"}
          </Btn>
        </div>
      </div>

      {/* KPI 5-Card Rollup */}
      <KpiRow invoice={invoice} totals={totals} calcs={calcs} ready={ready} />

      {/* View Switcher Bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2.5">
          <Label className="inline-flex items-center gap-2 whitespace-nowrap text-slate-700 dark:text-zinc-300">
            <Table2 size={12} className="text-blue-600 dark:text-cyan-400" />
            Interactive Customs Declaration
          </Label>
          <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-200/70 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <button
              type="button"
              onClick={() => setPanelView("items")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                panelView === "items"
                  ? "bg-white text-blue-900 border border-slate-300 shadow-2xs font-semibold dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              Line Items ({calcs.length})
            </button>
            <button
              type="button"
              onClick={() => setPanelView("regime")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                panelView === "regime"
                  ? "bg-white text-blue-900 border border-slate-300 shadow-2xs font-semibold dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              <MapPin size={11} className="inline mr-1 text-emerald-600 dark:text-emerald-400" />
              Berth &amp; Regimes
            </button>
            <button
              type="button"
              onClick={() => setPanelView("advisory")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                panelView === "advisory"
                  ? "bg-white text-blue-900 border border-slate-300 shadow-2xs font-semibold dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              <Sparkles size={11} className="inline mr-1 text-amber-600 dark:text-amber-400" />
              AI Advisory
            </button>
          </div>
        </div>

        <div className="hidden h-px flex-1 bg-slate-200 md:block dark:bg-zinc-800" />

        <span className="hidden items-center gap-1.5 whitespace-nowrap text-[11.5px] text-slate-500 xl:flex dark:text-zinc-400">
          <ListChecks size={12} />
          click a row to locate it in the document
        </span>
      </div>

      {/* Main View Area */}
      {panelView === "items" && (
        <DeclarationTable
          calcs={calcs}
          selectedIds={selectedIds}
          activeId={activeId}
          ready={ready}
          onActive={onActive}
          onToggle={onToggle}
          onSelectAll={onSelectAll}
          onOverride={onOverride}
        />
      )}

      {panelView === "regime" && (
        <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-slate-500 dark:text-zinc-400" />
              <span className="text-[11.5px] font-medium text-slate-700 dark:text-zinc-300">Berth / Destination</span>
              <select
                value={berth}
                onChange={(e) => {
                  setBerth(e.target.value);
                  const b = BERTHS.find((x) => x.label === e.target.value);
                  if (b) handleRegimeChange(b.regime);
                }}
                className="ml-auto rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] text-slate-800 shadow-2xs hover:border-slate-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {BERTHS.map((b) => (
                  <option key={b.label} value={b.label}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div
              role="tablist"
              aria-label="Declaration regime"
              className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
            >
              {(["PPFTZ-01", "PPFTZ-02", "PPFTZ-03"] as Regime[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={regime === r}
                  data-regime={r}
                  onClick={() => handleRegimeChange(r)}
                  className={
                    regime === r
                      ? "shrink-0 rounded-md border border-blue-500/40 bg-blue-50 px-4 py-1.5 text-[12px] font-bold text-blue-900 shadow-2xs transition-colors dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-300"
                      : "shrink-0 rounded-md border border-transparent px-4 py-1.5 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 cursor-pointer"
                  }
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-[11.5px] text-slate-500 dark:text-zinc-400">{REGIME_LABELS[regime]}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="text-[12.5px] font-semibold tracking-tight text-slate-900 dark:text-zinc-200">Tax &amp; Duty Summary</div>
            <p className="mt-1 text-[11.5px] text-slate-600 dark:text-zinc-400">
              {regime === "PPFTZ-03"
                ? "Mainland release: all lines pay standard duty + 11% PPN."
                : regime === "PPFTZ-02"
                  ? "Zone-to-zone transfer: no tax or duty."
                  : "In-zone facility: duty & PPN suspended while goods stay in the enclave."}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 p-3 dark:bg-emerald-500/10">
                <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Tax-free / Exempt</div>
                <div className="tnum mt-1 text-[15px] font-bold text-emerald-800 dark:text-emerald-300">
                  {ready ? fmtIdr(totals.saved) : "—"}
                </div>
                <div className="mt-1 text-[11.5px] text-emerald-700 dark:text-emerald-400/80">
                  {ready ? `${calcs.filter((c) => c.payable === 0).length} of ${calcs.length} lines` : "—"}
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-3 dark:bg-amber-500/10">
                <div className="text-[11px] font-medium uppercase tracking-wider text-amber-800 dark:text-amber-400">Payable (duty + PPN)</div>
                <div className="tnum mt-1 text-[15px] font-bold text-amber-800 dark:text-amber-300">
                  {ready ? fmtIdr(totals.payable) : "—"}
                </div>
                <div className="mt-1 text-[11.5px] text-amber-700 dark:text-amber-400/80">
                  {ready ? `${calcs.filter((c) => c.payable > 0).length} of ${calcs.length} lines` : "—"}
                </div>
              </div>
            </div>
            {ready && calcs.some((c) => c.payable > 0) && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">Items that must pay</div>
                <ul className="mt-2 space-y-1.5 text-[12px] text-slate-700 dark:text-zinc-300">
                  {calcs
                    .filter((c) => c.payable > 0)
                    .map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-3">
                        <span className="truncate">POS {c.pos} · {c.hs}</span>
                        <span className="tnum font-semibold text-amber-700 dark:text-amber-400">{fmtIdr(c.payable)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {panelView === "advisory" && (
        <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-3.5 shadow-2xs dark:border-cyan-500/30 dark:bg-gradient-to-r dark:from-cyan-950/40 dark:to-blue-950/40">
            <div className="flex items-center gap-2 text-blue-900 dark:text-cyan-300">
              <Sparkles size={14} className="text-blue-600 dark:text-cyan-400" />
              <span className="text-[12.5px] font-semibold tracking-tight">AI Tariff Optimization &amp; FTA Advisory</span>
            </div>
            <ul className="mt-2.5 space-y-2 text-[11.5px] leading-relaxed text-slate-700 dark:text-zinc-300">
              {(() => {
                const origin = calcs[0]?.line.origin || "CN";
                const fta = getFtaRecommendation(origin);
                return (
                  <li className="flex items-start gap-2">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      <b className="font-semibold text-slate-900 dark:text-emerald-300">{fta.schemeName} ({fta.formType}) Opportunity:</b>{" "}
                      {fta.adviceMessage}
                      <div className="text-[10px] text-blue-700 font-mono mt-0.5 dark:text-cyan-400">Legal Basis: {fta.legalBasis}</div>
                    </span>
                  </li>
                );
              })()}
              <li className="flex items-start gap-2">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <b className="font-semibold text-slate-900 dark:text-emerald-300">Masterlist Quota Balance:</b> Batam machinery facility quota has 420 units remaining. Auto-deduction ready.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <b className="font-semibold text-slate-900 dark:text-emerald-300">Audit Defense Basis:</b>
                  <span className="ml-1.5 inline-block rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    SOP Bea Cukai Batam No. KEP-54/KPU.02/2023
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <ActionFooter totals={totals} ready={ready} onDownloadXml={onDownloadXml} onOpenPayload={onOpenPayload} />
    </section>
  );
}
