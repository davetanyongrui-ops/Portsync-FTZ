import { findTariff, TARIFF, UNCLASSIFIED, type FtaScheme, type TariffEntry } from "../data/tariff";
import { PPN_RATE, PPH22_RATE } from "../data/constants";
import { getDestination, type Treatment } from "../data/destinations";
import { FX } from "./fx";
import { fmtUsd } from "./format";
import type {
  DeclarationTotals,
  DemoInvoice,
  DutySplit,
  HsCandidate,
  InvoiceLine,
  LineCalc,
  RegulatoryBadge,
  RiskTier,
} from "../types";

export type Overrides = Record<string, string>;

/** Kept for the CEISA payload, which names the facility form. */
export type Regime = "PPFTZ-01" | "PPFTZ-02" | "PPFTZ-03" | "PIB";

export const REGIME_LABELS: Record<Regime, string> = {
  "PPFTZ-01": "PPFTZ-01 — foreign goods entered into the free zone",
  "PPFTZ-02": "PPFTZ-02 — zone to zone transfer",
  "PPFTZ-03": "PPFTZ-03 — release from the zone to the customs area",
  "PIB": "PIB — direct import into the customs area",
};

const ASEAN = new Set(["SG", "MY", "VN", "TH", "PH", "BN", "KH", "MM", "LA", "ID"]);

export interface Scheme {
  scheme: FtaScheme;
  label: string;
  form: string;
  basis: string;
}

/**
 * Which certificate the origin can present. The scheme only produces a rate when
 * the register carries one for that heading — otherwise the MFN rate stands and
 * the advisory says so, rather than promising a preference that may not exist.
 */
export function schemeFor(origin: string): Scheme | null {
  const o = (origin || "").trim().toUpperCase();
  if (o === "CN") {
    return {
      scheme: "ACFTA",
      label: "ACFTA",
      form: "Form E",
      basis: "PMK 229/PMK.04/2017 as amended",
    };
  }
  if (o === "JP") {
    return {
      scheme: "IJEPA",
      label: "IJEPA",
      form: "Form IJ",
      basis: "PMK 95/PMK.04/2019",
    };
  }
  if (o === "IN") {
    return {
      scheme: "AIFTA",
      label: "AIFTA",
      form: "Form AI",
      basis: "PMK 129/PMK.04/2019",
    };
  }
  if (ASEAN.has(o)) {
    return {
      scheme: "ATIGA",
      label: "ATIGA",
      form: "e-Form D",
      basis: "PMK 131/PMK.04/2020",
    };
  }
  return null;
}

/** Excise is a per-unit specific rate, not an ad valorem one — never estimated here. */
export function isExciseGood(entry: TariffEntry | undefined): boolean {
  return Boolean(entry?.ftzBlocked);
}

const zeroSplit = (): DutySplit => ({ bm: 0, bmad: 0, ppnbm: 0, ppn: 0, total: 0 });

function addSplit(a: DutySplit, b: DutySplit): DutySplit {
  return {
    bm: a.bm + b.bm,
    bmad: a.bmad + b.bmad,
    ppnbm: a.ppnbm + b.ppnbm,
    ppn: a.ppn + b.ppn,
    total: a.total + b.total,
  };
}

