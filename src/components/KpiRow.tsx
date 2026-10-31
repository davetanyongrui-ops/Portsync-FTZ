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
      ? "border-emerald-200 bg-emerald-50/60 shadow-[0_0_28px_-16px_rgba(16,185,129,0.25)]"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50/60"
        : "border-slate-200 bg-white shadow-xs";

  return (
    <div data-kpi={label} className={cn("flex flex-col rounded-xl border p-2.5", ring, className)}>
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <Label className="min-w-0 truncate">{label}</Label>
      </div>
      <div
        data-kpi-value
        className={cn(
          "tnum mt-2 text-xl leading-none font-semibold tracking-tight",
          tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-slate-900",
        )}
      >
        {value}
      </div>
      <div className="mt-2 text-[12px] leading-[1.5] text-slate-600">{sub}</div>
      {footnote && <div className="mt-2 border-t border-slate-200/70 pt-2 text-[11.5px] text-slate-500">{footnote}</div>}
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
    <div className="shrink-0 space-y-2">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card
          label="Total CIF Value"
          icon={<CircleDollarSign size={14} />}
          value={ready ? fmtUsd(totals.usdCif) : DASH}
          sub={
            ready ? (
              <span className="tnum">
                <span className="text-slate-800">{fmtIdr(totals.idrCif)}</span>
                <span className="text-slate-500"> @ Rp 16,200/USD</span>
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
          icon={<ShieldCheck size={14} />}
          value={filed ? `−${fmtIdrShort(totals.saved)}` : DASH}
          sub={
            filed ? (
              <span className="tnum">
                {exemptedPct.toFixed(0)}% of standard duty avoided under <b className="font-semibold text-emerald-700">PPFTZ-01</b>
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
          icon={filed && totals.payable === 0 ? <BadgeCheck size={14} /> : <Lock size={14} />}
          value={filed ? (totals.payable === 0 ? "Rp 0" : fmtIdrShort(totals.payable)) : DASH}
          sub={
            filed ? (
              totals.payable === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <BadgeCheck size={12} strokeWidth={2.4} /> 100% exempt — no duty or VAT due
                </span>
              ) : (
                <span className="tnum">
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
          icon={<Wallet size={14} />}
          value={
            filed ? (
              <span className="text-slate-400 line-through decoration-slate-300">{fmtIdrShort(totals.standard.total)}</span>
            ) : (
              DASH
            )
          }
          sub={
            filed ? (
              <span className="tnum">
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
          icon={<TriangleAlert size={14} />}
          value={
            <span className="flex items-center gap-2.5">
              <span className="text-rose-600">{ready ? pre : DASH}</span>
              {ready && totals.highRisk > 0 && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  {totals.highRisk} Total Alerts
                </span>
              )}
            </span>
          }
          sub={
            ready ? (
              <span className="tnum">
                {pre} pre-border · {post} post-border · {sni} SNI
              </span>
            ) : (
              "Import permit required"
            )
          }
          footnote={
            ready && pre > 0 ? (
              <span className="tnum text-rose-600">
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