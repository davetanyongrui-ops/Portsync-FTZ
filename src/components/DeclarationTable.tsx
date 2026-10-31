import { useMemo, type ReactNode } from "react";
import { ArrowDownRight, Info, Lock, ScanLine } from "lucide-react";
import type { LineCalc } from "../types";
import { hsOptions } from "../lib/engine";
import { fmtIdrShort, fmtQty, fmtUsd } from "../lib/format";
import { cn } from "../lib/cn";
import { Checkbox, Pill, RegBadgeView, TONE_DOT, confidenceTone } from "./ui";

const RISK_EDGE: Record<string, string> = {
  HIGH: "border-l-rose-500/70",
  MEDIUM: "border-l-amber-500/60",
  LOW: "border-l-emerald-500/50",
};

const TH =
  "sticky top-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-slate-600 uppercase border-b border-slate-200";
const TD = "relative px-4 py-3.5";

const COLS = ["w-[44px]", "w-[22%]", "w-[25%]", "w-[11%]", "w-[18%]"];

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn(TH, className)}>
      {children}
    </th>
  );
}

function Row({
  c,
  selected,
  active,
  onActive,
  onToggle,
  onOverride,
}: {
  c: LineCalc;
  selected: boolean;
  active: boolean;
  onActive: (id: string | null) => void;
  onToggle: (id: string) => void;
  onOverride: (id: string, hs: string) => void;
}) {
  const options = useMemo(() => hsOptions(c.line), [c.line]);
  const visibleBadges = c.badges.slice(0, 3);
  const hidden = c.badges.length - visibleBadges.length;

  return (
    <tr
      data-line={c.id}
      data-risk={c.risk}
      data-selected={selected ? "true" : "false"}
      onClick={() => onActive(active ? null : c.id)}
      className={cn(
        "cursor-pointer border-l-2 align-top transition-colors border-b border-slate-100",
        RISK_EDGE[c.risk],
        active
          ? "bg-blue-50/70"
          : selected
            ? "hover:bg-slate-50/80"
            : "opacity-50 hover:opacity-90",
      )}
    >
      <td className={TD} onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onChange={() => onToggle(c.id)} label={`File line ${c.pos}`} />
      </td>

      <td className={TD}>
        <div className="flex items-start gap-2">
          <span className="tnum mt-px shrink-0 text-[11px] text-slate-400">{String(c.pos).padStart(2, "0")}</span>
          <div className="min-w-0 max-w-[200px]">
            <div title={c.line.raw} className="line-clamp-2 text-[13px] leading-snug text-slate-800">
              {c.line.raw}
            </div>
            <div className="mt-1.5 text-[11.5px] leading-[1.5] text-slate-500">
              <span className="font-mono">{c.line.supplierRef}</span> · {c.line.origin} ·{" "}
              <span className="tnum">
                {fmtQty(c.qty)} {c.uom} · {c.line.netKg} kg
              </span>
              {c.line.ocrNote && (
                <span
                  className="ml-1.5 inline-flex items-center gap-1 align-middle text-violet-600/80"
                  title={c.line.ocrNote}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ScanLine size={11} /> note
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      <td className={TD} onClick={(e) => e.stopPropagation()}>
        <label className="sr-only" htmlFor={`ovr-${c.id}`}>
          Edit HS code for line {c.pos}
        </label>
        <select
          id={`ovr-${c.id}`}
          value={c.hs}
          onChange={(e) => onOverride(c.id, e.target.value)}
          title={c.overridden ? "Broker override — re-mapped by hand" : "Agent's top BTKI match"}
          className={cn(
            "w-full cursor-pointer appearance-none truncate rounded border bg-white px-2 py-1 pr-6 font-mono text-xs transition-colors",
            c.overridden
              ? "border-amber-400 text-amber-700 hover:border-amber-500"
              : "border-slate-200 text-blue-700 hover:border-slate-300",
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 6px center",
          }}
        >
          {options.map((o) => (
            <option key={o.hs} value={o.hs} disabled={!o.registered}>
              {o.hs} {o.registered ? `${Math.round(o.confidence * 100)}%` : "· not in register"}
            </option>
          ))}
        </select>
        <div className="mt-2 flex min-w-0 items-center gap-2">
          <span
            className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[confidenceTone(c.confidence)])}
            title={`${Math.round(c.confidence * 100)}% — classifier agreement with the BTKI register`}
          />
          <span className="truncate text-[11.5px] text-slate-500" title={c.entry.titleEn}>
            {c.entry.titleEn}
          </span>
        </div>
        {c.overridden && (
          <Pill tone="warn" className="mt-2">
            broker override
          </Pill>
        )}
        <div className="tnum mt-2 text-[11.5px] whitespace-nowrap">
          {c.blocked ? (
            <span className="inline-flex items-center gap-1 text-rose-600">
              <Lock size={10} /> blocked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <span className="size-1.5 rounded-full bg-emerald-500" /> filable
            </span>
          )}
        </div>
      </td>

      <td className={cn(TD, "tnum text-right whitespace-nowrap")}>
        <div className="text-[13px] font-semibold text-slate-900">{fmtUsd(c.usdCif).replace("$ ", "")}</div>
        <div className="mt-1 text-[11.5px] text-slate-500">{fmtIdrShort(c.idrCif)}</div>
        <div className="mt-1 text-[11px] text-slate-400">@ {fmtUsd(c.unitCifUsd).replace("$ ", "")} / unit</div>
      </td>

      <td className={TD}>
        <div className="tnum text-[11.5px] text-slate-500">
          Std {Math.round(c.bmRate * 100)}% BM + {Math.round(c.ppnRate * 100)}% PPN
          {c.bmadRate > 0 ? ` + ${Math.round(c.bmadRate * 100)}% BMAD` : ""}
        </div>
        <div className="tnum mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold">
          <ArrowDownRight size={12} className={c.coverage === 1 ? "text-emerald-600" : "text-amber-600"} />
          <span className={c.coverage === 1 ? "text-emerald-600" : "text-amber-600"}>
            FTZ {Math.round(c.bmRate * (1 - c.coverage) * 100)}% + {Math.round(c.ppnRate * (1 - c.coverage) * 100)}%
          </span>
        </div>
        <div className="tnum mt-1.5 flex flex-wrap items-center gap-x-2 text-[11.5px]">
          <span className="text-emerald-600">saved {fmtIdrShort(c.saved)}</span>
          {c.payable > 0 && <span className="text-amber-600">due {fmtIdrShort(c.payable)}</span>}
        </div>
      </td>

      <td className={TD}>
        <div className="flex flex-wrap gap-1.5">
          {visibleBadges.map((b) => (
            <RegBadgeView key={b.label} badge={b} />
          ))}
          {hidden > 0 && (
            <Pill
              tone="mut"
              title={c.badges
                .slice(3)
                .map((b) => `${b.label}: ${b.detail}`)
                .join("\n\n")}
              className="cursor-help"
            >
              +{hidden}
            </Pill>
          )}
          {c.badges.length === 0 && <span className="text-[11.5px] text-slate-400">none</span>}
        </div>
        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[11.5px] text-slate-500">
          <Info size={11} className="shrink-0 text-slate-400" />
          <span className="truncate">{c.fta.scheme.replace(" — ", "/")}</span>
        </div>
      </td>
    </tr>
  );
}