function buildBadges(
  entry: TariffEntry,
  coverage: number,
  bmadRate: number,
  scheme: Scheme | null,
  hasPreference: boolean,
): RegulatoryBadge[] {
  const out: RegulatoryBadge[] = [];

  if (coverage > 0) {
    out.push({
      kind: "facility",
      label: "FTZ facility active",
      detail:
        coverage === 1
          ? "Entered into the KPBPB: Bea Masuk, PPnBM, PPN and PPh 22 are not collected while the goods stay in the enclave (PP 10/2012 jo. PMK 47/PMK.04/2012)."
          : `The facility covers ${Math.round(coverage * 100)}% of the line; the balance is released to the customs area.`,
    });
  }

  if (!entry.bmExact && entry.bmMin !== undefined) {
    out.push({
      kind: "rate-range",
      label: `BM ${Math.round(entry.bmMin * 100)}–${Math.round(entry.bmMax * 100)}%`,
      detail: `Subheading ${entry.hs6} splits into national lines at different rates. Calculated at the ${Math.round(entry.bmMax * 100)}% ceiling — confirm the eight-digit line before filing.`,
    });
  }

  if (entry.lartas === "PRE_BORDER") {
    out.push({
      kind: "lartas-pre",
      label: "Lartas pre-border",
      detail: `${entry.permits?.map((p) => `${p.agency} ${p.code}`).join(" / ") ?? "Permit required"} — the licence must be keyed into the PIB before submission.`,
    });
  } else if (entry.lartas === "POST_BORDER") {
    out.push({
      kind: "lartas-post",
      label: "Lartas post-border",
      detail: `${entry.permits?.map((p) => `${p.agency} ${p.code}`).join(" / ") ?? "Permit required"} — goods may move to the storage facility, then be reported.`,
    });
  }

  if (entry.sni) {
    out.push({
      kind: "sni",
      label: "SNI required",
      detail: `${entry.sni.standard} — ${entry.sni.scope}.`,
    });
  }

  if (bmadRate > 0) {
    out.push({
      kind: "ad",
      label: `BMAD ${Math.round(bmadRate * 100)}%`,
      detail: "A trade-remedy duty applies to this origin on top of the tariff rate.",
    });
  }

  if (entry.ftzBlocked) {
    out.push({
      kind: "excise",
      label: "Excise good — facility does not apply",
      detail:
        "Barang kena cukai. Cukai is collected on entry to the zone regardless of the PPFTZ-01 facility, and the specific rate per unit is not modelled here.",
    });
  }

  if (scheme) {
    out.push({
      kind: "preference",
      label: hasPreference
        ? `${scheme.label} ${scheme.form} — rate applied`
        : `${scheme.label} ${scheme.form} — no schedule rate`,
      detail: hasPreference
        ? `Preferential rate from the ${scheme.label} schedule (${scheme.basis}) is applied instead of MFN.`
        : `This heading has no ${scheme.label} rate in the register, so MFN stands. Verify against the ${scheme.form} schedule.`,
    });
  }

  return out;
}

export interface ComputeContext {
  treatment: Treatment;
  hasMasterlist?: boolean;
}

