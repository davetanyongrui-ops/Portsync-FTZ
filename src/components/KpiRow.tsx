import type { ReactNode } from "react";
import { BadgeCheck, CircleDollarSign, Lock, ShieldCheck, TriangleAlert, Wallet } from "lucide-react";
import type { DeclarationTotals, DemoInvoice, LineCalc } from "../types";
import { fmtIdr, fmtIdrShort, fmtUsd, fmtUsd0 } from "../lib/format";
import { cn } from "../lib/cn";
import { Label } from "./ui";

function Card({
  label,
  icon,
  value,
  sub,
  tone = "neutral",
  footnote,
  className,
}: {
  label: string;
  icon: ReactNode;
  value: ReactNode;
  sub: ReactNode;
  tone?: "neutral" | "good" | "warn";
  footnote?: ReactNode;
  className?: string;
}) {
  const ring =
    tone === "good"
      ? "border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_24px_-12px_rgba(16,185,129,0.3)]"
      : tone === "warn"
        ? "border-amber-500/30 bg-amber-500/10"
        : "border-zinc-800 bg-zinc-900/60 shadow-xs";

  return (
    <div data-kpi={label} className={cn("flex flex-col rounded-xl border p-3", ring, className)}>
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <Label className="min-w-0 truncate text-zinc-300">{label}</Label>
      </div>
      <div
        data-kpi-value
        className={cn(
          "tnum mt-2 text-xl leading-none font-semibold tracking-tight",
          tone === "good" ? "text-emerald-400" : tone === "warn" ? "text-amber-400" : "text-zinc-100",
        )}
      >
        {value}
      </div>
      <div className="mt-2 text-[12px] leading-[1.5] text-zinc-300">{sub}</div>
      {footnote && <div className="mt-2 border-t border-zinc-800/80 pt-2 text-[11.5px] text-zinc-400">{footnote}</div>}
    </div>
  );
}

const DASH = "—";

export function KpiRow({
  invoice,
  totals,
  calcs,
  ready,
}: {
  invoice: DemoInvoice;
  totals: DeclarationTotals;
  calcs: LineCalc[];
  ready: boolean;
}) {
  const pre = calcs.filter((c) => c.lartas === "PRE_BORDER").length;
  const post = calcs.filter((c) => c.lartas === "POST_BORDER").length;
  const sni = calcs.filter((c) => c.entry.sni).length;
  const filed = ready && totals.selected > 0;
  const exemptedPct = totals.standard.total > 0 ? (totals.saved / totals.standard.total) * 100 : 0;
  const releasedShare = totals.standard.total > 0 ? (totals.payable / totals.standard.total) * 100 : 0;

  return (
    <div className="shrink-0 space-y-2.5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card
          label="Total CIF Value"
          icon={<CircleDollarSign size={14} className="text-cyan-400" />}
          value={ready ? fmtUsd(totals.usdCif) : DASH}
          sub={
            ready ? (
              <span className="tnum">
                <span className="text-zinc-200">{fmtIdr(totals.idrCif)}</span>
                <span className="text-zinc-400"> @ Rp 16,200/USD</span>
              </span>
            ) : (
              `${invoice.lines.length} lines · currency ${invoice.currency}`
            )
          }
          footnote={
            ready ? (
              <span className="tnum">
                filing set {fmtIdrShort(totals.selIdrCif)} · {totals.selected}/{totals.lines} lines · freight USD{" "}
                {fmtUsd0(invoice.freight.freightUsd).replace("$ ", "")} allocated
              </span>
            ) : (
              "CIF-inclusive, pro-rata allocated"
            )
          }
        />

        <Card
          tone="good"
          label="FTZ Exemption Savings"
          icon={<ShieldCheck size={14} className="text-emerald-400" />}
          value={filed ? `−${fmtIdrShort(totals.saved)}` : DASH}
          sub={
            filed ? (
              <span className="tnum">
                {exemptedPct.toFixed(0)}% of standard duty avoided under <b className="font-semibold text-emerald-300">PPFTZ-01</b>
              </span>
            ) : (
              "Cash retained inside the enclave"
            )
          }
          footnote={filed ? <span className="tnum">{fmtIdr(totals.saved)} saved</span> : undefined}
        />

        <Card
          tone={filed && totals.payable === 0 ? "good" : filed ? "warn" : "neutral"}
          label="Final Duty Payable"
          icon={filed && totals.payable === 0 ? <BadgeCheck size={14} className="text-emerald-400" /> : <Lock size={14} className="text-amber-400" />}
          value={filed ? (totals.payable === 0 ? "Rp 0" : fmtIdrShort(totals.payable)) : DASH}
          sub={
            filed ? (
              totals.payable === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <BadgeCheck size={12} strokeWidth={2.4} /> 100% exempt — no duty or VAT due
                </span>
              ) : (
                <span className="tnum text-amber-300">
                  {releasedShare.toFixed(1)}% of total shipment duty due to partial TLDDP release (25% quota)
                </span>
              )
            ) : (
              "Nilai bayar after the facility"
            )
          }
          footnote={
            filed ? (
              <span className="tnum">
                {fmtIdr(totals.payable)} · PPh 22 fiscal {fmtIdr(totals.pph22)}
              </span>
            ) : undefined
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card
          label="Standard Mainland Duty"
          icon={<Wallet size={14} className="text-zinc-400" />}
          value={
            filed ? (
              <span className="text-zinc-500 line-through decoration-zinc-600">{fmtIdrShort(totals.standard.total)}</span>
            ) : (
              DASH
            )
          }
          sub={
            filed ? (
              <span className="tnum text-zinc-300">
                BM {fmtIdrShort(totals.standard.bm)} · PPN {fmtIdrShort(totals.standard.ppn)}
                {totals.standard.bmad > 0 ? <> · BMAD {fmtIdrShort(totals.standard.bmad)}</> : null}
              </span>
            ) : (
              "Bea Masuk + PPN at MFN, cleared to Jakarta"
            )
          }
          footnote={filed ? <span className="tnum">{fmtIdr(totals.standard.total)} without the enclave</span> : undefined}
        />

        <Card
          tone={filed && pre > 0 ? "warn" : "neutral"}
          label="Lartas / Regulatory Alerts"
          icon={<TriangleAlert size={14} className={filed && pre > 0 ? "text-rose-400" : "text-zinc-400"} />}
          value={
            <span className="flex items-center gap-2.5">
              <span className={pre > 0 ? "text-rose-400" : "text-zinc-200"}>{ready ? pre : DASH}</span>
              {ready && totals.highRisk > 0 && (
                <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700">
                  {totals.highRisk} Total Alerts
                </span>
              )}
            </span>
          }
          sub={
            ready ? (
              <span className="tnum text-zinc-300">
                {pre} pre-border · {post} post-border · {sni} SNI
              </span>
            ) : (
              "Import permit required"
            )
          }
          footnote={
            ready && pre > 0 ? (
              <span className="tnum text-rose-400">
                {pre} line(s) block submission until permits/SNI are uploaded
              </span>
            ) : ready && totals.highRisk > 0 ? (
              "all restrictions are post-border — file, then report"
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
