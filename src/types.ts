/**
 * PortSync FTZ domain model.
 * All money is IDR unless a field name says `Usd`. Rates are decimals (0.1 = 10%).
 */

export type LartasLevel = "NONE" | "POST_BORDER" | "PRE_BORDER";

export type RiskTier = "LOW" | "MEDIUM" | "HIGH";

export type Uom = "PCE" | "KGM" | "SET" | "MTR" | "CTN" | "PAK";

export interface PermitRequirement {
  agency: string;
  code: string;
  label: string;
  /** When the permit must exist relative to PIB submission. */
  stage: "pre-border" | "post-border";
}

export interface SniRequirement {
  standard: string;
  scope: string;
}

export interface BtkiEntry {
  /** Dotted BTKI/AHTN code as printed in Buku Tarif Kepabeanan Indonesia. */
  hs: string;
  /** Code without dots, as CEISA expects (pos BGI key). */
  hsCompact: string;
  titleId: string;
  titleEn: string;
  /** Default statistical unit for this line. */
  uom: Uom;
  /** MFN Bea Masuk. */
  bmMfn: number;
  /** Preferential rate under ACFTA (Form D) / ATIGA (Form E). */
  bmAcf: number;
  bmAsean: number;
  /** Barang Kena Pajak tidak mewah rate — 0 for industrial inputs. */
  ppnbm: number;
  /** Bea Masuk Anti Dumping / safeguard, applied only to `adOrigins`. */
  bmad?: number;
  adOrigins?: string[];
  adNote?: string;
  lartas: LartasLevel;
  permits?: PermitRequirement[];
  sni?: SniRequirement;
  /** Minimum local content for downstream ESDM programmes, in percent. */
  tkdnFloorPct?: number;
  risk: RiskTier;
  rationale: string;
}

export interface HsCandidate {
  hs: string;
  confidence: number;
  note: string;
}

export interface InvoiceLine {
  id: string;
  pos: number;
  /** Verbatim string as it appears on the supplier document. */
  raw: string;
  supplierRef?: string;
  qty: number;
  uom: Uom;
  unitCifUsd: number;
  netKg: number;
  origin: string;
  /** HS the classifier chose for this line. */
  hs: string;
  confidence: number;
  candidates: HsCandidate[];
  /** Share of the line covered by the PPFTZ-01 in-zone facility (1 = fully exempt). */
  ftzCoverage: number;
  /** Whether the line is eligible for PPFTZ-01 exemption (false for Excise goods). */
  ftz_exemption_eligible?: boolean;
  /** Set when part of the line is released straight onward to TPBD (mainland). */
  releaseNote?: string;
  /** OCR detection span within the document page, as a fraction of page width. */
  span: { x: number; w: number };
  ocrNote?: string;
}

export interface Party {
  name: string;
  addr: string;
  country: string;
  taxId: string;
  nib?: string;
  api?: string;
}

export interface DemoInvoice {
  id: string;
  label: string;
  headline: string;
  fileName: string;
  kind: "PDF" | "PNG";
  pages: number;
  sizeKb: number;
  docNo: string;
  docDate: string;
  currency: "USD";
  supplier: Party;
  consignee: Party;
  freight: {
    incoterm: string;
    portOfLoading: string;
    portOfDischarge: string;
    vessel: string;
    voyage: string;
    container: string;
    manifest: string;
    eta: string;
    freightUsd: number;
    insuranceUsd: number;
  };
  lines: InvoiceLine[];
  footnotes: string[];
}

/* ---------- computed ---------- */

export interface DutySplit {
  bm: number;
  bmad: number;
  ppnbm: number;
  ppn: number;
  total: number;
}

export type BadgeKind = "facility" | "lartas-post" | "lartas-pre" | "sni" | "ad" | "tkdn" | "tpbd" | "excise" | "asset";

export interface RegulatoryBadge {
  kind: BadgeKind;
  label: string;
  detail: string;
}

export interface LineCalc {
  id: string;
  pos: number;
  line: InvoiceLine;
  entry: BtkiEntry;
  /** Effective HS after any broker override. */
  hs: string;
  overridden: boolean;
  confidence: number;
  qty: number;
  uom: Uom;
  unitCifUsd: number;
  usdCif: number;
  idrCif: number;
  /** Applicable MFN BM rate after origin screening. */
  bmRate: number;
  bmadRate: number;
  ppnbmRate: number;
  ppnRate: number;
  standard: DutySplit;
  ftz: DutySplit;
  /** Duty & tax avoided by the FTZ facility. */
  saved: number;
  /** Still owed after the facility. */
  payable: number;
  pph22: number;
  coverage: number;
  lartas: LartasLevel;
  badges: RegulatoryBadge[];
  risk: RiskTier;
  blocked: boolean;
  /** Compliance rule flags */
  ftz_exemption_eligible: boolean;
  isExcise: boolean;
  isAsset: boolean;
  hasMasterlist?: boolean;
  /** Preferential option the agent identified but did not apply to the headline comparator. */
  fta: { scheme: string; bmRate: number; deltaVsMfn: number };
}

export interface DeclarationTotals {
  lines: number;
  selected: number;
  /** Whole-document value, every parsed line. */
  usdCif: number;
  idrCif: number;
  /** Value of the lines selected for filing. */
  selUsdCif: number;
  selIdrCif: number;
  standard: DutySplit;
  ftz: DutySplit;
  saved: number;
  payable: number;
  pph22: number;
  highRisk: number;
  blocked: number;
  avgConfidence: number;
}
