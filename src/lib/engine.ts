import { BTKI_BY_HS, getEntry } from "../data/btki";
import { PPN_RATE, PPH22_RATE } from "../data/constants";
import { FX } from "./fx";
import type {
  BtkiEntry,
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

export type Regime = "PPFTZ-01" | "PPFTZ-02" | "PPFTZ-03";

export const REGIME_LABELS: Record<Regime, string> = {
  "PPFTZ-01": "PPFTZ-01: Foreign Import to Batam FTZ (0% Duty / PPN Suspended)",
  "PPFTZ-02": "PPFTZ-02: FTZ to FTZ / Bonded Zone Transfer (No Tax)",
  "PPFTZ-03": "PPFTZ-03: Batam to Mainland Indonesia / TLDDP (Standard Duty & PPN Payable)",
};

const ASEAN = new Set(["SG", "MY", "VN", "TH", "PH", "BN", "KH", "MM", "LA", "ID"]);

export function isExciseGood(rawDesc: string, hs: string): boolean {
  const lower = (rawDesc || "").toLowerCase();
  const cleanHs = hs.replace(/\./g, "").slice(0, 4);
  const hasKeyword = /\b(alcohol|ethyl|ethanol|mmea)\b/i.test(lower) ||
    lower.includes("alcohol") || lower.includes("ethyl") || lower.includes("ethanol") || lower.includes("mmea");
  const hasHs = cleanHs === "2207" || cleanHs === "2208" || hs.startsWith("2207") || hs.startsWith("2208");
  return hasKeyword || hasHs;
}

export function isNonProductionAsset(rawDesc: string, hs: string): boolean {
  const lower = (rawDesc || "").toLowerCase();
  const cleanHs = hs.replace(/\./g, "").slice(0, 4);
  const hasKeyword = /\b(chair|desk|sofa|office furniture)\b/i.test(lower) ||
    lower.includes("chair") || lower.includes("desk") || lower.includes("sofa") || lower.includes("office furniture");
  const hasHs = cleanHs === "9401" || cleanHs === "9403" || hs.startsWith("9401") || hs.startsWith("9403");
  return hasKeyword || hasHs;
}

/** Empty split used while a total is being accumulated. */
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

function scaleSplit(s: DutySplit, k: number): DutySplit {
  return {
    bm: s.bm * k,
    bmad: s.bmad * k,
    ppnbm: s.ppnbm * k,
    ppn: s.ppn * k,
    total: s.total * k,
  };
}

/** Which certificate would the broker present, and at what BM rate? */
export function preferentialScheme(origin: string): {
  scheme: string;
  key: "bmMfn" | "bmAcf" | "bmAsean";
} {
  const o = (origin || "").trim().toUpperCase();
  if (o === "JP") return { scheme: "IJEPA (Form IJ) / RCEP", key: "bmAsean" };
  if (o === "CN") return { scheme: "ACFTA (Form E)", key: "bmAcf" };
  if (ASEAN.has(o)) return { scheme: "ATIGA (e-Form D)", key: "bmAsean" };
  return { scheme: "MFN (General)", key: "bmMfn" };
}

function buildBadges(entry: BtkiEntry, line: InvoiceLine, bmadRate: number, coverage: number): RegulatoryBadge[] {
  const out: RegulatoryBadge[] = [];

  if (coverage > 0) {
    out.push({
      kind: "facility",
      label: "FTZ Facility Active",
      detail:
        coverage === 1
          ? "PPFTZ-01 in-zone exemption on 100 % of the line — Bea Masuk, BMAD, PPnBM and PPN not levied while the goods stay in the KPBPB enclave."
          : `PPFTZ-01 covers ${Math.round(coverage * 100)} % of the line; the balance is cleared to TPBD.`,
    });
  }

  if (coverage < 1) {
    out.push({
      kind: "tpbd",
      label: "Partial TPBD Release",
      detail: line.releaseNote ?? `${Math.round((1 - coverage) * 100)} % of the line leaves the zone for the customs area.`,
    });
  }

  if (entry.lartas === "PRE_BORDER") {
    out.push({
      kind: "lartas-pre",
      label: "Lartas Pre-Border",
      detail: `${entry.permits?.map((p) => `${p.agency} ${p.code}`).join(" / ")} — permit number must be keyed into the PIB before submission.`,
    });
  } else if (entry.lartas === "POST_BORDER") {
    out.push({
      kind: "lartas-post",
      label: "Lartas Post-Border",
      detail: `${entry.permits?.map((p) => `${p.agency} ${p.code}`).join(" / ")} — goods may be moved to the storage facility, then reported.`,
    });
  }

  if (entry.sni) {
    out.push({
      kind: "sni",
      label: "SNI Required",
      detail: `${entry.sni.standard} — ${entry.sni.scope}.`,
    });
  }

  if (bmadRate > 0) {
    out.push({
      kind: "ad",
      label: `BMAD ${Math.round(bmadRate * 100)}%`,
      detail: entry.adNote ?? "Trade-remedy duty applies to this origin.",
    });
  }

  if (entry.tkdnFloorPct) {
    out.push({
      kind: "tkdn",
      label: `TKDN ≥ ${entry.tkdnFloorPct}%`,
      detail: "Local-content floor applies when the goods feed an ESDM programme; verify the certificate before the buyer invoice.",
    });
  }

  return out;
}

export function computeLine(
  line: InvoiceLine,
  hsOverride?: string,
  regime: Regime = "PPFTZ-01",
  hasMasterlist = false,
): LineCalc {
  const hs = hsOverride ?? line.hs;
  const entry = getEntry(hs);
  const overridden = hs !== line.hs;
  const usdCif = line.qty * line.unitCifUsd;
  const idrCif = Math.round(usdCif * FX.USD_IDR);

  const isExcise = isExciseGood(line.raw, hs);
  const isAsset = isNonProductionAsset(line.raw, hs);

  // 1. Excise Goods Check (Barang Kena Cukai):
  // If description contains "Alcohol", "Ethyl", "Ethanol", "MMEA" or HS starts with "2207"/"2208"
  // Flag: EXCISE GOOD - BLOCKED FOR PPFTZ-01
  // FTZ Exemption: ftz_exemption_eligible = false, 10% BM + 11% PPN, coverage = 0, blocked = true
  if (isExcise) {
    const bmRate = 0.1;
    const bmadRate = 0;
    const ppnbmRate = 0;
    const ppnRate = PPN_RATE;

    const bm = Math.round(idrCif * bmRate);
    const ppn = Math.round((idrCif + bm) * ppnRate);
    const standard: DutySplit = { bm, bmad: 0, ppnbm: 0, ppn, total: bm + ppn };
    const ftz: DutySplit = standard; // No exemption, fully payable!

    const pref = preferentialScheme(line.origin);
    const badges: RegulatoryBadge[] = [
      {
        kind: "excise",
        label: "EXCISE GOOD - BLOCKED FOR PPFTZ-01",
        detail:
          "Mandatory excise tax notice applies (Cukai MMEA/Etil Alkohol). Ineligible for PPFTZ-01 duty exemption under PP No. 41/2021. Standard 10% BM + 11% PPN fully payable.",
      },
    ];

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
      bmRate,
      bmadRate,
      ppnbmRate,
      ppnRate,
      standard,
      ftz,
      saved: 0,
      payable: standard.total,
      pph22: Math.round((idrCif + bm) * PPH22_RATE),
      coverage: 0,
      lartas: "PRE_BORDER",
      badges,
      risk: "HIGH",
      blocked: true,
      ftz_exemption_eligible: false,
      isExcise: true,
      isAsset: false,
      hasMasterlist: false,
      fta: {
        scheme: pref.scheme,
        bmRate: bmRate,
        deltaVsMfn: 0,
      },
    };
  }

  // 2. Non-Production Asset Check (Office Furniture / Consumer Assets):
  // If description contains "Chair", "Desk", "Sofa", "Office Furniture" or HS starts with "9401"/"9403"
  // Flag: Non-Production Asset (Restricted Exemption)
  // Payable duty: 15% BM + 11% PPN unless an explicit BP Batam Masterlist is selected
  if (isAsset) {
    const bmRate = 0.15;
    const bmadRate = 0;
    const ppnbmRate = 0;
    const ppnRate = PPN_RATE;

    const bm = Math.round(idrCif * bmRate);
    const ppn = Math.round((idrCif + bm) * ppnRate);
    const standard: DutySplit = { bm, bmad: 0, ppnbm: 0, ppn, total: bm + ppn };

    const effectiveCoverage = hasMasterlist ? (regime === "PPFTZ-03" ? 0 : 1) : 0;
    const residual = 1 - effectiveCoverage;
    const ftz = scaleSplit(standard, residual);

    const pref = preferentialScheme(line.origin);
    const badges: RegulatoryBadge[] = hasMasterlist
      ? [
          {
            kind: "facility",
            label: "BP Batam Masterlist Active",
            detail: "Approved BP Batam Masterlist attached — 100% duty & PPN suspended under production asset scheme.",
          },
        ]
      : [
          {
            kind: "asset",
            label: "Non-Production Asset (Restricted Exemption)",
            detail:
              "Office furniture / non-production asset. Restricted FTZ exemption — subject to 15% BM + 11% PPN unless an explicit BP Batam Masterlist is selected.",
          },
        ];

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
      bmRate,
      bmadRate,
      ppnbmRate,
      ppnRate,
      standard,
      ftz,
      saved: standard.total - ftz.total,
      payable: ftz.total,
      pph22: Math.round((idrCif + bm) * residual * PPH22_RATE),
      coverage: effectiveCoverage,
      lartas: "NONE",
      badges,
      risk: hasMasterlist ? "LOW" : "MEDIUM",
      blocked: false,
      ftz_exemption_eligible: hasMasterlist,
      isExcise: false,
      isAsset: true,
      hasMasterlist,
      fta: {
        scheme: pref.scheme,
        bmRate: pref.key === "bmMfn" ? bmRate : 0.05,
        deltaVsMfn: (bmRate - (pref.key === "bmMfn" ? bmRate : 0.05)) * idrCif,
      },
    };
  }

  // 3. Standard In-Zone Industrial Goods (PPFTZ-01 Facility)
  const effectiveCoverage =
    regime === "PPFTZ-01" ? line.ftzCoverage : regime === "PPFTZ-02" ? 1 : 0;

  const bmRate = entry.bmMfn;
  const bmadRate = entry.bmad && entry.adOrigins?.includes(line.origin) ? entry.bmad : 0;
  const ppnbmRate = entry.ppnbm;
  const ppnRate = PPN_RATE;

  // Standard Indonesian Customs Formula:
  // BM & BMAD on CIF; PPN = 11% × [CIF + BM + BMAD]; (PPnBM excluded per spec)
  const bm = Math.round(idrCif * bmRate);
  const bmad = Math.round(idrCif * bmadRate);
  const nilaiImpor = idrCif + bm + bmad;
  const ppnbm = 0;
  const ppn = Math.round(nilaiImpor * ppnRate);

  const standard: DutySplit = { bm, bmad, ppnbm, ppn, total: bm + bmad + ppn };
  const residual = 1 - effectiveCoverage;
  const ftz = scaleSplit(standard, residual);

  const pref = preferentialScheme(line.origin);
  const prefRate = entry[pref.key];

  const escalated = residual > 0 || bmadRate > 0;
  const risk: RiskTier = entry.risk === "HIGH" ? "HIGH" : escalated ? "MEDIUM" : entry.risk;

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
    bmRate,
    bmadRate,
    ppnbmRate,
    ppnRate,
    standard,
    ftz,
    saved: standard.total - ftz.total,
    payable: ftz.total,
    pph22: Math.round(nilaiImpor * residual * PPH22_RATE),
    coverage: effectiveCoverage,
    lartas: entry.lartas,
    badges: buildBadges(entry, line, bmadRate, effectiveCoverage),
    risk,
    blocked: entry.lartas === "PRE_BORDER",
    ftz_exemption_eligible: true,
    isExcise: false,
    isAsset: false,
    hasMasterlist: false,
    fta: {
      scheme: pref.scheme,
      bmRate: prefRate,
      deltaVsMfn: (bmRate - prefRate) * idrCif,
    },
  };
}

