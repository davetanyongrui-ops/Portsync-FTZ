import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DemoInvoice, LineCalc } from "../types";
import { Tag, type Tone } from "./ui";
import { cn } from "../lib/cn";

interface Check {
  label: string;
  value: string;
  state: "pass" | "warn" | "fail" | "pending";
  note: string;
}

const STATE_TONE: Record<Check["state"], Tone> = {
  pass: "ok",
  warn: "warn",
  fail: "bad",
  pending: "neutral",
};

const STATE_LABEL: Record<Check["state"], string> = {
  pass: "PASS",
  warn: "REVIEW",
  fail: "FAIL",
  pending: "PENDING",
};

/**
 * Document-level consistency checks, derived from the parsed consignment rather
 * than hard-coded. Each row is a rule the broker would otherwise check by hand
 * before keying a PIB into CEISA.
 */
export function AuditPanel({
  invoice,
  calcs,
  ready,
}: {
  invoice: DemoInvoice;
  calcs: LineCalc[];
  ready: boolean;
}) {
  const [open, setOpen] = useState(false);

  const preBorder = calcs.filter((c) => c.lartas === "PRE_BORDER");
  const sni = calcs.filter((c) => c.entry.sni);
  const lowConfidence = calcs.filter((c) => c.hs && c.confidence < 0.7);
  const unassigned = calcs.filter((c) => c.unclassified);
  const banded = calcs.filter((c) => !c.unclassified && !c.rateExact);
  const noOrigin = calcs.filter((c) => !c.line.origin);
  const noPrice = calcs.filter((c) => c.unitCifUsd <= 0);
  const totalNet = invoice.lines.reduce((a, l) => a + l.netKg, 0);
  const declared = invoice.lines.reduce((a, l) => a + l.qty * l.unitCifUsd, 0);

  const checks: Check[] = [
    {
      label: "Heading assigned",
      value: ready ? (unassigned.length ? `${unassigned.length} line(s) unclassified` : "every line has one") : "—",
      state: !ready ? "pending" : unassigned.length ? "fail" : "pass",
      note: unassigned.length
        ? `POS ${unassigned.map((c) => c.pos).join(", ")} matched nothing in the register. Duty cannot be computed until a heading is chosen.`
        : "Every line carries a heading the register can price.",
    },
    {
      label: "Origin stated",
      value: ready ? (noOrigin.length ? `${noOrigin.length} line(s) blank` : "stated on every line") : "—",
      state: !ready ? "pending" : noOrigin.length ? "fail" : "pass",
      note: "Origin decides which certificate applies. A blank origin means no preference can be claimed.",
    },
    {
      label: "Rate certainty",
      value: ready ? (banded.length ? `${banded.length} line(s) in a band` : "exact for every line") : "—",
      state: !ready ? "pending" : banded.length ? "warn" : "pass",
      note: "A six-digit subheading can split into national lines taxed at different rates. Those lines are priced at the ceiling of the band until the eight-digit code is pinned.",
    },
    {
      label: "Unit prices",
      value: ready ? (noPrice.length ? `${noPrice.length} line(s) without a price` : "all priced") : "—",
      state: !ready ? "pending" : noPrice.length ? "fail" : "pass",
      note: "Customs value cannot be established for a line with no readable price.",
    },
    {
      label: "Consignee identity",
      value: [invoice.consignee.nib && "NIB", invoice.consignee.api && "API", invoice.consignee.taxId && "NPWP"]
        .filter(Boolean)
        .join(" · ") || "not on document",
      state: invoice.consignee.nib && invoice.consignee.api && invoice.consignee.taxId ? "pass" : "fail",
      note: "A PIB header needs NIB, API and NPWP on the importer record. These live on the customs master data, not the invoice.",
    },
    {
      label: "Incoterm",
      value: invoice.freight.incoterm || "not stated",
      state: invoice.freight.incoterm ? "pass" : "fail",
      note: "Customs value is derived from the declared incoterm; CIF terms need no freight add-back.",
    },
    {
      label: "Declared net mass",
      value: totalNet > 0 ? `${totalNet.toLocaleString("en-US")} KGM` : "not stated",
      state: totalNet > 0 ? "pass" : "warn",
      note: "Per-line net weight is what the customs office reconciles against the manifest. Invoices rarely carry it — it comes from the packing list.",
    },
    {
      label: "Invoice arithmetic",
      value: `$${declared.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      state: declared > 0 ? "pass" : "fail",
      note: "Total of quantity × unit price across the parsed lines.",
    },
    {
      label: "Pre-border permits",
      value: ready ? (preBorder.length ? `${preBorder.length} line(s)` : "none required") : "—",
      state: !ready ? "pending" : preBorder.length ? "fail" : "pass",
      note: preBorder.length
        ? `POS ${preBorder.map((c) => c.pos).join(", ")} cannot be filed until the permit number is keyed into the licence block.`
        : "No line requires a permit before submission.",
    },
    {
      label: "Classification confidence",
      value: ready ? (lowConfidence.length ? `${lowConfidence.length} below 70%` : "all ≥ 70%") : "—",
      state: !ready ? "pending" : lowConfidence.length ? "warn" : "pass",
      note: "Low-confidence lines are flagged for broker review before the declaration is signed.",
    },
    {
      label: "SNI conformity",
      value: ready ? (sni.length ? `${sni.length} line(s)` : "none") : "—",
      state: !ready ? "pending" : sni.length ? "warn" : "pass",
      note: sni.length ? `${sni.map((c) => c.entry.sni?.standard).join(", ")} certificate numbers are not on the source document.` : "No SNI obligation attaches to these headings.",
    },
  ];

  const resolved = checks.filter((c) => c.state === "pass").length;
  const actionable = checks.filter((c) => c.state === "fail" || c.state === "warn").length;

  return (
    <div className="overflow-hidden rounded-[6px] border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-sunken/60"
      >
        {open ? <ChevronDown size={12} className="text-ink-3" /> : <ChevronRight size={12} className="text-ink-3" />}
        <span className="text-[12px] font-medium text-ink">Pre-filing checks</span>
        <span className="ml-auto flex items-center gap-1.5">
          {ready ? (
            <>
              <span className="tnum font-mono text-[10px] text-ink-3">
                {resolved}/{checks.length}
              </span>
              {actionable > 0 ? (
                <Tag tone="warn">{actionable} to review</Tag>
              ) : (
                <Tag tone="ok">clear</Tag>
              )}
            </>
          ) : (
            <Tag>awaiting analysis</Tag>
          )}
        </span>
      </button>

      {open && (
        <div className="animate-fade border-t border-line">
          {checks.map((c) => (
            <div
              key={c.label}
              className="flex items-start gap-2 border-b border-line px-2.5 py-1.5 last:border-b-0"
              title={c.note}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[11.5px] text-ink">{c.label}</span>
                <span className="mt-0.5 block truncate font-mono text-[10px] text-ink-3">{c.value}</span>
              </span>
              <span
                className={cn(
                  "mt-px shrink-0 font-mono text-[9.5px] tracking-[0.06em]",
                  c.state === "pass"
                    ? "text-ok"
                    : c.state === "fail"
                      ? "text-bad"
                      : c.state === "warn"
                        ? "text-warn"
                        : "text-ink-3",
                )}
              >
                {STATE_LABEL[c.state]}
              </span>
            </div>
          ))}
          <div className="bg-sunken px-2.5 py-2 text-[10.5px] leading-relaxed text-ink-3">
            Checks run locally against the parsed document. Nothing is submitted; a licensed broker signs the
            declaration.
          </div>
        </div>
      )}
    </div>
  );
}

export { STATE_TONE };
