import { useMemo, type ReactNode } from "react";
import { ArrowDownRight, Info, Lock, ScanLine } from "lucide-react";
import type { LineCalc } from "../types";
import { hsOptions } from "../lib/engine";
import { fmtIdrShort, fmtQty, fmtUsd } from "../lib/format";
import { cn } from "../lib/cn";
import { Checkbox, Pill, RegBadgeView, TONE_DOT, confidenceTone } from "./ui";

const RISK_EDGE: Record<string, string> = {
  HIGH: "border-l-rose-500",
  MEDIUM: "border-l-amber-500",
  LOW: "border-l-emerald-500",
};

const TH =
  "sticky top-0 z-10 bg-slate-100/95 px-4 py-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-slate-700 uppercase border-b border-slate-200 dark:bg-zinc-900/95 dark:text-zinc-300 dark:border-zinc-800";
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
  onToggleMasterlist,
}: {
  c: LineCalc;
  selected: boolean;
  active: boolean;
  onActive: (id: string | null) => void;
  onToggle: (id: string) => void;
  onOverride: (id: string, hs: string) => void;
  onToggleMasterlist?: (id: string) => void;
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
        "cursor-pointer border-l-3 align-top transition-all duration-150 border-b border-slate-200/70 dark:border-zinc-800/60",
        RISK_EDGE[c.risk],
        active
          ? "bg-blue-50/90 shadow-[inset_0_0_12px_rgba(37,99,235,0.08)] dark:bg-cyan-500/10 dark:shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]"
          : selected
            ? "hover:bg-slate-50/90 dark:hover:bg-zinc-800/40"
            : "opacity-45 hover:opacity-90 bg-slate-100/30 dark:bg-zinc-950/40",
      )}
    >
      <td className={TD} onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onChange={() => onToggle(c.id)} label={`File line ${c.pos}`} />
      </td>

      <td className={TD}>
        <div className="flex items-start gap-2.5">
          <span className="tnum mt-0.5 shrink-0 font-mono text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
            {String(c.pos).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div title={c.line.raw} className="text-[13.5px] font-semibold leading-snug text-slate-900 dark:text-zinc-100">
              {c.line.raw}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-500 dark:text-zinc-400">
              <span className="font-mono font-medium text-slate-700 dark:text-zinc-300">{c.line.supplierRef}</span>
              <span>·</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                {c.line.origin}
              </span>
              <span>·</span>
              <span className="tnum font-medium text-slate-600 dark:text-zinc-300">
                {fmtQty(c.qty)} {c.uom} ({c.line.netKg} kg)
              </span>
              {c.line.ocrNote && (
                <span
                  className="ml-1 inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                  title={c.line.ocrNote}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ScanLine size={11} /> OCR Note
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
        <div className="relative">
          <select
            id={`ovr-${c.id}`}
            value={c.hs}
            onChange={(e) => onOverride(c.id, e.target.value)}
            title={c.overridden ? "Broker override — re-mapped by hand" : "Agent's top BTKI match"}
            className={cn(
              "w-full cursor-pointer appearance-none truncate rounded-lg border px-3 py-1.5 pr-7 font-mono text-[12.5px] font-semibold shadow-2xs transition-colors",
              c.overridden
                ? "border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-500/50 dark:bg-zinc-900 dark:text-amber-300"
                : "border-slate-300 bg-white text-blue-800 hover:border-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-cyan-300 dark:hover:border-zinc-600",
            )}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
          >
            {options.map((o) => (
              <option key={o.hs} value={o.hs} disabled={!o.registered}>
                {o.hs} {o.registered ? `${Math.round(o.confidence * 100)}% Match` : "· not in register"}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 flex min-w-0 items-center gap-2">
          <span
            className={cn("size-2 shrink-0 rounded-full", TONE_DOT[confidenceTone(c.confidence)])}
            title={`${Math.round(c.confidence * 100)}% — classifier agreement with the BTKI register`}
          />
          <span className="truncate text-[12px] font-medium text-slate-600 dark:text-zinc-400" title={c.entry.titleEn}>
            {c.entry.titleEn}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {c.overridden && (
            <Pill tone="warn">
              broker override
            </Pill>
          )}
          {c.isAsset && (
            <div onClick={(e) => e.stopPropagation()}>
              <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <input
                  type="checkbox"
                  checked={Boolean(c.hasMasterlist)}
                  onChange={() => onToggleMasterlist?.(c.id)}
                  className="size-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900"
                />
                <span>BP Batam Masterlist</span>
              </label>
            </div>
          )}
          <div className="tnum text-[11.5px] font-medium">
            {c.blocked ? (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                <Lock size={11} /> blocked (Lartas)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" /> filable
              </span>
            )}
          </div>
        </div>
      </td>

      <td className={cn(TD, "tnum text-right whitespace-nowrap")}>
        <div className="text-[14px] font-bold text-slate-900 dark:text-zinc-100">
          ${fmtUsd(c.usdCif).replace("$ ", "")}
        </div>
        <div className="mt-1 font-semibold text-[12px] text-slate-600 dark:text-zinc-400">
          {fmtIdrShort(c.idrCif)}
        </div>
        <div className="mt-1 text-[11.5px] text-slate-400 dark:text-zinc-500">
          @ ${fmtUsd(c.unitCifUsd).replace("$ ", "")}/u
        </div>
      </td>

      <td className={TD}>
        <div className="tnum text-[12px] text-slate-600 dark:text-zinc-400">
          Std <span className="font-semibold text-slate-800 dark:text-zinc-200">{Math.round(c.bmRate * 100)}% BM</span> +{" "}
          <span className="font-semibold text-slate-800 dark:text-zinc-200">{Math.round(c.ppnRate * 100)}% PPN</span>
          {c.bmadRate > 0 ? ` + ${Math.round(c.bmadRate * 100)}% BMAD` : ""}
        </div>
        <div className="tnum mt-1.5 flex items-center gap-1.5 text-[12.5px] font-bold">
          <ArrowDownRight
            size={13}
            className={c.coverage === 1 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}
          />
          <span className={c.coverage === 1 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}>
            FTZ {Math.round(c.bmRate * (1 - c.coverage) * 100)}% + {Math.round(c.ppnRate * (1 - c.coverage) * 100)}%
          </span>
        </div>
        <div className="tnum mt-1.5 flex flex-wrap items-center gap-x-2.5 text-[12px]">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">saved {fmtIdrShort(c.saved)}</span>
          {c.payable > 0 && (
            <span className="font-semibold text-amber-700 dark:text-amber-400">due {fmtIdrShort(c.payable)}</span>
          )}
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
          {c.badges.length === 0 && <span className="text-[12px] text-slate-400 dark:text-zinc-500">None</span>}
        </div>
        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[11.5px] text-slate-500 dark:text-zinc-400">
          <Info size={12} className="shrink-0 text-slate-400 dark:text-zinc-500" />
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
  onToggleMasterlist,
}: {
  calcs: LineCalc[];
  selectedIds: Set<string>;
  activeId: string | null;
  ready: boolean;
  onActive: (id: string | null) => void;
  onToggle: (id: string) => void;
  onSelectAll: (on: boolean) => void;
  onOverride: (id: string, hs: string) => void;
  onToggleMasterlist?: (id: string) => void;
}) {
  if (!ready) {
    return (
      <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center gap-3.5 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="grid size-12 place-items-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          <ScanLine size={22} />
        </div>
        <div className="text-[14px] font-semibold text-slate-900 dark:text-zinc-100">Declaration engine idle</div>
        <div className="max-w-[420px] text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400">
          Select or drop a shipping manifest on the left, then click{" "}
          <strong className="font-semibold text-slate-800 dark:text-zinc-200">Analyze &amp; Map to BTKI Tariff</strong>. Mapped 8-digit tariff lines, duty avoidance math, and CEISA validation reports will populate here.
        </div>
      </div>
    );
  }

  const allSelected = calcs.every((c) => selectedIds.has(c.id));

  return (
    <div className="scroll-thin min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60">
      <table className="w-full min-w-[760px] table-fixed border-collapse">
        <colgroup>
          {COLS.map((w) => (
            <col key={w} className={w} />
          ))}
          <col />
        </colgroup>
        <thead>
          <tr>
            <Th className="w-12 pr-0">
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
        <tbody className="divide-y divide-slate-200/80 dark:divide-zinc-800/60">
          {calcs.map((c) => (
            <Row
              key={c.id}
              c={c}
              selected={selectedIds.has(c.id)}
              active={activeId === c.id}
              onActive={onActive}
              onToggle={onToggle}
              onOverride={onOverride}
              onToggleMasterlist={onToggleMasterlist}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
