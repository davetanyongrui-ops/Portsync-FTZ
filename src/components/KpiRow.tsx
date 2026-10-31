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
      ? "border-emerald-200/90 bg-emerald-50/70 shadow-xs dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:shadow-[0_0_24px_-12px_rgba(16,185,129,0.3)]"
      : tone === "warn"
        ? "border-amber-200/90 bg-amber-50/70 shadow-xs dark:border-amber-500/30 dark:bg-amber-500/10"
        : "border-slate-200/90 bg-white shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/60";

  return (
    <div
      data-kpi={label}
      className={cn(
        "flex flex-col justify-between rounded-xl border p-3.5 sm:p-4 transition-all duration-150 hover:border-slate-300 dark:hover:border-zinc-700",
        ring,
        className,
      )}
    >
      <div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
          {icon}
          <Label className="min-w-0 truncate text-slate-700 dark:text-zinc-300 font-semibold">{label}</Label>
        </div>
        <div
          data-kpi-value
          className={cn(
            "tnum mt-2 text-xl font-bold tracking-tight leading-none",
            tone === "good"
              ? "text-emerald-700 dark:text-emerald-400"
              : tone === "warn"
                ? "text-amber-700 dark:text-amber-400"
                : "text-slate-900 dark:text-zinc-100",
          )}
        >
          {value}
        </div>
        <div className="mt-1.5 text-[12px] leading-relaxed text-slate-600 dark:text-zinc-300">{sub}</div>
      </div>
      {footnote && (
        <div className="mt-2.5 border-t border-slate-200/70 pt-2 text-[11.5px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
          {footnote}
        </div>
      )}
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
          icon={<CircleDollarSign size={15} className="text-blue-600 dark:text-cyan-400" />}
          value={ready ? fmtUsd(totals.usdCif) : DASH}
          sub={
            ready ? (
              <span className="tnum">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{fmtIdr(totals.idrCif)}</span>
                <span className="text-slate-500 dark:text-zinc-400"> @ Rp 16,200/USD</span>
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
          icon={<ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />}
          value={filed ? `−${fmtIdrShort(totals.saved)}` : DASH}
          sub={
            filed ? (
              <span className="tnum">
                {exemptedPct.toFixed(0)}% of standard duty avoided under <b className="font-semibold text-emerald-800 dark:text-emerald-300">PPFTZ-01</b>
              </span>
            ) : (
              "Cash retained inside the Batam enclave"
            )
          }
          footnote={filed ? <span className="tnum">{fmtIdr(totals.saved)} statutory savings</span> : undefined}
        />

        <Card
          tone={filed && totals.payable === 0 ? "good" : filed ? "warn" : "neutral"}
          label="Final Duty Payable"
          icon={
            filed && totals.payable === 0 ? (
              <BadgeCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Lock size={15} className="text-amber-600 dark:text-amber-400" />
            )
          }
          value={filed ? (totals.payable === 0 ? "Rp 0" : fmtIdrShort(totals.payable)) : DASH}
          sub={
            filed ? (
              totals.payable === 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                  <BadgeCheck size={13} strokeWidth={2.4} /> 100% exempt — no import duty or VAT due
                </span>
              ) : (
                <span className="tnum font-medium text-amber-800 dark:text-amber-300">
                  {releasedShare.toFixed(1)}% of total duty due to TLDDP quota release (25%)
                </span>
              )
            ) : (
              "Nilai pabean payable after facility"
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

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Card
          label="Standard Mainland Duty"
          icon={<Wallet size={15} className="text-slate-500 dark:text-zinc-400" />}
          value={
            filed ? (
              <span className="text-slate-400 line-through decoration-slate-400 dark:text-zinc-500 dark:decoration-zinc-600">
                {fmtIdrShort(totals.standard.total)}
              </span>
            ) : (
              DASH
            )
          }
          sub={
            filed ? (
              <span className="tnum text-slate-700 dark:text-zinc-300">
                BM {fmtIdrShort(totals.standard.bm)} · PPN {fmtIdrShort(totals.standard.ppn)}
                {totals.standard.bmad > 0 ? <> · BMAD {fmtIdrShort(totals.standard.bmad)}</> : null}
              </span>
            ) : (
              "Bea Masuk + PPN at MFN rate, if cleared to Jakarta"
            )
          }
          footnote={filed ? <span className="tnum">{fmtIdr(totals.standard.total)} without Batam KPBPB facility</span> : undefined}
        />

        <Card
          tone={filed && pre > 0 ? "warn" : "neutral"}
          label="Lartas / Regulatory Alerts"
          icon={<TriangleAlert size={15} className={filed && pre > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-zinc-400"} />}
          value={
            <span className="flex items-center gap-2.5">
              <span className={pre > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-zinc-200"}>
                {ready ? pre : DASH}
              </span>
              {ready && totals.highRisk > 0 && (
                <span className="text-[11.5px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                  {totals.highRisk} Total Alerts
                </span>
              )}
            </span>
          }
          sub={
            ready ? (
              <span className="tnum text-slate-700 dark:text-zinc-300 font-medium">
                {pre} pre-border · {post} post-border · {sni} SNI mandatory
              </span>
            ) : (
              "Statutory import permits required"
            )
          }
          footnote={
            ready && pre > 0 ? (
              <span className="tnum font-semibold text-rose-600 dark:text-rose-400">
                {pre} line(s) block PIB submission until permits/SNI are attached
              </span>
            ) : ready && totals.highRisk > 0 ? (
              "All restrictions are post-border — file declaration, then report"
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
