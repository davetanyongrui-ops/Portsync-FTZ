import { useState } from "react";
import { Check, MapPin, Scale, ShieldCheck } from "lucide-react";
import type { DeclarationTotals, DemoInvoice, InvoiceLine, LineCalc } from "../types";
import { schemeFor } from "../lib/engine";
import { fmtIdr } from "../lib/format";
import { DESTINATIONS, type Destination } from "../data/destinations";
import { REGISTER_SIZE, TARIFF_FETCHED, TARIFF_SOURCE } from "../data/tariff";
import { SummaryStrip } from "./SummaryStrip";
import { TaxSummary } from "./TaxSummary";
import { DeclarationTable } from "./DeclarationTable";
import { ActionFooter } from "./ActionFooter";
import { Btn, Label, Segmented, Tag } from "./ui";
import { cn } from "../lib/cn";

type PanelView = "summary" | "lines" | "destination" | "advisory";

const TREATMENT_LABEL: Record<Destination["treatment"], string> = {
  suspended: "Duty suspended",
  onward: "Released to mainland",
  direct: "Direct import",
};

export function RightPanel({
  invoice,
  calcs,
  totals,
  ready,
  selectedIds,
  activeId,
  onActive,
  onToggle,
  onSelectAll,
  onOverride,
  onEditLine,
  docCheck,
  onDownloadXml,
  onDownloadCsv,
  onOpenPayload,
  destination,
  onDestinationChange,
  onToggleMasterlist,
  onOpenLegal,
}: {
  invoice: DemoInvoice | null;
  calcs: LineCalc[];
  totals: DeclarationTotals;
  ready: boolean;
  selectedIds: Set<string>;
  activeId: string | null;
  onActive: (id: string | null) => void;
  onToggle: (id: string) => void;
  onSelectAll: (on: boolean) => void;
  onOverride: (id: string, hs: string) => void;
  onEditLine: (id: string, patch: Partial<Pick<InvoiceLine, "qty" | "unitCifUsd">>) => void;
  docCheck: { stated: number; computed: number } | null;
  onDownloadXml: () => void;
  onDownloadCsv: () => void;
  onOpenPayload: () => void;
  destination: Destination;
  onDestinationChange?: (id: string) => void;
  onToggleMasterlist?: (id: string) => void;
  onOpenLegal?: (doc: "disclaimer" | "tos" | "privacy") => void;
}) {
  const [view, setView] = useState<PanelView>("summary");
  const overrides = calcs.filter((c) => c.overridden).length;
  const allSelected = ready && calcs.every((c) => selectedIds.has(c.id));

  const unclassified = calcs.filter((c) => c.unclassified);
  const ranged = calcs.filter((c) => !c.unclassified && !c.rateExact);
  const origins = [...new Set(calcs.map((c) => c.line.origin))];
  const prefLines = calcs.filter((c) => c.pref);

  const cities = [...new Set(DESTINATIONS.map((d) => d.city))];

  return (
    <section className="@container flex h-full min-h-0 w-full flex-col">
      <SummaryStrip
        invoice={invoice}
        calcs={calcs}
        totals={totals}
        ready={ready}
        destination={destination}
      />

      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-line px-3">
        <Segmented<PanelView>
          label="Declaration view"
          value={view}
          onChange={setView}
          options={[
            { value: "summary", label: "Summary" },
            { value: "lines", label: `Lines (${calcs.length})` },
            { value: "destination", label: "Destination" },
            { value: "advisory", label: "Advisory" },
          ]}
        />

        <div className="ml-auto flex items-center gap-2">
          {overrides > 0 && <Tag tone="warn">{overrides} override</Tag>}
          <span className="hidden font-mono text-[10.5px] text-ink-3 lg:inline">{invoice?.docNo ?? "—"}</span>
          <span className="hidden sm:block">
            <Btn
              size="xs"
              variant="ghost"
              onClick={() => onSelectAll(!allSelected)}
              disabled={!ready}
              title="Include or exclude every line from the filing set"
            >
              {allSelected ? "Deselect all" : "Select all"}
            </Btn>
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "lines" && (
          <DeclarationTable
            calcs={calcs}
            selectedIds={selectedIds}
            activeId={activeId}
            ready={ready}
            onActive={onActive}
            onToggle={onToggle}
            onSelectAll={onSelectAll}
            onOverride={onOverride}
            onEditLine={onEditLine}
            docCheck={docCheck}
            onToggleMasterlist={onToggleMasterlist}
          />
        )}

        {view === "summary" && (
          <div className="scroll-thin h-full overflow-y-auto p-4">
            <div className="mx-auto max-w-[820px]">
              <TaxSummary
                calcs={calcs}
                selectedIds={selectedIds}
                totals={totals}
                ready={ready}
                destination={destination.office ?? destination.port}
                docCheck={docCheck}
              />
            </div>
          </div>
        )}

        {view === "destination" && (
          <div className="scroll-thin h-full overflow-y-auto p-4">
            <div className="max-w-[760px]">
              <Label>Where the goods are cleared</Label>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-3">
                The port decides whether duty is levied at all. Batam is inside the free zone; Medan,
                Jakarta and Surabaya are not.
              </p>

              <div className="mt-2 space-y-3">
                {cities.map((city) => (
                  <div key={city}>
                    <div className="mb-1 flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.08em] text-ink-3 uppercase">
                      <MapPin size={9} strokeWidth={2.2} /> {city}
                    </div>
                    <div className="overflow-hidden rounded-[6px] border border-line">
                      {DESTINATIONS.filter((d) => d.city === city).map((d, i, arr) => {
                        const active = destination.id === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            data-destination={d.id}
                            aria-pressed={active}
                            onClick={() => onDestinationChange?.(d.id)}
                            className={cn(
                              "flex w-full cursor-pointer items-start gap-2.5 px-3 py-1.5 text-left transition-colors",
                              i < arr.length - 1 && "border-b border-line",
                              active ? "bg-sunken" : "hover:bg-sunken/50",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-px grid size-[14px] shrink-0 place-items-center rounded-full border",
                                active ? "border-ink bg-ink text-paper" : "border-line-strong bg-surface",
                              )}
                            >
                              {active && <Check size={9} strokeWidth={3.5} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline gap-x-2">
                                <span className="text-[12px] font-medium text-ink">{d.port}</span>
                                <span className="font-mono text-[10px] text-ink-3">{d.officeCode}</span>
                                <Tag tone={d.region === "KPBPB" ? "ok" : "neutral"}>
                                  {d.region}
                                </Tag>
                              </span>
                              <span className="mt-0.5 block text-[10.5px] leading-snug text-ink-3">
                                {TREATMENT_LABEL[d.treatment]} · {d.regime}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[6px] border border-line bg-sunken px-3 py-2">
                <p className="text-[11.5px] leading-relaxed text-ink-2">{destination.summary}</p>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>Duty build-up on the filing set</Label>
                  <div className="mt-2 overflow-hidden rounded-[6px] border border-line">
                    {(
                      [
                        ["Nilai pabean (CIF)", ready ? fmtIdr(totals.selIdrCif) : "—"],
                        ["Bea Masuk", ready ? fmtIdr(totals.standard.bm) : "—"],
                        ...(totals.standard.bmad > 0
                          ? [["BMAD", ready ? fmtIdr(totals.standard.bmad) : "—"] as [string, string]]
                          : []),
                        ...(totals.standard.ppnbm > 0
                          ? [["PPnBM", ready ? fmtIdr(totals.standard.ppnbm) : "—"] as [string, string]]
                          : []),
                        ["PPN 11%", ready ? fmtIdr(totals.standard.ppn) : "—"],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-baseline justify-between border-b border-line px-2.5 py-1.5 text-[11.5px]"
                      >
                        <span className="text-ink-2">{k}</span>
                        <span className="tnum font-mono text-[11px] text-ink">{v}</span>
                      </div>
                    ))}
                    <div className="flex items-baseline justify-between bg-sunken px-2.5 py-1.5 text-[11.5px]">
                      <span className="text-ink-2">Duty &amp; tax due</span>
                      <span className="tnum font-mono text-[11px] font-semibold text-ink">
                        {ready ? fmtIdr(totals.standard.total) : "—"}
                      </span>
                    </div>
                    {totals.prefSaved > 0 && (
                      <div className="flex items-baseline justify-between border-t border-line px-2.5 py-1.5 text-[11.5px]">
                        <span className="text-ok">FTA preference applied</span>
                        <span className="tnum font-mono text-[11px] text-ok">
                          −{fmtIdr(totals.prefSaved)}
                        </span>
                      </div>
                    )}
                    {totals.deferred > 0 && (
                      <div className="flex items-baseline justify-between border-t border-line px-2.5 py-1.5 text-[11.5px]">
                        <span className="text-ok">Held by the zone facility</span>
                        <span className="tnum font-mono text-[11px] text-ok">
                          −{fmtIdr(totals.deferred)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between bg-sunken px-2.5 py-1.5 text-[11.5px]">
                      <span className="font-medium text-ink">Payable now</span>
                      <span
                        className={cn(
                          "tnum font-mono text-[11px] font-semibold",
                          ready && totals.payable - totals.pph22 === 0 ? "text-ok" : "text-warn",
                        )}
                      >
                        {ready ? fmtIdr(totals.payable - totals.pph22) : "—"}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-3">
                    PPh 22 {ready ? fmtIdr(totals.pph22) : "—"} is an income-tax prepayment credited
                    against the importer's return, not a duty.
                  </p>
                </div>

                <div>
                  <Label>Entry declaration</Label>
                  <dl className="mt-2 overflow-hidden rounded-[6px] border border-line">
                    {[
                      [destination.treatment === "suspended" ? "Facility form" : "Declaration", destination.regime],
                      ["Zone", destination.region === "KPBPB" ? "KPBPB Batam" : "TLDDP (customs area)"],
                      ["Customs office", `${destination.officeCode} · ${destination.office}`],
                      ["Port", `${destination.port}, ${destination.city}`],
                      [
                        "Treatment",
                        destination.treatment === "suspended"
                          ? "BM, PPnBM, PPN and PPh 22 not collected"
                          : destination.treatment === "onward"
                            ? "Duty and PPN due on the released share"
                            : "Ordinary PIB, no zone facility",
                      ],
                    ].map(([k, v]) => (
                      <div key={k} className="border-b border-line px-2.5 py-1.5 last:border-b-0">
                        <dt className="text-[10px] tracking-[0.06em] text-ink-3 uppercase">{k}</dt>
                        <dd className="mt-0.5 text-[11.5px] leading-snug text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {onOpenLegal && (
                    <button
                      type="button"
                      onClick={() => onOpenLegal("disclaimer")}
                      className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
                    >
                      <Scale size={11} strokeWidth={2} /> Statutory disclaimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "advisory" && (
          <div className="scroll-thin h-full overflow-y-auto p-4">
            <div className="max-w-[760px] space-y-5">
              <div>
                <Label>Origin and preferential route</Label>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-3">
                  Rates come from the register per heading, not from a blanket country rule. A heading
                  with no schedule rate keeps MFN.
                </p>
                <div className="mt-2 overflow-hidden rounded-[6px] border border-line">
                  {origins.length === 0 && (
                    <div className="px-2.5 py-3 text-[11.5px] text-ink-3">
                      Run the classifier to see origin routes.
                    </div>
                  )}
                  {origins.map((o) => {
                    const scheme = schemeFor(o);
                    const lines = calcs.filter((c) => c.line.origin === o);
                    const withPref = lines.filter((c) => c.pref).length;
                    const saved = lines.reduce((n, c) => n + (c.pref?.saved ?? 0), 0);
                    return (
                      <div key={o || "unknown"} className="border-b border-line px-2.5 py-2 last:border-b-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-ink">
                            {o || "—"}
                          </span>
                          <span className="text-[11.5px] text-ink">
                            {scheme ? scheme.label : o ? "MFN only" : "Origin not stated"}
                          </span>
                          {scheme && <Tag tone="ok">{scheme.form}</Tag>}
                          {!scheme && o && <Tag tone="neutral">No agreement</Tag>}
                          {!o && <Tag tone="warn">Set the origin</Tag>}
                          <span className="ml-auto font-mono text-[10px] text-ink-3">
                            {lines.length} line(s)
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                          {scheme
                            ? `${withPref} of ${lines.length} lines carry a rate under ${scheme.label}${
                                saved > 0 ? `, worth ${fmtIdr(saved)} of Bea Masuk` : ""
                              }. Basis: ${scheme.basis}.`
                            : o
                              ? "No preferential agreement covers this origin, so MFN applies in full."
                              : "The document does not say where the goods were made, so no preference can be claimed. Add it on the line before filing."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(unclassified.length > 0 || ranged.length > 0) && (
                <div>
                  <Label>Needs a decision</Label>
                  <div className="mt-2 overflow-hidden rounded-[6px] border border-line">
                    {unclassified.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-2 border-b border-line px-2.5 py-2 last:border-b-0"
                      >
                        <span className="tnum mt-px font-mono text-[10.5px] text-ink-3">
                          {String(c.pos).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink">{c.line.raw}</span>
                        <Tag tone="bad">No heading</Tag>
                      </div>
                    ))}
                    {ranged.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-2 border-b border-line px-2.5 py-2 last:border-b-0"
                      >
                        <span className="tnum mt-px font-mono text-[10.5px] text-ink-3">
                          {String(c.pos).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink">{c.line.raw}</span>
                        <Tag tone="warn">
                          {Math.round((c.entry.bmMin ?? 0) * 100)}–
                          {Math.round((c.entry.bmMax ?? 0) * 100)}% band
                        </Tag>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-3">
                    A subheading that splits into several national lines cannot be priced from the
                    six-digit rate alone. The figure used here is the ceiling of the band.
                  </p>
                </div>
              )}

              <div>
                <Label>Masterlist position</Label>
                <div className="mt-2 overflow-hidden rounded-[6px] border border-line">
                  {calcs.filter((c) => c.isAsset).length === 0 ? (
                    <div className="px-2.5 py-3 text-[11.5px] text-ink-3">
                      No furniture or office asset on this consignment, so no BP Batam masterlist
                      question arises.
                    </div>
                  ) : (
                    calcs
                      .filter((c) => c.isAsset)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 border-b border-line px-2.5 py-2 last:border-b-0"
                        >
                          <span className="tnum font-mono text-[10.5px] text-ink-3">
                            {String(c.pos).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink">
                            {c.line.raw}
                          </span>
                          {c.hasMasterlist ? (
                            <Tag tone="ok">masterlist</Tag>
                          ) : (
                            <Tag tone="warn">
                              {Math.round(c.bmRate * 100)}% BM · {Math.round(c.ppnRate * 100)}% PPN
                            </Tag>
                          )}
                        </div>
                      ))
                  )}
                </div>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-3">
                  Office furniture is the classic case where the zone suspension is questioned. Ticking
                  the masterlist control applies an approved BP Batam exemption instead.
                </p>
              </div>

              <div className="rounded-[6px] border border-line bg-sunken px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink">
                    <ShieldCheck size={12} strokeWidth={2} className="text-ok" /> Where each figure comes from
                  </div>
                  <a
                    href="#/sources"
                    className="ml-auto font-mono text-[10px] text-brand underline decoration-brand/30 underline-offset-2 hover:decoration-brand"
                  >
                    full source list
                  </a>
                </div>

                <dl className="mt-2 space-y-1 font-mono text-[10px] leading-relaxed text-ink-3">
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-2">Heading</dt>
                    <dd className="min-w-0">BTKI 2022 · {REGISTER_SIZE} subheadings compiled into this build</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-2">Match</dt>
                    <dd className="min-w-0">keyword score over the description — a proposal, not a ruling</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-2">MFN rate</dt>
                    <dd className="min-w-0">
                      {TARIFF_SOURCE.split("—")[0]?.trim()} · fetched {TARIFF_FETCHED}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 text-ink-2">Preference</dt>
                    <dd className="min-w-0">modelled schedule rate, not read from a published FTA annex</dd>
                  </div>
                </dl>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-ink-3">
                  <MapPin size={10} strokeWidth={2} /> {destination.office}
                  <span className="text-line-strong">/</span>
                  {ready
                    ? `${prefLines.length} line(s) with a preference · ${unclassified.length} unclassified`
                    : "idle"}
                </div>
              </div>

              {ready && calcs.length > 0 && (
                <div>
                  <Label>Evidence for each line</Label>
                  <div className="mt-2 overflow-hidden rounded-[6px] border border-line">
                    {calcs.map((c) => {
                      const matched = /\(matched: ([^)]*)\)/.exec(c.line.candidates[0]?.note ?? "")?.[1];
                      const pct = (n: number) => `${Math.round(n * 100)}%`;
                      return (
                        <div key={c.id} className="border-b border-line px-2.5 py-2 last:border-b-0">
                          <div className="flex items-baseline gap-2">
                            <span className="tnum shrink-0 font-mono text-[10.5px] text-ink-3">
                              {String(c.pos).padStart(2, "0")}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink">{c.line.raw}</span>
                            <span className="shrink-0 font-mono text-[10.5px] font-semibold text-ink-2">
                              {c.hs || "—"}
                            </span>
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] leading-relaxed text-ink-3">
                            <span className={matched ? "" : "text-warn"}>
                              {matched ? `matched on “${matched}”` : "no keyword matched — set by hand"}
                            </span>
                            <span className="text-line-strong"> · </span>
                            MFN {pct(c.entry.bmMfn)}
                            {c.entry.bmExact === false && (
                              <span className="text-warn">
                                {" "}
                                (band {pct(c.entry.bmMin ?? 0)}–{pct(c.entry.bmMax ?? 0)}, ceiling used)
                              </span>
                            )}
                            {c.pref && (
                              <>
                                <span className="text-line-strong"> · </span>
                                {c.pref.form} {pct(c.pref.rate)} applied
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[10.5px] leading-relaxed text-ink-3">
                    “Matched on” shows the register keywords the description hit. If that list looks thin, the heading
                    is a guess and should be overruled.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ActionFooter
        totals={totals}
        ready={ready}
        destination={destination}
        onDownloadXml={onDownloadXml}
        onDownloadCsv={onDownloadCsv}
        onOpenPayload={onOpenPayload}
      />
    </section>
  );
}
