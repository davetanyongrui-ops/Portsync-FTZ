import { Braces, FileCode } from "lucide-react";
import type { DeclarationTotals } from "../types";
import { fmtIdr, fmtIdrShort } from "../lib/format";
import { Btn, Pill } from "./ui";

export function ActionFooter({
  totals,
  ready,
  onDownloadXml,
  onOpenPayload,
}: {
  totals: DeclarationTotals;
  ready: boolean;
  onDownloadXml: () => void;
  onOpenPayload: () => void;
}) {
  const filed = ready && totals.selected > 0;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
      <div className="leading-tight">
        <div className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">Lines filed</div>
        <div className="tnum mt-1 text-[13px] font-semibold text-slate-900">
          {ready ? `${totals.selected}/${totals.lines}` : "—"}
        </div>
      </div>
      <div className="leading-tight">
        <div className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">Payable</div>
        <div
          className={
            filed
              ? totals.payable === 0
                ? "tnum mt-1 text-[13px] font-semibold text-emerald-700"
                : "tnum mt-1 text-[13px] font-semibold text-amber-700"
              : "tnum mt-1 text-[13px] font-semibold text-slate-900"
          }
        >
          {filed ? fmtIdr(totals.payable) : "—"}
        </div>
      </div>
      <div className="leading-tight">
        <div className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">FTZ saving</div>
        <div className="tnum mt-1 text-[13px] font-semibold text-emerald-700">
          {filed ? fmtIdrShort(totals.saved) : "—"}
        </div>
      </div>
      <div className="hidden sm:block leading-tight">
        <div className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">Avg match</div>
        <div className="tnum mt-1 text-[13px] font-semibold text-slate-900">
          {filed ? `${Math.round(totals.avgConfidence * 100)}%` : "—"}
        </div>
      </div>
      {filed && totals.blocked > 0 && (
        <Pill tone="bad" title="Pre-border Lartas lines must carry a permit number before the PIB can be submitted.">
          {totals.blocked} blocked
        </Pill>
      )}

      <div className="ml-auto flex items-center gap-3">
        <Btn icon={FileCode} onClick={onDownloadXml} disabled={!filed} title="CEISA-flavoured interchange document">
          Download CEISA-Ready XML
        </Btn>
        <Btn variant="primary" icon={Braces} onClick={onOpenPayload} disabled={!filed}>
          Generate PPFTZ-01 Declaration Payload
        </Btn>
      </div>
    </div>
  );
}