export function computeLine(
  line: InvoiceLine,
  hsOverride?: string,
  ctx: ComputeContext = { treatment: "suspended" },
): LineCalc {
  const hs = hsOverride ?? line.hs;
  const entry = findTariff(hs);
  const overridden = hs !== line.hs;
  const usdCif = line.qty * line.unitCifUsd;
  const idrCif = Math.round(usdCif * FX.USD_IDR);
  const treatment = ctx.treatment;
  const hasMasterlist = Boolean(ctx.hasMasterlist);

  /* ---- OCR figure reconciliation ---- */
  // The row's printed amount is the checksum for its own quantity and unit
  // price. When qty × unit price disagrees beyond rounding, a digit was
  // mis-recognised (a lost comma turned $5,100.00 into $510,000.00 in
  // testing) — flag the row rather than pricing a number nobody checked.
  const docAmount = line.docAmountUsd;
  const figureMismatch =
    docAmount !== undefined &&
    docAmount > 0 &&
    Math.abs(usdCif - docAmount) > Math.max(1, docAmount * 0.02);

  /* ---- no heading: refuse to invent a rate ---- */
  if (!entry) {
    return {
      id: line.id,
      pos: line.pos,
      line,
      entry: UNCLASSIFIED,
      hs,
      overridden,
      confidence: 0,
      qty: line.qty,
      uom: line.uom,
      unitCifUsd: line.unitCifUsd,
      usdCif,
      idrCif,
      bmMfnRate: 0,
      bmRate: 0,
      bmadRate: 0,
      ppnbmRate: 0,
      ppnRate: PPN_RATE,
      standard: zeroSplit(),
      ftz: zeroSplit(),
      saved: 0,
      deferred: 0,
      payable: 0,
      pph22: 0,
      coverage: 0,
      lartas: "NONE",
      badges: [
        {
          kind: "unclassified",
          label: "No heading assigned",
          detail:
            "Nothing in the register matched this description. Duty is shown as zero because it cannot be computed, not because none is due — assign an HS code before filing.",
        },
      ],
      risk: "HIGH",
      blocked: false,
      unclassified: true,
      rateExact: false,
      figureMismatch: false,
      ftz_exemption_eligible: false,
      isExcise: false,
      isAsset: false,
      hasMasterlist: false,
      fta: { scheme: "—", bmRate: 0, deltaVsMfn: 0 },
    };
  }

  /* ---- rates ---- */
  const mfn = entry.bmMfn;
  const scheme = schemeFor(line.origin);
  const scheduled = scheme ? entry.fta[scheme.scheme] : undefined;
  const hasPreference = scheduled !== undefined && scheduled < mfn;
  const appliedBm = hasPreference ? scheduled : mfn;
  const bmadRate =
    entry.bmad && entry.adOrigins?.includes(line.origin.toUpperCase()) ? entry.bmad : 0;
  const ppnbmRate = entry.ppnbm;
  const isExcise = isExciseGood(entry);

  /* ---- facility coverage ---- */
  // Excise goods are excluded from the suspension. Otherwise the zone covers the
  // line while the goods sit in the enclave; a release or a direct import does not.
  let coverage = 0;
  if (!isExcise) {
    if (treatment === "suspended") coverage = hasMasterlist ? 1 : line.ftzCoverage;
    else coverage = 0;
  }

  /* ---- duty build-up (Indonesian customs order of operations) ---- */
  const bm = Math.round(idrCif * appliedBm);
  const bmMfn = Math.round(idrCif * mfn);
  const bmad = Math.round(idrCif * bmadRate);
  const ppnbm = Math.round((idrCif + bm) * ppnbmRate);
  const nilaiImpor = idrCif + bm + bmad + ppnbm;
  const ppn = Math.round(nilaiImpor * PPN_RATE);
  const pph22 = Math.round((idrCif + bm) * PPH22_RATE);

  const standard: DutySplit = { bm, bmad, ppnbm, ppn, total: bm + bmad + ppnbm + ppn };
  const residual = 1 - coverage;
  const ftz: DutySplit = {
    bm: Math.round(bm * residual),
    bmad: Math.round(bmad * residual),
    ppnbm: Math.round(ppnbm * residual),
    ppn: Math.round(ppn * residual),
    total: Math.round(standard.total * residual),
  };

  const saved = standard.total - ftz.total;
  const deferred = treatment === "suspended" ? saved : 0;
  // A preference only saves money where duty is actually being levied.
  const prefSaved = residual > 0 ? Math.max(0, bmMfn - bm) : 0;

  const risk: RiskTier =
    entry.risk === "HIGH" || bmadRate > 0 || entry.lartas === "PRE_BORDER"
      ? "HIGH"
      : residual > 0 || entry.lartas === "POST_BORDER"
        ? "MEDIUM"
        : entry.risk;

  const badges = buildBadges(entry, coverage, bmadRate, scheme, hasPreference);
  if (figureMismatch) {
    badges.push({
      kind: "figure",
      label: "Check figures",
      detail: `Quantity × unit price gives ${fmtUsd(usdCif)} but the document prints ${fmtUsd(docAmount!)}. One of the recognised numbers is likely wrong — edit the quantity or unit price in the line row to correct it.`,
    });
  }

  return {
    id: line.id,
    pos: line.pos,
    line,
    entry,
    hs,
    overridden,
    confidence: overridden ? Math.min(line.confidence, 0.55) : line.confidence,
    qty: line.qty,
    uom: line.uom,
    unitCifUsd: line.unitCifUsd,
    usdCif,
    idrCif,
    bmMfnRate: mfn,
    bmRate: appliedBm,
    pref:
      hasPreference && scheme
        ? {
            scheme: `${scheme.label} ${scheme.form}`,
            form: scheme.form,
            rate: scheduled,
            saved: prefSaved,
          }
        : undefined,
    bmadRate,
    ppnbmRate,
    ppnRate: PPN_RATE,
    standard,
    ftz,
    saved,
    deferred,
    payable: ftz.total + Math.round(pph22 * residual),
    pph22: Math.round(pph22 * residual),
    coverage,
    lartas: entry.lartas,
    badges,
    risk,
    blocked: entry.lartas === "PRE_BORDER",
    unclassified: false,
    rateExact: entry.bmExact,
    figureMismatch,
    ftz_exemption_eligible: !isExcise,
    isExcise,
    isAsset: entry.hs.startsWith("9401") || entry.hs.startsWith("9403"),
    hasMasterlist,
    fta: {
      scheme: scheme ? `${scheme.label} ${scheme.form}` : "MFN",
      bmRate: appliedBm,
      deltaVsMfn: (mfn - appliedBm) * idrCif,
    },
  };
}

