import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Lock, TriangleAlert } from "lucide-react";
import type { InvoiceLine, LineCalc, RegulatoryBadge } from "../types";
import { hsOptions } from "../lib/engine";
import { REGISTER_SIZE, TARIFF } from "../data/tariff";
import { fmtIdrShort, fmtUsd } from "../lib/format";
import { cn } from "../lib/cn";
import { Checkbox, RegBadgeView, Tag } from "./ui";

const RISK_EDGE: Record<string, string> = {
  HIGH: "border-l-bad",
  MEDIUM: "border-l-warn",
  LOW: "border-l-transparent",
};

const TH =
  "sticky top-0 z-10 border-b border-line bg-surface px-2.5 py-2 text-left text-[10px] font-semibold tracking-[0.07em] whitespace-nowrap text-ink-3 uppercase";
const TD = "px-2.5 py-2 align-top";

const COLS = ["34px", "auto", "20%", "12%", "15%", "15%"];

/** Dense table gets the terse flag wording; the full sentence stays in the tooltip and Advisory tab. */
const SHORT_FLAG: Partial<Record<RegulatoryBadge["kind"], string>> = {
  facility: "FTZ active",
  tpbd: "TPBD",
  "lartas-pre": "Lartas pre",
  "lartas-post": "Lartas post",
  sni: "SNI",
  preference: "FTA rate",
  excise: "Excise",
  unclassified: "No heading",
  "rate-range": "Rate range",
  ad: "Anti-dumping",
  tkdn: "TKDN",
  asset: "Asset",
  figure: "Check figures",
};

function flagLabel(b: RegulatoryBadge) {
  const short = SHORT_FLAG[b.kind];
  return short ? { ...b, label: short } : b;
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th scope="col" className={cn(TH, className)}>
      {children}
    </th>
  );
}

/**
 * A recognised figure the user can correct in place. OCR mis-reads are real —
 * the value commits on blur or Enter so a half-typed edit never prices a line.
 */
function NumInput({
  value,
  onCommit,
  label,
  width = "w-[64px]",
}: {
  value: number;
  onCommit: (n: number) => void;
  label: string;
  width?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft.replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0 && n !== value) onCommit(n);
    else setDraft(String(value));
  };
  return (
    <input
      aria-label={label}
      title={label}
      inputMode="decimal"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "tnum rounded-[3px] border border-transparent bg-transparent px-1 py-0 text-right font-mono text-[10.5px] text-ink-2 outline-none transition-colors hover:border-line-strong focus:border-ink-3 focus:bg-surface focus:text-ink",
        width,
      )}
    />
  );
}

