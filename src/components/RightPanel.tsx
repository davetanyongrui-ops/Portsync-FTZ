import { useState } from "react";
import { ListChecks, Radar, Table2, Sparkles, ShieldCheck, MapPin } from "lucide-react";
import type { DeclarationTotals, DemoInvoice, LineCalc } from "../types";
import { REGIME_LABELS, type Regime } from "../lib/engine";
import { fmtIdr } from "../lib/format";
import { getFtaRecommendation } from "../lib/ftaAdvisor";
import { KpiRow } from "./KpiRow";

const BERTHS = [
  { label: "Batam, Indonesia (KPBPB FTZ)", regime: "PPFTZ-01" as Regime },
  { label: "Jakarta, Indonesia (Tanjung Priok)", regime: "PPFTZ-03" as Regime },
  { label: "Surabaya, Indonesia (Tanjung Perak)", regime: "PPFTZ-03" as Regime },
  { label: "Singapore", regime: "PPFTZ-01" as Regime },
];
import { DeclarationTable } from "./DeclarationTable";
import { ActionFooter } from "./ActionFooter";
import { Btn, Label, Pill } from "./ui";

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
  regime,
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
  regime: Regime;
  onRegimeChange: (r: Regime) => void;
}) {
  const overrides = calcs.filter((c) => c.overridden).length;
  const allSelected = ready && calcs.every((c) => selectedIds.has(c.id));
  const [berth, setBerth] = useState(BERTHS[0]!.label);

  return (
    <section className="scroll-thin flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto bg-white p-5 lg:p-6">
      <div className="flex shrink-0 flex-wrap items-center gap-2.5">
        <Radar size={16} className="shrink-0 text-blue-600" />
        <h2 className="truncate text-[13.5px] font-semibold tracking-tight text-slate-900">
          Agent Output &amp; Declaration Engine
        </h2>
        <Pill tone="mut" title="Reference register, deterministic output. No CEISA dispatch.">
          SIMULATED
        </Pill>
        <div className="ml-auto flex items-center gap-3">
          {overrides > 0 && <Pill tone="warn">{overrides} HS override{overrides > 1 ? "s" : ""}</Pill>}
          <span className="tnum hidden text-[11.5px] text-slate-500 md:inline">{invoice.docNo}</span>
          <Btn size="sm" variant="ghost" onClick={() => onSelectAll(!allSelected)} disabled={!ready}>
            {allSelected ? "Deselect all" : "Select all"}
          </Btn>
        </div>
      </div>

      <div className="shrink-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-slate-500" />
          <span className="text-[11.5px] font-medium text-slate-600">Berth / Destination</span>
          <select
            value={berth}
            onChange={(e) => {
              setBerth(e.target.value);
              const b = BERTHS.find((x) => x.label === e.target.value);
              if (b) onRegimeChange(b.regime);
            }}
            className="ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-800 shadow-2xs"
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
          className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1"
        >
          {(["PPFTZ-01", "PPFTZ-02", "PPFTZ-03"] as Regime[]).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={regime === r}
              data-regime={r}
              onClick={() => onRegimeChange(r)}
              className={
                regime === r
                  ? "shrink-0 rounded-lg border border-blue-200 bg-white px-4 py-1.5 text-[12px] font-bold text-blue-700 shadow-2xs transition-colors"
                  : "shrink-0 rounded-lg border border-transparent px-4 py-1.5 text-[12px] font-medium text-slate-500 transition-colors hover:bg-white/60 hover:text-slate-800"
              }
            >
              {r}
            </button>
          ))}
        </div>
        <p className="text-[11.5px] text-slate-500">{REGIME_LABELS[regime]}</p>
      </div>

      <KpiRow invoice={invoice} totals={totals} calcs={calcs} ready={ready} />

      <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="text-[12.5px] font-semibold tracking-tight text-slate-900">Tax &amp; Duty Summary</div>
        <p className="mt-1 text-[11.5px] text-slate-500">
          {regime === "PPFTZ-03"
            ? "Mainland release: all lines pay standard duty + 11% PPN."
            : regime === "PPFTZ-02"
              ? "Zone-to-zone transfer: no tax or duty."
              : "In-zone facility: duty &amp; PPN suspended while goods stay in the enclave."}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">Tax-free / Exempt</div>
            <div className="tnum mt-1 text-[15px] font-bold text-emerald-700">
              {ready ? fmtIdr(totals.saved) : "—"}
            </div>
            <div className="mt-1 text-[11.5px] text-emerald-700/80">
              {ready ? `${calcs.filter((c) => c.payable === 0).length} of ${calcs.length} lines` : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-amber-700">Payable (duty + PPN)</div>
            <div className="tnum mt-1 text-[15px] font-bold text-amber-700">
              {ready ? fmtIdr(totals.payable) : "—"}
            </div>
            <div className="mt-1 text-[11.5px] text-amber-700/80">
              {ready ? `${calcs.filter((c) => c.payable > 0).length} of ${calcs.length} lines` : "—"}
            </div>
          </div>
        </div>
        {ready && calcs.some((c) => c.payable > 0) && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Items that must pay</div>
            <ul className="mt-2 space-y-1.5 text-[12px] text-slate-700">
              {calcs
                .filter((c) => c.payable > 0)
                .map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3">
                    <span className="truncate">POS {c.pos} · {c.hs}</span>
                    <span className="tnum font-semibold text-amber-700">{fmtIdr(c.payable)}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      <div className="shrink-0 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 p-2.5 shadow-2xs">
        <div className="flex items-center gap-2 text-blue-900">
          <Sparkles size={14} />
          <span className="text-[12.5px] font-semibold tracking-tight">AI Tariff Optimization & FTA Advisory</span>
        </div>
        <ul className="mt-1 space-y-0.5 text-[11px] leading-tight text-slate-700">
          {(() => {
            const origin = calcs[0]?.line.origin || "CN";
            const fta = getFtaRecommendation(origin);
            return (
              <li className="flex items-start gap-2">
                <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                <span>
                  <b className="font-semibold text-emerald-700">{fta.schemeName} ({fta.formType}) Opportunity:</b>{" "}
                  {fta.adviceMessage}
                  <div className="text-[10px] text-blue-600 font-mono mt-0.5">Legal Basis: {fta.legalBasis}</div>
                </span>
              </li>
            );
          })()}
          <li className="flex items-start gap-2">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>
              <b className="font-semibold text-emerald-700">Masterlist Balance:</b> Manufacturer has 420 units remaining in
              BP Batam Machinery Masterlist quota. Auto-deduction available.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck size={13} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>
              <b className="font-semibold text-emerald-700">Audit Defense:</b>
              <span className="ml-1.5 inline-block rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-600">
                SOP Bea Cukai Batam No. KEP-54/KPU.02/2023
              </span>
            </span>
          </li>
        </ul>
      </div>

      <div className="flex shrink-0 items-center gap-3 pt-0.5">
        <Label className="inline-flex items-center gap-2 whitespace-nowrap text-slate-700">
          <Table2 size={12} />
          Interactive Customs Declaration
        </Label>
        <div className="h-px flex-1 bg-slate-200" />
        <span className="hidden items-center gap-1.5 whitespace-nowrap text-[11.5px] text-slate-500 lg:flex">
          <ListChecks size={12} />
          click a row to locate it in the document
        </span>
      </div>

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

      <ActionFooter totals={totals} ready={ready} onDownloadXml={onDownloadXml} onOpenPayload={onOpenPayload} />
    </section>
  );
}