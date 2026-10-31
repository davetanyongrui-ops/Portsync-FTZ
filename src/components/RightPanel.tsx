import { useState } from "react";
import { ListChecks, Radar, Table2, ShieldCheck, MapPin, Scale } from "lucide-react";
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
  onToggleMasterlist,
  onOpenLegal,
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
  onToggleMasterlist?: (id: string) => void;
  onOpenLegal?: (doc: "disclaimer" | "tos" | "privacy") => void;
}) {
  const overrides = calcs.filter((c) => c.overridden).length;
  const allSelected = ready && calcs.every((c) => selectedIds.has(c.id));
  const [berth, setBerth] = useState(BERTHS[0]!.label);
  const [panelView, setPanelView] = useState<"items" | "regime" | "advisory">("items");

  const handleRegimeChange = (r: Regime) => {
    if (onRegimeChange) onRegimeChange(r);
  };

  return (
    <section className="scroll-thin flex h-full min-h-0 w-full flex-col gap-3 overflow-y-auto overflow-x-hidden bg-slate-50 text-slate-800 p-4 lg:gap-3.5 lg:p-5 dark:bg-[#0c0d0e] dark:text-zinc-100">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg border border-blue-500/30 bg-blue-50 text-blue-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400">
          <Radar size={17} strokeWidth={2.2} />
        </div>
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Customs Declaration &amp; BTKI Tariff Engine
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11.5px] text-slate-500 dark:text-zinc-400">
              Deterministic statutory mapping · KPBPB Batam Protocol
            </span>
            <span className="rounded bg-slate-200/80 px-1.5 py-px font-mono text-[10px] font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
              BTKI 2026
            </span>
            {onOpenLegal && (
              <button
                type="button"
                onClick={() => onOpenLegal("disclaimer")}
                className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-px text-[10px] font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer shadow-2xs transition-colors"
                title="PMK 185/2022 Statutory Compliance Disclaimer"
              >
                <Scale size={10} className="text-blue-600 dark:text-cyan-400" />
                <span>Disclaimer</span>
              </button>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {overrides > 0 && (
            <Pill tone="warn">
              {overrides} HS override{overrides > 1 ? "s" : ""}
            </Pill>
          )}
          <span className="tnum hidden font-mono text-[12px] font-medium text-slate-600 md:inline dark:text-zinc-400">
            {invoice.docNo}
          </span>
          <Btn size="sm" variant="secondary" onClick={() => onSelectAll(!allSelected)} disabled={!ready}>
            {allSelected ? "Deselect all" : "Select all"}
          </Btn>
        </div>
      </div>

      {/* KPI 5-Card Rollup */}
      <KpiRow invoice={invoice} totals={totals} calcs={calcs} ready={ready} />

      {/* View Switcher Bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <Label className="inline-flex items-center gap-2 whitespace-nowrap text-slate-700 dark:text-zinc-300 font-semibold">
            <Table2 size={13} className="text-blue-600 dark:text-cyan-400" />
            Declaration Workspace
          </Label>
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-200/60 p-1 dark:border-zinc-800 dark:bg-zinc-900/60">
            <button
              type="button"
              onClick={() => setPanelView("items")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all cursor-pointer",
                panelView === "items"
                  ? "bg-white text-blue-900 border border-slate-200/80 shadow-xs dark:bg-zinc-800 dark:text-cyan-300 dark:border-zinc-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              Line Items ({calcs.length})
            </button>
            <button
              type="button"
              onClick={() => setPanelView("regime")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                panelView === "regime"
                  ? "bg-white text-blue-900 border border-slate-200/80 shadow-xs dark:bg-zinc-800 dark:text-cyan-300 dark:border-zinc-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              <MapPin size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Berth &amp; Regimes</span>
            </button>
            <button
              type="button"
              onClick={() => setPanelView("advisory")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                panelView === "advisory"
                  ? "bg-white text-blue-900 border border-slate-200/80 shadow-xs dark:bg-zinc-800 dark:text-cyan-300 dark:border-zinc-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              <ShieldCheck size={12} className="text-blue-600 dark:text-cyan-400" />
              <span>Tariff &amp; FTA Advisory</span>
            </button>
          </div>
        </div>

        <div className="hidden h-px flex-1 bg-slate-200 md:block dark:bg-zinc-800" />

        <span className="hidden items-center gap-1.5 whitespace-nowrap text-[12px] text-slate-500 xl:flex dark:text-zinc-400">
          <ListChecks size={13} />
          Click any row to locate item in original manifest
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
          onToggleMasterlist={onToggleMasterlist}
        />
      )}

      {panelView === "regime" && (
        <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-slate-600 dark:text-zinc-400" />
              <span className="text-[13px] font-semibold text-slate-800 dark:text-zinc-200">
                Port of Discharge / Enclave Destination
              </span>
              <select
                value={berth}
                onChange={(e) => {
                  setBerth(e.target.value);
                  const b = BERTHS.find((x) => x.label === e.target.value);
                  if (b) handleRegimeChange(b.regime);
                }}
                className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-800 shadow-2xs hover:border-slate-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
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
              className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-950"
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
                      ? "shrink-0 rounded-lg border border-blue-500/40 bg-blue-50 px-4 py-2 text-[12.5px] font-bold text-blue-900 shadow-2xs transition-colors dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-300 cursor-pointer"
                      : "shrink-0 rounded-lg border border-transparent px-4 py-2 text-[12.5px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200 cursor-pointer"
                  }
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-slate-500 dark:text-zinc-400">{REGIME_LABELS[regime]}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="text-[13.5px] font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Tax &amp; Import Duty Breakdown
            </div>
            <p className="mt-1 text-[12px] text-slate-600 dark:text-zinc-400">
              {regime === "PPFTZ-03"
                ? "Mainland release (TLDDP): standard Bea Masuk and 11% PPN Impor are levied in full."
                : regime === "PPFTZ-02"
                  ? "Zone-to-zone transfer: Goods move between Free Trade Zones duty-free."
                  : "Enclave facility: Duty & PPN remain fully suspended while goods remain inside Batam."}
            </p>
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-4 dark:bg-emerald-500/10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Tax-Exempt / Suspended Savings
                </div>
                <div className="tnum mt-1.5 text-[17px] font-bold text-emerald-800 dark:text-emerald-300">
                  {ready ? fmtIdr(totals.saved) : "—"}
                </div>
                <div className="mt-1 text-[12px] font-medium text-emerald-700 dark:text-emerald-400/80">
                  {ready ? `${calcs.filter((c) => c.payable === 0).length} of ${calcs.length} line items` : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-50/80 p-4 dark:bg-amber-500/10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Payable Duty + PPN
                </div>
                <div className="tnum mt-1.5 text-[17px] font-bold text-amber-800 dark:text-amber-300">
                  {ready ? fmtIdr(totals.payable) : "—"}
                </div>
                <div className="mt-1 text-[12px] font-medium text-amber-700 dark:text-amber-400/80">
                  {ready ? `${calcs.filter((c) => c.payable > 0).length} of ${calcs.length} line items` : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {panelView === "advisory" && (
        <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="rounded-xl border border-blue-500/30 bg-blue-50/70 p-4.5 dark:border-cyan-500/30 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-blue-900 dark:text-cyan-300">
              <ShieldCheck size={16} className="text-blue-600 dark:text-cyan-400" />
              <span className="text-[13.5px] font-bold tracking-tight">
                Tariff Optimization &amp; FTA Advisory
              </span>
            </div>
            <ul className="mt-3 space-y-3 text-[12.5px] leading-relaxed text-slate-700 dark:text-zinc-300">
              {(() => {
                const origin = calcs[0]?.line.origin || "CN";
                const fta = getFtaRecommendation(origin);
                return (
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <strong className="font-semibold text-slate-900 dark:text-emerald-300">
                        {fta.schemeName} ({fta.formType}) Opportunity:
                      </strong>{" "}
                      {fta.adviceMessage}
                      <div className="mt-1 text-[11px] font-mono text-blue-700 dark:text-cyan-400">
                        Statutory Legal Basis: {fta.legalBasis}
                      </div>
                    </div>
                  </li>
                );
              })()}
              <li className="flex items-start gap-2.5">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <strong className="font-semibold text-slate-900 dark:text-emerald-300">
                    Masterlist Machinery Quota Balance:
                  </strong>{" "}
                  BP Batam capital equipment masterlist has 420 tariff exemption units remaining. Auto-deduction ready.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <strong className="font-semibold text-slate-900 dark:text-emerald-300">
                    Audit Defense Protocol:
                  </strong>{" "}
                  Complies with Standard Operating Procedure{" "}
                  <code className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                    SOP Bea Cukai Batam No. KEP-54/KPU.02/2023
                  </code>
                </div>
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