function Row({
  c,
  selected,
  active,
  onActive,
  onToggle,
  onOverride,
  onEditLine,
  onToggleMasterlist,
}: {
  c: LineCalc;
  selected: boolean;
  active: boolean;
  onActive: (id: string | null) => void;
  onToggle: (id: string) => void;
  onOverride: (id: string, hs: string) => void;
  onEditLine: (id: string, patch: Partial<Pick<InvoiceLine, "qty" | "unitCifUsd">>) => void;
  onToggleMasterlist?: (id: string) => void;
}) {
  const options = useMemo(() => hsOptions(c.line), [c.line]);
  /** Everything in the register, so a wrong or missing heading can be corrected here. */
  const rest = useMemo(() => {
    const suggested = new Set(options.map((o) => o.hs));
    return TARIFF.filter((e) => !suggested.has(e.hs));
  }, [options]);
  const visible = c.badges.slice(0, 2);
  const hidden = c.badges.length - visible.length;

  return (
    <tr
      data-line={c.id}
      data-risk={c.risk}
      data-selected={selected ? "true" : "false"}
      onClick={() => onActive(active ? null : c.id)}
      className={cn(
        "cursor-pointer border-b border-l-2 border-b-line align-top transition-colors",
        RISK_EDGE[c.risk],
        active ? "bg-brand-soft" : selected ? "hover:bg-sunken/60" : "bg-sunken/40 hover:bg-sunken/70",
      )}
    >
      <td className={TD} onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onChange={() => onToggle(c.id)} label={`File line ${c.pos}`} />
      </td>

      <td className={TD}>
        <div className="flex items-start gap-2">
          <span className="tnum mt-px w-4 shrink-0 font-mono text-[10.5px] text-ink-3">
            {String(c.pos).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <div
              title={c.line.raw}
              className={cn(
                "line-clamp-2 text-[12px] leading-[1.45]",
                selected ? "text-ink" : "text-ink-2",
              )}
            >
              {c.line.raw}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono text-[10px] text-ink-3">
              <span>{c.line.supplierRef}</span>
              <span className="text-line-strong">/</span>
              <span>{c.line.origin}</span>
              <span className="text-line-strong">/</span>
              <span className="tnum inline-flex items-baseline gap-0.5" onClick={(e) => e.stopPropagation()}>
                <NumInput
                  value={c.qty}
                  width="w-[52px]"
                  label={`Quantity for line ${c.pos}`}
                  onCommit={(n) => onEditLine(c.id, { qty: n })}
                />
                <span>{c.uom}</span>
              </span>
              {c.figureMismatch && (
                <span
                  className="inline-flex items-center gap-1 text-warn"
                  title={`Qty × unit price gives ${fmtUsd(c.usdCif)} but the document prints ${fmtUsd(c.line.docAmountUsd ?? 0)}.`}
                >
                  <TriangleAlert size={9} strokeWidth={2.5} /> check qty × price
                </span>
              )}
              {c.blocked && (
                <span className="inline-flex items-center gap-1 text-bad">
                  <Lock size={9} strokeWidth={2.5} /> blocked
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
            "w-full cursor-pointer appearance-none rounded-[4px] border py-[3px] pr-5 pl-1.5 font-mono text-[11.5px] font-semibold transition-colors",
            c.overridden
              ? "border-warn/50 bg-warn-soft text-warn"
              : "border-line-strong bg-surface text-ink hover:border-ink-3",
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='%2383858b' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 6px center",
          }}
        >
          <option value="">— assign a heading —</option>
          {options.length > 0 && (
            <optgroup label="Suggested">
              {options.map((o) => (
                <option key={o.hs} value={o.hs}>
                  {o.hs} · {Math.round(o.confidence * 100)}%
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={`Register (${rest.length})`}>
            {rest.map((e) => (
              <option key={e.hs} value={e.hs}>
                {e.hs} · {e.titleEn.slice(0, 54)}
              </option>
            ))}
          </optgroup>
        </select>
        <div
          className={cn(
            "mt-1 truncate text-[10.5px] leading-tight",
            c.unclassified ? "text-bad" : "text-ink-3",
          )}
          title={c.entry.titleEn}
        >
          {c.unclassified ? "No heading matched — pick one" : c.entry.titleEn}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span
            className={cn(
              "font-mono text-[9.5px]",
              c.confidence >= 0.92 ? "text-ok" : c.confidence >= 0.75 ? "text-ink-3" : "text-warn",
            )}
          >
            {Math.round(c.confidence * 100)}% match
          </span>
          {c.overridden && <Tag tone="warn">override</Tag>}
        </div>
      </td>

      <td className={cn(TD, "text-right")}>
        <div className="tnum text-[12.5px] font-medium text-ink">${fmtUsd(c.usdCif).replace("$ ", "")}</div>
        <div
          className="mt-0.5 flex items-baseline justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <NumInput
            value={c.unitCifUsd}
            width="w-[72px]"
            label={`Unit price for line ${c.pos}`}
            onCommit={(n) => onEditLine(c.id, { unitCifUsd: n })}
          />
          <span className="shrink-0 font-mono text-[9px] text-ink-3">/unit</span>
        </div>
        <div className="tnum mt-0.5 font-mono text-[10px] text-ink-3">{fmtIdrShort(c.idrCif)}</div>
      </td>

      <td className={TD}>
        <div className="tnum font-mono text-[10.5px] text-ink-2">
          {c.unclassified ? (
            <span className="text-bad">no rate</span>
          ) : (
            <>
              {Math.round(c.bmRate * 100)}% BM
              {c.pref && (
                <span className="text-ok" title={`MFN would be ${Math.round(c.bmMfnRate * 100)}%`}>
                  {" "}
                  · {c.pref.form}
                </span>
              )}
              {c.bmadRate > 0 && <span className="text-bad"> +{Math.round(c.bmadRate * 100)}% AD</span>}
              <span className="text-ink-3"> · {Math.round(c.ppnRate * 100)}% PPN</span>
            </>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[10px]">
          {c.unclassified ? (
            <span className="text-bad">unpriced</span>
          ) : c.ftz.total === 0 ? (
            <span className="text-ok">suspended</span>
          ) : (
            <span className="text-warn">due {fmtIdrShort(c.ftz.total)}</span>
          )}
          {c.deferred > 0 && <span className="text-ink-3">held {fmtIdrShort(c.deferred)}</span>}
        </div>
      </td>

      <td className={TD} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap gap-1">
          {visible.map((b) => (
            <RegBadgeView key={b.label} badge={flagLabel(b)} />
          ))}
          {hidden > 0 && (
            <Tag title={c.badges.slice(2).map((b) => `${b.label}: ${b.detail}`).join("\n\n")} className="cursor-help">
              +{hidden}
            </Tag>
          )}
          {c.badges.length === 0 && <span className="font-mono text-[10px] text-ink-3">none</span>}
        </div>
        {c.isAsset && (
          <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-[10px] text-ink-2">
            <input
              type="checkbox"
              checked={Boolean(c.hasMasterlist)}
              onChange={() => onToggleMasterlist?.(c.id)}
              className="size-[11px] accent-[#17181a]"
            />
            masterlist
          </label>
        )}
      </td>
    </tr>
  );
}

/** Narrow-screen equivalent of a table row — the same data, stacked. */
function StackedRow({
  c,
  selected,
  active,
  onActive,
  onToggle,
  onOverride,
  onEditLine,
}: {
  c: LineCalc;
  selected: boolean;
  active: boolean;
  onActive: (id: string | null) => void;
  onToggle: (id: string) => void;
  onOverride: (id: string, hs: string) => void;
  onEditLine: (id: string, patch: Partial<Pick<InvoiceLine, "qty" | "unitCifUsd">>) => void;
}) {
  const options = useMemo(() => hsOptions(c.line), [c.line]);

  return (
    <div
      data-line={c.id}
      data-risk={c.risk}
      data-selected={selected ? "true" : "false"}
      onClick={() => onActive(active ? null : c.id)}
      className={cn(
        "cursor-pointer border-b border-l-2 border-b-line px-2.5 py-2.5",
        RISK_EDGE[c.risk],
        active ? "bg-brand-soft" : selected ? "bg-surface" : "bg-sunken/40",
      )}
    >
      <div className="flex items-start gap-2">
        <span onClick={(e) => e.stopPropagation()} className="mt-0.5">
          <Checkbox checked={selected} onChange={() => onToggle(c.id)} label={`File line ${c.pos}`} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex gap-1.5">
            <span className="tnum mt-px shrink-0 font-mono text-[10px] text-ink-3">
              {String(c.pos).padStart(2, "0")}
            </span>
            <span className={cn("text-[12px] leading-[1.4]", selected ? "text-ink" : "text-ink-2")}>{c.line.raw}</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 font-mono text-[9.5px] text-ink-3">
            <span>{c.line.supplierRef}</span>
            <span className="text-line-strong">/</span>
            <span>{c.line.origin}</span>
            <span className="text-line-strong">/</span>
            <span className="tnum inline-flex items-baseline gap-0.5" onClick={(e) => e.stopPropagation()}>
              <NumInput
                value={c.qty}
                width="w-[52px]"
                label={`Quantity for line ${c.pos}`}
                onCommit={(n) => onEditLine(c.id, { qty: n })}
              />
              <span>{c.uom}</span>
            </span>
            {c.figureMismatch && (
              <span
                className="inline-flex items-center gap-1 text-warn"
                title={`Qty × unit price gives ${fmtUsd(c.usdCif)} but the document prints ${fmtUsd(c.line.docAmountUsd ?? 0)}.`}
              >
                <TriangleAlert size={9} strokeWidth={2.5} /> check qty × price
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={c.hs}
              onChange={(e) => onOverride(c.id, e.target.value)}
              aria-label={`HS code for line ${c.pos}`}
              className={cn(
                "min-w-0 flex-1 cursor-pointer rounded-[4px] border bg-surface px-1.5 py-1 font-mono text-[11px] font-semibold",
                c.overridden ? "border-warn/50 bg-warn-soft text-warn" : "border-line-strong text-ink",
              )}
            >
              {options.map((o) => (
                <option key={o.hs} value={o.hs} disabled={!o.registered}>
                  {o.hs} {o.registered ? `${Math.round(o.confidence * 100)}%` : "· unregistered"}
                </option>
              ))}
            </select>
            <span className="tnum inline-flex shrink-0 items-baseline gap-1">
              <NumInput
                value={c.unitCifUsd}
                width="w-[64px]"
                label={`Unit price for line ${c.pos}`}
                onCommit={(n) => onEditLine(c.id, { unitCifUsd: n })}
              />
              <span className="font-mono text-[11.5px] font-medium text-ink">
                ${fmtUsd(c.usdCif).replace("$ ", "")}
              </span>
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[9.5px]">
            <span className="text-ink-2">
              {Math.round(c.bmRate * 100)}% BM · {Math.round(c.ppnRate * 100)}% PPN
            </span>
            {c.payable === 0 ? (
              <span className="text-ok">exempt</span>
            ) : (
              <span className="text-warn">due {fmtIdrShort(c.payable)}</span>
            )}
            <span className="text-ink-3">saves {fmtIdrShort(c.saved)}</span>
          </div>

          {c.badges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {c.badges.slice(0, 3).map((b) => (
                <RegBadgeView key={b.label} badge={b} />
              ))}
              {c.badges.length > 3 && <Tag>+{c.badges.length - 3}</Tag>}
            </div>
          )}
        </div>
      </div>
    </div>
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
  onEditLine,
  docCheck,
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
  onEditLine: (id: string, patch: Partial<Pick<InvoiceLine, "qty" | "unitCifUsd">>) => void;
  docCheck: { stated: number; computed: number } | null;
  onToggleMasterlist?: (id: string) => void;
}) {
  if (!ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
        <div className="font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">Engine idle</div>
        <p className="mt-2 max-w-[380px] text-[13px] leading-relaxed text-ink-2">
          Load an invoice on the left and run{" "}
          <span className="font-medium text-ink">Analyze &amp; map</span>. Each line item is matched against the{" "}
          {REGISTER_SIZE}-heading register, priced at the MFN rate that applies to its heading and at any preferential
          rate its origin qualifies for, then screened for lartas and SNI obligations. Duty treatment then follows the
          entry point you select.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {["BTKI 2022", "PP 10/2012", "PMK 47/PMK.04/2012", "CEISA 4.0"].map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>
    );
  }

  const allSelected = calcs.every((c) => selectedIds.has(c.id));
  const someSelected = calcs.some((c) => selectedIds.has(c.id));
  const mismatchCount = calcs.filter((c) => c.figureMismatch).length;

  return (
    <>
      {docCheck && (
        <div className="flex items-start gap-2 border-b border-warn/40 bg-warn-soft px-3 py-2 text-[11.5px] leading-relaxed text-ink">
          <TriangleAlert size={13} strokeWidth={2.2} className="mt-0.5 shrink-0 text-warn" />
          <p>
            <span className="font-medium">Figures may have been misread.</span> The recognised lines add up to{" "}
            <span className="tnum font-mono">{fmtUsd(docCheck.computed)}</span> but the document states{" "}
            <span className="tnum font-mono">{fmtUsd(docCheck.stated)}</span>. Check the amber{" "}
            <span className="font-mono text-[10px]">check qty × price</span> rows and correct the quantity or unit price
            directly in the table.
          </p>
          {mismatchCount > 0 && (
            <span className="tnum shrink-0 self-center font-mono text-[10px] text-warn">
              {mismatchCount} line{mismatchCount > 1 ? "s" : ""} flagged
            </span>
          )}
        </div>
      )}
      <div className="scroll-thin hidden h-full overflow-auto md:block" style={docCheck ? { height: "calc(100% - 41px)" } : undefined}>
        <table className="w-full min-w-[660px] table-fixed border-collapse">
          <colgroup>
            {COLS.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <Th className="pr-0">
                <span onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={() => onSelectAll(!allSelected)}
                    label="Select all lines"
                  />
                </span>
              </Th>
              <Th>Line item</Th>
              <Th>BTKI heading</Th>
              <Th className="text-right">CIF value</Th>
              <Th>Duty</Th>
              <Th>Flags</Th>
            </tr>
          </thead>
          <tbody>
            {calcs.map((c) => (
              <Row
                key={c.id}
                c={c}
                selected={selectedIds.has(c.id)}
                active={activeId === c.id}
                onActive={onActive}
                onToggle={onToggle}
                onOverride={onOverride}
                onEditLine={onEditLine}
                onToggleMasterlist={onToggleMasterlist}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="scroll-thin h-full overflow-y-auto md:hidden" style={docCheck ? { height: "calc(100% - 41px)" } : undefined}>
        {calcs.map((c) => (
          <StackedRow
            key={c.id}
            c={c}
            selected={selectedIds.has(c.id)}
            active={activeId === c.id}
            onActive={onActive}
            onToggle={onToggle}
            onOverride={onOverride}
            onEditLine={onEditLine}
          />
        ))}
      </div>
    </>
  );
}