/** Collapse the candidate list to one row per code, best confidence first. */
export function hsOptions(line: InvoiceLine): (HsCandidate & { registered: boolean })[] {
  const best = new Map<string, HsCandidate & { registered: boolean }>();

  const consider = (hs: string, confidence: number, note: string) => {
    const prev = best.get(hs);
    if (!prev) {
      best.set(hs, { hs, confidence, note, registered: Boolean(findTariff(hs)) });
    } else {
      prev.confidence = Math.max(prev.confidence, confidence);
      prev.note = `${prev.note} · ${note}`;
    }
  };

  consider(line.hs, line.confidence, "Selected heading");
  for (const c of line.candidates) consider(c.hs, c.confidence, c.note);

  return [...best.values()].sort((a, b) => b.confidence - a.confidence);
}

export function computeTotals(calcs: LineCalc[], selected: Set<string>): DeclarationTotals {
  const all = calcs.reduce(
    (acc, c) => ({ usd: acc.usd + c.usdCif, idr: acc.idr + c.idrCif }),
    { usd: 0, idr: 0 },
  );

  let standard = zeroSplit();
  let ftz = zeroSplit();
  let pph22 = 0;
  let highRisk = 0;
  let blocked = 0;
  let unclassified = 0;
  let rateUncertain = 0;
  let confSum = 0;
  let picked = 0;
  let selUsd = 0;
  let selIdr = 0;
  let saved = 0;
  let deferred = 0;
  let prefSaved = 0;
  let mfnDuty = 0;

  for (const c of calcs) {
    if (c.unclassified) unclassified += 1;
    if (!c.unclassified && !c.rateExact) rateUncertain += 1;
    if (c.lartas !== "NONE" || c.risk === "HIGH") highRisk += 1;
    if (c.blocked) blocked += 1;
    if (!selected.has(c.id)) continue;
    picked += 1;
    selUsd += c.usdCif;
    selIdr += c.idrCif;
    standard = addSplit(standard, c.standard);
    ftz = addSplit(ftz, c.ftz);
    pph22 += c.pph22;
    saved += c.saved;
    deferred += c.deferred;
    prefSaved += c.pref?.saved ?? 0;
    mfnDuty += Math.round(c.idrCif * c.bmMfnRate);
    confSum += c.confidence;
  }

  return {
    lines: calcs.length,
    selected: picked,
    usdCif: all.usd,
    idrCif: all.idr,
    selUsdCif: selUsd,
    selIdrCif: selIdr,
    standard,
    ftz,
    saved,
    deferred,
    prefSaved,
    mfnDuty,
    payable: ftz.total + pph22,
    pph22,
    highRisk,
    blocked,
    unclassified,
    rateUncertain,
    avgConfidence: picked > 0 ? confSum / picked : 0,
  };
}

export interface Declaration {
  /** Null when no document has been loaded — the terminal boots empty. */
  invoice: DemoInvoice | null;
  calcs: LineCalc[];
  totals: DeclarationTotals;
}

export function buildDeclaration(
  invoice: DemoInvoice | null,
  overrides: Overrides,
  selected: Set<string>,
  destinationId = "btm-batuampar",
  masterlists: Record<string, boolean> = {},
): Declaration {
  if (!invoice) {
    return { invoice: null, calcs: [], totals: computeTotals([], new Set()) };
  }
  const dest = getDestination(destinationId);
  const calcs = invoice.lines.map((l) =>
    computeLine(l, overrides[l.id], {
      treatment: dest.treatment,
      hasMasterlist: Boolean(masterlists[l.id]),
    }),
  );
  return { invoice, calcs, totals: computeTotals(calcs, selected) };
}

/** Every heading the register knows — used by the manual HS picker. */
export function registeredHeadings() {
  return TARIFF;
}
