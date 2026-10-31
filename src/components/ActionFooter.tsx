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
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-slate-800 shadow-xs backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100 dark:shadow-lg sm:px-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="leading-tight">
          <div className="text-[10.5px] font-medium tracking-wider text-slate-500 uppercase dark:text-zinc-400">Lines filed</div>
          <div className="tnum mt-1 text-[13px] font-semibold text-slate-900 dark:text-zinc-100">
            {ready ? `${totals.selected}/${totals.lines}` : "—"}
          </div>
        </div>
        <div className="leading-tight">
          <div className="text-[10.5px] font-medium tracking-wider text-slate-500 uppercase dark:text-zinc-400">Payable</div>
          <div
            className={
              filed
                ? totals.payable === 0
                  ? "tnum mt-1 text-[13px] font-semibold text-emerald-700 dark:text-emerald-400"
                  : "tnum mt-1 text-[13px] font-semibold text-amber-700 dark:text-amber-400"
                : "tnum mt-1 text-[13px] font-semibold text-slate-900 dark:text-zinc-100"
            }
          >
            {filed ? fmtIdr(totals.payable) : "—"}
          </div>
        </div>
        <div className="leading-tight">
          <div className="text-[10.5px] font-medium tracking-wider text-slate-500 uppercase dark:text-zinc-400">FTZ saving</div>
          <div className="tnum mt-1 text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">
            {filed ? fmtIdrShort(totals.saved) : "—"}
          </div>
        </div>
        <div className="hidden sm:block leading-tight">
          <div className="text-[10.5px] font-medium tracking-wider text-slate-500 uppercase dark:text-zinc-400">Avg match</div>
          <div className="tnum mt-1 text-[13px] font-semibold text-blue-600 dark:text-cyan-300">
            {filed ? `${Math.round(totals.avgConfidence * 100)}%` : "—"}
          </div>
        </div>
        {filed && totals.blocked > 0 && (
          <Pill tone="bad" title="Pre-border Lartas lines must carry a permit number before the PIB can be submitted.">
            {totals.blocked} blocked
          </Pill>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
        <Btn icon={FileCode} onClick={onDownloadXml} disabled={!filed} title="CEISA-flavoured interchange document" className="w-full sm:w-auto">
          Download CEISA-Ready XML
        </Btn>
        <Btn variant="primary" icon={Braces} onClick={onOpenPayload} disabled={!filed} className="w-full sm:w-auto">
          Generate PPFTZ-01 Declaration Payload
        </Btn>
      </div>
    </div>
  );
}
