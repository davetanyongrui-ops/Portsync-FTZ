import { ArrowDownRight, ShieldCheck } from "lucide-react";
import type { DeclarationTotals, DemoInvoice, LineCalc } from "../types";
import { fmtIdr, fmtIdrShort, fmtUsd } from "../lib/format";
import type { Destination } from "../data/destinations";
import { cn } from "../lib/cn";

function Cell({
  label,
  value,
  sub,
  tone = "neutral",
  title,
  last,
  wideOnly,
}: {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "bad";
  title?: string;
  last?: boolean;
  wideOnly?: boolean;
}) {
  return (
    <div
      data-kpi={label}
      title={title}
      className={cn(
        "min-w-0 px-3 py-2",
        !last && "border-r border-line",
        wideOnly && "hidden @[660px]:block",
      )}
    >
      <div className="truncate text-[10px] font-semibold tracking-[0.07em] text-ink-3 uppercase">{label}</div>
      <div
        data-kpi-value
        className={cn(
          "tnum mt-1 truncate text-[17px] leading-none font-semibold tracking-[-0.015em]",
          tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-1 line-clamp-2 text-[10.5px] leading-[1.35] text-ink-3">{sub}</div>
    </div>
  );
}

const DASH = "—";

export function SummaryStrip({
  invoice,
  totals,
  calcs,
  ready,
  destination,
}: {
  invoice: DemoInvoice | null;
  totals: DeclarationTotals;
  calcs: LineCalc[];
  ready: boolean;
  destination: Destination;
}) {
  const filed = ready && totals.selected > 0;
  const pre = calcs.filter((c) => c.lartas === "PRE_BORDER").length;
  const post = calcs.filter((c) => c.lartas === "POST_BORDER").length;
  const snp = calcs.filter((c) => c.entry.sni).length;
  const dutyOnly = totals.payable - totals.pph22;
  const suspended = destination.treatment === "suspended";

  return (
    <div className="grid shrink-0 grid-cols-2 border-b border-line @[420px]:grid-cols-4 @[660px]:grid-cols-5">
      <Cell
        label="Customs value"
        value={ready ? fmtUsd(totals.usdCif) : DASH}
        sub={
          ready
            ? `${fmtIdr(totals.idrCif)} CIF`
            : invoice
              ? `${invoice.lines.length} lines · ${invoice.currency}`
              : "no document loaded"
        }
        title={ready ? `CIF value of the whole document. Filing set ${fmtIdr(totals.selIdrCif)}` : undefined}
      />
      <Cell
        wideOnly
        label="Duty & tax"
        value={ready ? fmtIdrShort(totals.standard.total) : DASH}
        sub={
          ready ? (
            <span className="tnum">
              BM {fmtIdrShort(totals.standard.bm)} · PPN {fmtIdrShort(totals.standard.ppn)}
            </span>
          ) : (
            "before any facility"
          )
        }
        title={
          ready
            ? `${fmtIdr(totals.standard.total)} of Bea Masuk, BMAD and PPN at the rate for this origin`
            : undefined
        }
      />
      {suspended ? (
        <Cell
          label="Deferred in-zone"
          tone="ok"
          value={filed ? `−${fmtIdrShort(totals.deferred)}` : DASH}
          sub={filed ? `${destination.port} · PPFTZ-01` : "held by the facility"}
          title={filed ? `${fmtIdr(totals.deferred)} not collected while the goods stay in the KPBPB` : undefined}
        />
      ) : (
        <Cell
          label="FTA relief"
          tone={totals.prefSaved > 0 ? "ok" : "neutral"}
          value={filed ? (totals.prefSaved > 0 ? `−${fmtIdrShort(totals.prefSaved)}` : "Rp 0") : DASH}
          sub={filed ? (totals.prefSaved > 0 ? "preference applied" : "MFN only · no Form") : "scheme rate"}
          title={filed ? `${fmtIdr(totals.prefSaved)} of Bea Masuk avoided by the preferential rate` : undefined}
        />
      )}
      <Cell
        label="Payable"
        tone={filed ? (dutyOnly === 0 ? "ok" : "warn") : "neutral"}
        value={filed ? (dutyOnly === 0 ? "Rp 0" : fmtIdrShort(dutyOnly)) : DASH}
        sub={
          filed ? (
            dutyOnly === 0 ? (
              <span className="inline-flex items-center gap-1 text-ok">
                <ShieldCheck size={10} strokeWidth={2.4} /> nothing collected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-warn">
                <ArrowDownRight size={10} strokeWidth={2.4} /> at {destination.port}
              </span>
            )
          ) : (
            "at this destination"
          )
        }
        title={filed ? `${fmtIdr(dutyOnly)} · PPh 22 fiscal ${fmtIdr(totals.pph22)}` : undefined}
      />
      <Cell
        label="Restrictions"
        tone={filed && pre > 0 ? "bad" : "neutral"}
        last
        value={ready ? pre : DASH}
        sub={
          ready
            ? totals.unclassified > 0
              ? `${totals.unclassified} unclassified · ${pre} pre-border`
              : `${pre} pre-border · ${post} post-border · ${snp} SNI`
            : "lartas · SNI"
        }
        title={
          pre > 0
            ? `${pre} line(s) block PIB submission until the permit number is attached`
            : "No pre-border restriction blocks submission"
        }
      />
    </div>
  );
}
