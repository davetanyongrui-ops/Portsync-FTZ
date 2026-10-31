import { useEffect, useRef, useState } from "react";
import { Maximize, Minus, Plus, ScanLine } from "lucide-react";
import type { DemoInvoice, LineCalc } from "../types";
import { fmtQty, fmtUsd } from "../lib/format";
import { cn } from "../lib/cn";

const PAGE_W = 760;
const HEAD_H = 112;
const META_H = 150;
const TH_H = 26;
const ROW_H = 44;
const TAIL_H = 138;

const ZOOMS = [0.62, 0.78, 1, 1.25];

const COLS = "24px 1fr 30px 58px 30px 66px 82px";

const zoomBtn =
  "grid size-7 place-items-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-300";

export function InvoicePage({
  invoice,
  calcs,
  analyzed,
  activeId,
  onActive,
}: {
  invoice: DemoInvoice;
  calcs: LineCalc[];
  analyzed: boolean;
  activeId: string | null;
  onActive: (id: string | null) => void;
}) {
  const [zoomIdx, setZoomIdx] = useState(1);
  const viewRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const zoom = ZOOMS[zoomIdx] ?? 0.78;
  const pageH = HEAD_H + META_H + TH_H + invoice.lines.length * ROW_H + TAIL_H;
  const calcByPos = new Map(calcs.map((c) => [c.pos, c]));

  useEffect(() => {
    if (!activeId) return;
    const view = viewRef.current;
    const box = boxRefs.current[activeId];
    if (!view || !box) return;
    const vr = view.getBoundingClientRect();
    const br = box.getBoundingClientRect();
    view.scrollTop += br.top - vr.top - (vr.height / 2 - br.height / 2);
  }, [activeId]);

  const isRaster = invoice.kind === "PNG";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-xs">
      <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-zinc-800 px-3 bg-zinc-950/60">
        <ScanLine size={14} className="shrink-0 text-cyan-400" />
        <span className="truncate text-[12.5px] font-medium text-zinc-200">{invoice.fileName}</span>
        <span className="tnum hidden shrink-0 text-[11px] text-zinc-400 sm:inline">
          {invoice.pages} pg · {invoice.sizeKb} kB · {isRaster ? "300 dpi raster" : "text layer"}
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
            className={zoomBtn}
            disabled={zoomIdx === 0}
            aria-label="Zoom out"
          >
            <Minus size={13} />
          </button>
          <span className="tnum w-11 text-center text-[11.5px] text-zinc-400">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoomIdx((i) => Math.min(ZOOMS.length - 1, i + 1))}
            className={zoomBtn}
            disabled={zoomIdx === ZOOMS.length - 1}
            aria-label="Zoom in"
          >
            <Plus size={13} />
          </button>
          <button
            type="button"
            onClick={() => setZoomIdx(1)}
            className={cn(zoomBtn, "ml-1")}
            aria-label="Fit page"
          >
            <Maximize size={13} />
          </button>
        </div>
      </div>

      <div
        ref={viewRef}
        className="scroll-thin dotgrid relative min-h-0 flex-1 overflow-auto bg-zinc-950/90 p-5"
        onClick={() => onActive(null)}
      >
        <div
          className="paper-shadow relative origin-top-left overflow-hidden rounded-lg mx-auto"
          style={{ width: PAGE_W * zoom, height: pageH * zoom }}
        >
          <div
            className="relative font-mono text-[#16202b]"
            style={{
              width: PAGE_W,
              height: pageH,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              backgroundImage: isRaster
                ? "linear-gradient(180deg,#f6f7f4,#eef0ec), repeating-linear-gradient(0deg,rgba(0,0,0,0.022) 0 1px,transparent 1px 3px)"
                : "linear-gradient(180deg,#fbfcfe,#f2f5f9)",
            }}
          >
            {/* letterhead */}
            <div className="flex items-start justify-between px-[34px] pt-[26px]" style={{ height: HEAD_H }}>
              <div className="max-w-[380px]">
                <div className="text-[15px] leading-tight font-bold tracking-tight text-slate-900">{invoice.supplier.name}</div>
                <div className="mt-1 text-[9.5px] leading-[1.5] text-[#4a5666]">{invoice.supplier.addr}</div>
                <div className="text-[9.5px] text-[#4a5666]">{invoice.supplier.taxId}</div>
                <div className="mt-2 inline-block border border-[#b9c3d0] px-1.5 py-px text-[8.5px] tracking-[0.14em] text-[#39445a] uppercase bg-white/60">
                  Reg. No. {invoice.supplier.taxId.replace(/\D/g, "").slice(0, 9) || "000000000"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-bold tracking-[0.1em] text-slate-900">
                  {isRaster ? "SEA WAYBILL / MANIFEST" : "COMMERCIAL INVOICE"}
                </div>
                <div className="mt-1 text-[9px] tracking-[0.1em] text-[#5a6678]">
                  NO. {invoice.docNo} · {invoice.docDate}
                </div>
                <div className="mt-1 text-[9px] text-[#5a6678]">{invoice.freight.incoterm}</div>
                <div className="mt-2 text-[8.5px] leading-[1.5] text-[#7b8798]">
                  {isRaster ? "SCAN — PAGE 1/1 · OCR CONFIDENCE 0.97" : `PRINTED — PAGE 1/${invoice.pages} · TEXT LAYER OK`}
                </div>
              </div>
            </div>

            {/* party + transport grid */}
            <div
              className="grid grid-cols-2 gap-x-6 border-y border-dashed border-[#c3ccd8] px-[34px] py-[10px]"
              style={{ height: META_H }}
            >
              <div>
                <div className="text-[8px] tracking-[0.18em] text-[#7b8798] uppercase">Consignee / Importer</div>
                <div className="mt-1 text-[10.5px] font-bold text-slate-900">{invoice.consignee.name}</div>
                <div className="text-[9px] leading-[1.55] text-[#4a5666]">{invoice.consignee.addr}</div>
                <div className="mt-1 text-[9px] text-[#4a5666]">NPWP {invoice.consignee.taxId}</div>
                <div className="text-[9px] text-[#4a5666]">
                  NIB {invoice.consignee.nib} · API {invoice.consignee.api}
                </div>
              </div>
              <div>
                <div className="text-[8px] tracking-[0.18em] text-[#7b8798] uppercase">Carriage</div>
                <dl className="mt-1 grid grid-cols-[86px_1fr] gap-x-2 gap-y-[3px] text-[9px]">
                  {[
                    ["Vessel/Voy.", `${invoice.freight.vessel} ${invoice.freight.voyage}`],
                    ["Manifest", invoice.freight.manifest],
                    ["Container", invoice.freight.container],
                    ["POL", invoice.freight.portOfLoading],
                    ["POD", invoice.freight.portOfDischarge],
                    ["ETA", invoice.freight.eta],
                    ["Freight", `USD ${invoice.freight.freightUsd.toLocaleString("en-US")}`],
                    ["Insurance", `USD ${invoice.freight.insuranceUsd.toLocaleString("en-US")}`],
                  ].map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-[#7b8798]">{k}</dt>
                      <dd className="truncate text-[#22303f]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* table head */}
            <div
              className="grid items-center border-b border-[#9aa6b6] bg-[#e7ebf1] px-[34px] text-[8px] font-bold tracking-[0.1em] text-[#3d4a5c] uppercase"
              style={{ height: TH_H, gridTemplateColumns: COLS }}
            >
              <span>#</span>
              <span>Description of goods</span>
              <span className="text-center">O</span>
              <span className="text-right">Qty</span>
              <span className="text-center">U/M</span>
              <span className="text-right">Unit</span>
              <span className="text-right">Amount</span>
            </div>

            {/* line items */}
            {invoice.lines.map((l) => {
              const c = calcByPos.get(l.pos);
              return (
                <div
                  key={l.id}
                  className="grid items-center border-b border-[#dfe5ec] px-[34px] text-[9.5px]"
                  style={{ height: ROW_H, gridTemplateColumns: COLS }}
                >
                  <span className="tnum text-[#7b8798]">{String(l.pos).padStart(2, "0")}</span>
                  <span className="overflow-hidden leading-[1.35] break-words whitespace-normal">
                    {l.raw}
                    <span className="block text-[8px] text-[#8a95a6]">{l.supplierRef}</span>
                  </span>
                  <span className="text-center text-[#4a5666]">{l.origin}</span>
                  <span className="tnum text-right">{fmtQty(l.qty)}</span>
                  <span className="text-center text-[#4a5666]">{l.uom}</span>
                  <span className="tnum text-right">{l.unitCifUsd.toFixed(2)}</span>
                  <span className="tnum text-right font-semibold">
                    {(c ? c.usdCif : l.qty * l.unitCifUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}

            {/* tail */}
            <div className="px-[34px] pt-[12px]" style={{ height: TAIL_H }}>
              <div className="flex justify-between">
                <div className="max-w-[420px] space-y-1 text-[8.5px] leading-[1.5] text-[#5a6678]">
                  {invoice.footnotes.map((f) => (
                    <p key={f}>• {f}</p>
                  ))}
                  <p className="pt-1 text-[#8a95a6]">Bank: DBS 002-938114-00 · Beneficiary as above · E&amp;OE</p>
                </div>
                <div className="w-[230px] text-[9.5px]">
                  {[
                    ["Total Net Weight", `${fmtQty(invoice.lines.reduce((a, l) => a + l.netKg, 0))} KGM`],
                    [
                      "CIF Invoice Total",
                      `USD ${fmtUsd(invoice.lines.reduce((a, l) => a + l.qty * l.unitCifUsd, 0)).replace("$ ", "")}`,
                    ],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-t border-[#9aa6b6] py-1">
                      <span className="text-[#4a5666]">{k}</span>
                      <span className="tnum font-bold">{v}</span>
                    </div>
                  ))}
                  <div className="mt-3 inline-block -rotate-6 border-2 border-[#b08968] px-2 py-1 text-[8px] leading-tight font-bold tracking-[0.1em] text-[#b08968] uppercase opacity-70">
                    Declared value<br />true &amp; correct
                  </div>
                </div>
              </div>
            </div>

            {/* parsed bounding boxes */}
            {analyzed &&
              invoice.lines.map((l, i) => {
                const c = calcByPos.get(l.pos);
                if (!c) return null;
                const active = activeId === l.id;
                const top = HEAD_H + META_H + TH_H + i * ROW_H + 3;
                return (
                  <div
                    key={`box-${l.id}`}
                    ref={(el) => {
                      boxRefs.current[l.id] = el;
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onActive(active ? null : l.id);
                    }}
                    className={cn(
                      "animate-draw absolute cursor-pointer rounded-md border bg-cyan-500/10 transition-shadow duration-150",
                      active
                        ? "border-cyan-400 bg-cyan-500/25 shadow-[0_0_0_3px_rgba(6,182,212,0.45)] ring-2 ring-cyan-400"
                        : "border-cyan-500/60 hover:border-cyan-400",
                    )}
                    style={{
                      left: l.span.x * PAGE_W,
                      top,
                      width: l.span.w * PAGE_W,
                      height: ROW_H - 7,
                      animationDelay: `${i * 65}ms`,
                    }}
                    title={`POS ${l.pos} · ${c.hs} · ${Math.round(c.confidence * 100)}% · ${c.entry.titleEn}`}
                  >
                    <span
                      className={cn(
                        "tnum absolute -top-[9px] left-0 rounded-[3px] px-1.5 py-px text-[7.5px] leading-[13px] font-bold tracking-[0.04em] whitespace-nowrap text-zinc-950",
                        active ? "bg-cyan-400 font-extrabold" : "bg-cyan-400/90",
                      )}
                    >
                      {c.hs} · {Math.round(c.confidence * 100)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