/** Collapse the candidate list to one row per code, best confidence first. */
export function hsOptions(line: InvoiceLine): (HsCandidate & { registered: boolean })[] {
  const best = new Map<string, HsCandidate & { registered: boolean }>();

  const consider = (hs: string, confidence: number, note: string) => {
    const prev = best.get(hs);
    if (!prev) {
      best.set(hs, { hs, confidence, note, registered: Boolean(BTKI_BY_HS[hs]) });
    } else {
      prev.confidence = Math.max(prev.confidence, confidence);
      prev.note = `${prev.note} · ${note}`;
    }
  };

  consider(line.hs, line.confidence, "Agent top pick");
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
  let confSum = 0;
  let picked = 0;
  let selUsd = 0;
  let selIdr = 0;

  for (const c of calcs) {
    if (c.lartas !== "NONE" || c.risk === "HIGH") highRisk += 1;
    if (c.blocked) blocked += 1;
    if (!selected.has(c.id)) continue;
    picked += 1;
    selUsd += c.usdCif;
    selIdr += c.idrCif;
    standard = addSplit(standard, c.standard);
    ftz = addSplit(ftz, c.ftz);
    pph22 += c.pph22;
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
    saved: standard.total - ftz.total,
    payable: ftz.total,
    pph22,
    highRisk,
    blocked,
    avgConfidence: picked > 0 ? confSum / picked : 0,
  };
}

export interface Declaration {
  invoice: DemoInvoice;
  calcs: LineCalc[];
  totals: DeclarationTotals;
}

export function buildDeclaration(
  invoice: DemoInvoice,
  overrides: Overrides,
  selected: Set<string>,
  regime: Regime = "PPFTZ-01",
  masterlists: Record<string, boolean> = {},
): Declaration {
  const calcs = invoice.lines.map((l) => computeLine(l, overrides[l.id], regime, Boolean(masterlists[l.id])));
  return { invoice, calcs, totals: computeTotals(calcs, selected) };
}
