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
    <div className="flex shrink-0 flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-zinc-800 bg-zinc-900/90 px-5 py-3 backdrop-blur shadow-lg">
      <div className="leading-tight">
        <div className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">Lines filed</div>
        <div className="tnum mt-1 text-[13px] font-semibold text-zinc-100">
          {ready ? `${totals.selected}/${totals.lines}` : "—"}
        </div>
      </div>
      <div className="leading-tight">
        <div className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">Payable</div>
        <div
          className={
            filed
              ? totals.payable === 0
                ? "tnum mt-1 text-[13px] font-semibold text-emerald-400"
                : "tnum mt-1 text-[13px] font-semibold text-amber-400"
              : "tnum mt-1 text-[13px] font-semibold text-zinc-100"
          }
        >
          {filed ? fmtIdr(totals.payable) : "—"}
        </div>
      </div>
      <div className="leading-tight">
        <div className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">FTZ saving</div>
        <div className="tnum mt-1 text-[13px] font-semibold text-emerald-400">
          {filed ? fmtIdrShort(totals.saved) : "—"}
        </div>
      </div>
      <div className="hidden sm:block leading-tight">
        <div className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">Avg match</div>
        <div className="tnum mt-1 text-[13px] font-semibold text-cyan-300">
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
