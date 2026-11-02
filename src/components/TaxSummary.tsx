import type { LineCalc, DeclarationTotals } from "../types";
import { fmtIdrShort, fmtUsd } from "../lib/format";
import { TriangleAlert } from "lucide-react";

/**
 * The plain-language result, read in one glance:
 *   pays tax · reduced · not taxed — how and why — then the three totals.
 *
 * Buckets are decided by what the line actually costs in this filing:
 *   nothing owed now or later → not taxed
 *   owes less than MFN now, or duty is only held → reduced
 *   owes (roughly) full MFN   → taxable
 */
export function TaxSummary({
  calcs,
  selectedIds,
  totals,
  ready,
  destination,
  docCheck,
}: {
  calcs: LineCalc[];
  selectedIds: Set<string>;
  totals: DeclarationTotals;
  ready: boolean;
  destination: string;
  docCheck: { stated: number; computed: number } | null;
}) {
  if (!ready) {
    return (
      <div className="rounded-[7px] border border-dashed border-line-strong px-4 py-10 text-center">
        <div className="font-mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">No result yet</div>
        <p className="mx-auto mt-2 max-w-[360px] text-[12px] leading-relaxed text-ink-2">
          Load an invoice and run <span className="font-medium text-ink">Analyze &amp; map</span> — the taxable,
          reduced and non-taxed breakdown appears here.
        </p>
      </div>
    );
  }

  const sel = calcs.filter((c) => selectedIds.has(c.id));
  const decided = sel.filter((c) => !c.unclassified);

  const exempt = decided.filter((c) => c.ftz.total <= 1 && c.deferred <= 1);
  const reducible = decided.filter(
    (c) => (c.ftz.total > 1 && c.standard.total - c.ftz.total > 1) || c.deferred > 1,
  );
  const taxable = decided.filter(
    (c) => c.ftz.total > 1 && c.standard.total - c.ftz.total <= 1 && c.deferred <= 1,
  );
  const needsCode = sel.filter((c) => c.unclassified);
  const mismatched = calcs.filter((c) => c.figureMismatch);

  const nowSum = (list: LineCalc[]) => list.reduce((n, c) => n + c.ftz.total, 0);
  const reduction = totals.standard.total - totals.ftz.total;
  const held = reducible.reduce((n, c) => n + c.deferred, 0);

  const how = (c: LineCalc): string => {
    const parts: string[] = [];
    if (c.pref && c.bmRate < c.bmMfnRate) parts.push(`${c.pref.form}: duty ${pct(c.bmMfnRate)} → ${pct(c.bmRate)}`);
    else if (c.standard.total - c.ftz.total > 1) parts.push("facility: duty suspended");
    if (c.deferred > 1) parts.push(`${fmtIdrShort(c.deferred)} held — owed only if the goods leave the zone`);
    if (c.ftz.total > 1) parts.push(`${fmtIdrShort(c.ftz.total)} payable at entry`);
    return parts.join(" · ") || "relief applied";
  };

  const whyFree = (c: LineCalc): string => {
    if (c.pref && c.bmRate === 0 && (c.saved > 0 || c.deferred > 0))
      return `${c.pref.form} — 0% duty under the trade agreement, and PPN not collected in the free zone`;
    if (c.pref && c.bmRate === 0) return `${c.pref.form} — 0% duty under the trade agreement`;
    if (c.saved > 0 || c.deferred > 0) return "free-zone facility — duty suspended, PPN not collected";
    return "0% duty heading — nothing to collect";
  };

  // ---- how and why, per mechanism ------------------------------------
  const prefSums = new Map<string, { scheme: string; saved: number; lines: number }>();
  for (const c of sel) {
    // Count a form whenever it genuinely changes the rate — its benefit may be
    // forgiven outright now, or it may only shrink what falls due on release.
    if (!c.pref || !(c.bmRate < c.bmMfnRate)) continue;
    const e = prefSums.get(c.pref.form) ?? { scheme: c.pref.scheme, saved: 0, lines: 0 };
    e.saved += c.pref.saved;
    e.lines += 1;
    prefSums.set(c.pref.form, e);
  }

  return (
    <section aria-label="Tax summary" className="space-y-3 pb-6">
      {/* ------------------------------------- OCR figure sanity banner */}
      {docCheck && (
        <div className="flex items-start gap-2 rounded-[7px] border border-warn/40 bg-warn-soft px-3 py-2.5">
          <TriangleAlert size={14} strokeWidth={2.2} className="mt-0.5 shrink-0 text-warn" />
          <p className="text-[11.5px] leading-relaxed text-ink">
            <span className="font-medium">These figures may contain OCR errors.</span> The recognised lines add up to{" "}
            <span className="tnum font-mono">{fmtUsd(docCheck.computed)}</span>, but the document itself states{" "}
            <span className="tnum font-mono">{fmtUsd(docCheck.stated)}</span>. Open the{" "}
            <span className="font-medium">Lines</span> tab, find the amber{" "}
            <span className="font-mono text-[10px]">check qty × price</span> rows and type the correct number directly
            into the table — every total here updates the moment you do.
          </p>
        </div>
      )}
      {mismatched.length > 0 && !docCheck && (
        <div className="flex items-start gap-2 rounded-[7px] border border-warn/40 bg-warn-soft px-3 py-2.5">
          <TriangleAlert size={14} strokeWidth={2.2} className="mt-0.5 shrink-0 text-warn" />
          <p className="text-[11.5px] leading-relaxed text-ink">
            <span className="font-medium">
              {mismatched.length} line{mismatched.length > 1 ? "s" : ""} may have been misread.
            </span>{" "}
            The quantity times the unit price does not match the amount printed on the row. Open the{" "}
            <span className="font-medium">Lines</span> tab and correct the amber rows — type the number straight into
            the table.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------ groups */}
      <div className="divide-y divide-line overflow-hidden rounded-[7px] border border-line bg-surface">
        <Group
          tone="bad"
          dot="bg-bad"
          label="Pays tax here"
          count={taxable.length}
          amount={nowSum(taxable)}
          items={taxable.map((c) => ({ name: c.line.raw, amount: c.ftz.total, note: how(c) }))}
        />
        <Group
          tone="warn"
          dot="bg-warn"
          label="Reduced — relief applies"
          count={reducible.length}
          amount={nowSum(reducible)}
          held={held}
          items={reducible.map((c) => ({ name: c.line.raw, amount: c.ftz.total, note: how(c) }))}
        />
        <Group
          tone="ok"
          dot="bg-ok"
          label="Not taxed here"
          count={exempt.length}
          amount={0}
          items={exempt.map((c) => ({ name: c.line.raw, amount: 0, note: whyFree(c) }))}
        />
        {needsCode.length > 0 && (
          <div className="px-3 py-2">
            <div className="flex items-baseline gap-2">
              <span className="size-[7px] shrink-0 rounded-full bg-ink-3" />
              <span className="text-[12px] font-medium text-ink-2">Needs an HS code</span>
              <span className="font-mono text-[10px] text-ink-3">
                {needsCode.length} line{needsCode.length > 1 ? "s" : ""} — excluded until classified
              </span>
            </div>
            <ul className="mt-1 ml-[15px] space-y-0.5">
              {needsCode.map((c) => (
                <li key={c.id} className="truncate text-[11px] text-ink-3" title={c.line.raw}>
                  {c.line.raw}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* -------------------------------------------------- totals */}
        <div className="space-y-1 bg-sunken/60 px-3 py-2.5">
          <div className="flex items-baseline justify-between font-mono text-[11px] text-ink-2">
            <span>Tax with no relief (MFN)</span>
            <span className="tnum">{fmtIdrShort(totals.standard.total)}</span>
          </div>
          <div className="flex items-baseline justify-between font-mono text-[11px] text-ok">
            <span>Legal reduction</span>
            <span className="tnum">−{fmtIdrShort(reduction)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-1.5 font-mono text-[13px] font-semibold text-ink">
            <span>Total to pay</span>
            <span className="tnum">{fmtIdrShort(totals.payable)}</span>
          </div>
          <p className="pt-0.5 text-[10px] leading-relaxed text-ink-3">
            Includes PPh 22 {fmtIdrShort(totals.pph22)}. "Not taxed here" means nothing is collected at this entry
            point — suspended duty can still fall due if the goods leave the zone. Rates are the BTKI 2022 schedule
            (World Bank WITS snapshot); confirm the current tariff book before filing.
          </p>
        </div>
      </div>

      {/* --------------------------------------------- how and why */}
      {(reduction > 1 || held > 1) && (
        <div className="rounded-[7px] border border-line bg-surface px-3 py-3">
          <div className="text-[12px] font-medium text-ink">How and why the reduction is legal</div>
          <ul className="mt-2 space-y-2">
            {(totals.saved > 0 || totals.deferred > 0) && (
              <li className="flex gap-2">
                <span className="mt-[5px] size-[5px] shrink-0 rounded-full bg-warn" />
                <p className="text-[11.5px] leading-[1.6] text-ink-2">
                  <span className="font-medium text-ink">Free-zone facility ({destination}).</span> Bea Masuk is
                  suspended and PPN is not collected, because the goods are entered into the Batam free-trade zone and
                  stay under its regime.{" "}
                  {totals.deferred > 1 && (
                    <>
                      <span className="font-medium text-ink">{fmtIdrShort(totals.deferred)} is held, not forgiven</span>{" "}
                      — it falls due only if the goods are released to the Indonesian mainland.
                    </>
                  )}
                </p>
              </li>
            )}
            {[...prefSums.entries()].map(([form, e]) => (
              <li key={form} className="flex gap-2">
                <span className="mt-[5px] size-[5px] shrink-0 rounded-full bg-brand" />
                <p className="text-[11.5px] leading-[1.6] text-ink-2">
                  <span className="font-medium text-ink">
                    {form} ({e.scheme}).
                  </span>{" "}
                  Cuts the MFN duty on {e.lines} line{e.lines > 1 ? "s" : ""} because{" "}
                  {SCHEME_WHY[e.scheme] ?? "a trade agreement in force covers this origin"}.{" "}
                  {e.saved > 1 ? (
                    <>
                      <span className="font-medium text-ok">{fmtIdrShort(e.saved)} is forgiven outright</span> — not
                      deferred — provided the certificate accompanies the declaration.
                    </>
                  ) : (
                    <>
                      Here the facility already suspends the duty, so the preference matters on release: it fixes the
                      rate that would fall due if the goods ever leave the zone.
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const SCHEME_WHY: Record<string, string> = {
  ACFTA: "the ASEAN–China trade agreement covers this origin",
  IJEPA: "the Indonesia–Japan economic partnership covers this origin",
  ATIGA: "the ASEAN trade-in-goods agreement covers this origin",
  AIFTA: "the ASEAN–India trade agreement covers this origin",
};

/* ------------------------------------------------------------------ */

function Group({
  tone,
  dot,
  label,
  count,
  amount,
  held = 0,
  items,
}: {
  tone: "bad" | "warn" | "ok";
  dot: string;
  label: string;
  count: number;
  amount: number;
  held?: number;
  items: { name: string; amount: number; note?: string }[];
}) {
  const text = { bad: "text-bad", warn: "text-warn", ok: "text-ok" }[tone];
  if (count === 0) return null;

  return (
    <div className="px-3 py-2">
      <div className="flex items-baseline gap-2">
        <span className={`size-[7px] shrink-0 rounded-full ${dot}`} />
        <span className="text-[12px] font-medium text-ink">{label}</span>
        <span className="font-mono text-[10px] text-ink-3">
          {count} item{count > 1 ? "s" : ""}
        </span>
        <span className={`tnum ml-auto font-mono text-[12px] font-semibold ${text}`}>
          {amount > 1 ? fmtIdrShort(amount) : "Rp 0"}
          {held > 1 && (
            <span className="ml-1.5 font-mono text-[10px] font-normal text-ink-3">+ {fmtIdrShort(held)} held</span>
          )}
        </span>
      </div>
      <ul className="mt-1 ml-[15px] space-y-1.5">
        {items.map((it, i) => (
          <li key={i}>
            <div className="flex items-baseline gap-2">
              <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2" title={it.name}>
                {it.name}
              </span>
              <span className="tnum shrink-0 font-mono text-[10.5px] text-ink-2">
                {it.amount > 1 ? fmtIdrShort(it.amount) : "—"}
              </span>
            </div>
            {it.note && <div className="mt-px font-mono text-[9.5px] leading-relaxed text-ink-3">{it.note}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