export function DeclarationTable({
  calcs,
  selectedIds,
  activeId,
  ready,
  onActive,
  onToggle,
  onSelectAll,
  onOverride,
}: {
  calcs: LineCalc[];
  selectedIds: Set<string>;
  activeId: string | null;
  ready: boolean;
  onActive: (id: string | null) => void;
  onToggle: (id: string) => void;
  onSelectAll: (on: boolean) => void;
  onOverride: (id: string, hs: string) => void;
}) {
  if (!ready) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
        <div className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white">
          <ScanLine size={20} className="text-slate-400" />
        </div>
        <div className="text-[14px] font-medium text-slate-800">Declaration engine idle</div>
        <div className="max-w-[380px] text-[12.5px] leading-relaxed text-slate-500">
          Stage a document on the left, then run{" "}
          <b className="font-medium text-slate-700">Analyze &amp; Map to BTKI Tariff</b>. Classified lines, duty
          comparison and Lartas tags land here.
        </div>
      </div>
    );
  }

  const allSelected = calcs.every((c) => selectedIds.has(c.id));

  return (
    <div className="scroll-thin min-h-0 max-h-[46vh] flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xs lg:max-h-[46vh]">
      <table className="w-full min-w-[760px] table-fixed border-collapse">
        <colgroup>
          {COLS.map((w) => (
            <col key={w} className={w} />
          ))}
          <col />
        </colgroup>
        <thead>
          <tr>
            <Th className="w-11 pr-0">
              <span onClick={(e) => e.stopPropagation()}>
                <Checkbox checked={allSelected} onChange={() => onSelectAll(!allSelected)} label="Select all lines" />
              </span>
            </Th>
            <Th>Raw item description</Th>
            <Th>BTKI / HS · override</Th>
            <Th className="text-right">CIF (USD)</Th>
            <Th>Standard vs FTZ rate</Th>
            <Th>Regulatory tag</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {calcs.map((c) => (
            <Row
              key={c.id}
              c={c}
              selected={selectedIds.has(c.id)}
              active={activeId === c.id}
              onActive={onActive}
              onToggle={onToggle}
              onOverride={onOverride}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}