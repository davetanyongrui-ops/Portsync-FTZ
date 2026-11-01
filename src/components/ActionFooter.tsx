import { Braces, FileCode2, Table2 } from "lucide-react";
import type { DeclarationTotals } from "../types";
import { fmtIdr, fmtIdrShort } from "../lib/format";
import { Btn } from "./ui";

export function ActionFooter({
  totals,
  ready,
  destination,
  onDownloadXml,
  onDownloadCsv,
  onOpenPayload,
}: {
  totals: DeclarationTotals;
  ready: boolean;
  destination: { treatment: "suspended" | "onward" | "direct"; port: string };
  onDownloadXml: () => void;
  onDownloadCsv: () => void;
  onOpenPayload: () => void;
}) {
  const filed = ready && totals.selected > 0;
  // Duty and tax actually collected here. PPh 22 is a tax prepayment, shown apart.
  const collected = totals.payable - totals.pph22;
  const suspended = destination.treatment === "suspended";

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-surface px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
        <div className="leading-tight">
          <div className="text-[9.5px] font-semibold tracking-[0.07em] text-ink-3 uppercase">Lines filed</div>
          <div className="tnum mt-0.5 font-mono text-[12px] text-ink">
            {ready ? `${totals.selected}/${totals.lines}` : "—"}
          </div>
        </div>
        <div className="leading-tight">
          <div className="text-[9.5px] font-semibold tracking-[0.07em] text-ink-3 uppercase">Payable</div>
          <div
            className={
              filed
                ? collected === 0
                  ? "tnum mt-0.5 font-mono text-[12px] text-ok"
                  : "tnum mt-0.5 font-mono text-[12px] text-warn"
                : "tnum mt-0.5 font-mono text-[12px] text-ink"
            }
            title={
              filed
                ? `${fmtIdr(collected)} of duty and tax at ${destination.port}; PPh 22 ${fmtIdr(totals.pph22)} is credited separately`
                : undefined
            }
          >
            {filed ? fmtIdrShort(collected) : "—"}
          </div>
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="text-[9.5px] font-semibold tracking-[0.07em] text-ink-3 uppercase">
            {suspended ? "Held in zone" : "FTA saved"}
          </div>
          <div
            className="tnum mt-0.5 font-mono text-[12px] text-ok"
            title={
              filed
                ? suspended
                  ? `${fmtIdr(totals.deferred)} not collected while the goods stay in the KPBPB`
                  : `${fmtIdr(totals.prefSaved)} of Bea Masuk avoided by the preferential rate`
                : undefined
            }
          >
            {filed ? fmtIdrShort(suspended ? totals.deferred : totals.prefSaved) : "—"}
          </div>
        </div>
        <div className="hidden leading-tight md:block">
          <div className="text-[9.5px] font-semibold tracking-[0.07em] text-ink-3 uppercase">Avg match</div>
          <div className="tnum mt-0.5 font-mono text-[12px] text-ink-2">
            {filed ? `${Math.round(totals.avgConfidence * 100)}%` : "—"}
          </div>
        </div>
        {filed && totals.blocked > 0 && (
          <div
            className="leading-tight"
            title="Pre-border lartas lines need a permit number before the PIB can be submitted"
          >
            <div className="text-[9.5px] font-semibold tracking-[0.07em] text-ink-3 uppercase">Blocked</div>
            <div className="tnum mt-0.5 flex items-center gap-1 font-mono text-[12px] text-bad">
              <span className="inline-block size-[5px] rounded-full bg-bad" />
              {totals.blocked}
            </div>
          </div>
        )}
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
        <Btn
          size="sm"
          variant="ghost"
          icon={Table2}
          onClick={onDownloadCsv}
          disabled={!filed}
          title="Line schedule with the per-line duty split"
        >
          <span className="hidden sm:inline">CSV</span>
        </Btn>
        <Btn
          size="sm"
          variant="secondary"
          icon={FileCode2}
          onClick={onDownloadXml}
          disabled={!filed}
          title="CEISA-flavoured interchange document"
        >
          <span className="hidden sm:inline">Download</span> XML
        </Btn>
        <Btn size="sm" variant="primary" icon={Braces} onClick={onOpenPayload} disabled={!filed}>
          Generate payload
        </Btn>
      </div>
    </div>
  );
}
