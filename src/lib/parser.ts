import type { DemoInvoice, HsCandidate, InvoiceLine, Uom } from "../types";
import { TARIFF, type TariffEntry } from "../data/tariff";

/**
 * Reading a supplier document.
 *
 * Two jobs, kept separate:
 *   1. Classification — score the description against the tariff register.
 *   2. Extraction  — pull quantities and prices out of the text.
 *
 * Neither invents anything. If a price is missing the line says so; if no heading
 * scores high enough the line is left unclassified. The previous build filled
 * those gaps with a default quantity, a default price, a default origin and a
 * confident-looking HS code, which is exactly how a declaration ends up wrong in
 * a way nobody notices until the goods are held.
 */

/* ================================================================== */
/* Classification                                                      */
/* ================================================================== */

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "are", "was", "were",
  "has", "have", "had", "not", "but", "all", "any", "can", "will", "its", "his",
  "her", "our", "their", "other", "than", "into", "per", "each", "such", "type",
  "kind", "used", "use", "made", "including", "include", "whether", "thereof",
  "of", "to", "in", "on", "at", "by", "or", "as", "an", "a", "is", "be", "no",
  "pcs", "set", "unit", "units", "kg", "kgs", "mtr", "new", "total", "item",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/** Pre-computed vocabulary per register entry, so scoring stays cheap. */
interface Indexed {
  entry: TariffEntry;
  /** Phrase → weight. Key phrases outrank loose title words. */
  terms: Map<string, number>;
  tokenCount: number;
}

const INDEX: Indexed[] = TARIFF.map((entry) => {
  const terms = new Map<string, number>();
  for (const key of entry.keys) {
    terms.set(key.toLowerCase(), 4);
  }
  for (const w of words(entry.titleEn)) {
    if (!terms.has(w)) terms.set(w, 1.2);
  }
  // Indonesian title words help when the invoice is written in Bahasa.
  for (const w of words(entry.titleId)) {
    if (!terms.has(w)) terms.set(w, 0.8);
  }
  return { entry, terms, tokenCount: terms.size };
});

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Phrase presence on word boundaries — "iron" must not fire inside "environment". */
function containsPhrase(haystack: string, phrase: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escapeRe(phrase)}([^a-z0-9]|$)`, "i").test(haystack);
}

export interface Classification {
  hs: string;
  confidence: number;
  note: string;
  candidates: HsCandidate[];
  /** True when nothing scored well enough to name a heading. */
  unclassified: boolean;
}

/** Score floor below which we refuse to name a heading. */
const MIN_SCORE = 2;

export function classify(description: string): Classification {
  const text = description.toLowerCase();
  const scored: { entry: TariffEntry; score: number; hits: string[] }[] = [];

  for (const item of INDEX) {
    let score = 0;
    const hits: string[] = [];
    for (const [term, weight] of item.terms) {
      if (containsPhrase(text, term)) {
        score += weight;
        hits.push(term);
      }
    }
    if (score > 0) scored.push({ entry: item.entry, score, hits });
  }

  scored.sort((a, b) => b.score - a.score);

  if (!scored.length || scored[0]!.score < MIN_SCORE) {
    return {
      hs: "",
      confidence: 0,
      note:
        "No heading in the register matches this description closely enough. Classify it by hand before filing.",
      candidates: scored.slice(0, 3).map((s) => ({
        hs: s.entry.hs,
        confidence: confidenceFor(s.score),
        note: `Weak match on ${s.hits.slice(0, 4).join(", ")}`,
      })),
      unclassified: true,
    };
  }

  const best = scored[0]!;
  const runnerUp = scored[1];
  let confidence = confidenceFor(best.score);

  // Two headings scoring within 20 % of each other means the description does not
  // separate them. Say so rather than presenting a coin flip as an answer.
  if (runnerUp && runnerUp.score >= best.score * 0.8) {
    confidence = Math.min(confidence, 0.55);
  }

  const candidates: HsCandidate[] = scored.slice(0, 3).map((s, i) => ({
    hs: s.entry.hs,
    confidence: i === 0 ? confidence : confidenceFor(s.score) * 0.7,
    note: `${s.entry.titleEn}${i === 0 ? "" : " — alternative"} (matched: ${s.hits
      .slice(0, 4)
      .join(", ")})`,
  }));

  return {
    hs: best.entry.hs,
    confidence,
    note: best.entry.titleEn,
    candidates,
    unclassified: false,
  };
}

/** Saturating map from match weight to a confidence that means something. */
function confidenceFor(score: number): number {
  return Math.round((1 - Math.exp(-score / 3)) * 100) / 100;
}

/* ================================================================== */
/* Numbers and units                                                   */
/* ================================================================== */

interface NumToken {
  value: number;
  start: number;
  end: number;
}

/** Parse "3,860.00", "3.860,00" and "3860" to the same number. */
function toNumber(raw: string): number {
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  if (hasComma && hasDot) {
    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");
    // Whichever separator comes last is the decimal point.
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    return Number(raw.split(thousands).join("").replace(decimal, "."));
  }
  if (hasComma) {
    const parts = raw.split(",");
    // "1,250" is a thousand separator; "12,5" is a decimal comma.
    if (parts.length === 2 && parts[1]!.length === 3) return Number(parts.join(""));
    return Number(raw.replace(",", "."));
  }
  if (hasDot) {
    const parts = raw.split(".");
    if (parts.length === 2 && parts[1]!.length === 3 && parts[0]!.length <= 3) {
      return Number(parts.join(""));
    }
  }
  return Number(raw);
}

function numbersIn(line: string): NumToken[] {
  const out: NumToken[] = [];
  const re = /\d[\d.,]*\d|\d/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const raw = m[0].replace(/[.,]$/, "");
    if (!raw) continue;
    const value = toNumber(raw);
    if (!Number.isFinite(value)) continue;
    out.push({ value, start: m.index, end: m.index + raw.length });
  }
  return out;
}

export function parseUom(str: string): Uom {
  const u = str.toUpperCase().trim();
  if (u.startsWith("KG")) return "KGM";
  if (u.startsWith("SET")) return "SET";
  if (u.startsWith("MTR")) return "MTR";
  if (u === "M2" || u === "SQM") return "M2";
  if (u.startsWith("LTR") || u.startsWith("LITRE")) return "LTR";
  if (u.startsWith("CTN")) return "CTN";
  if (u.startsWith("BOX")) return "CTN";
  if (u.startsWith("PAK") || u.startsWith("PACK")) return "PAK";
  return "PCE";
}

/* ================================================================== */
/* Origin                                                              */
/* ================================================================== */

const COUNTRY_WORDS: Record<string, string> = {
  china: "CN", chinese: "CN", prc: "CN", "p.r. china": "CN",
  singapore: "SG",
  malaysia: "MY",
  japan: "JP",
  korea: "KR", "south korea": "KR", "republic of korea": "KR",
  taiwan: "TW",
  india: "IN",
  vietnam: "VN", "viet nam": "VN",
  thailand: "TH",
  indonesia: "ID",
  germany: "DE",
  "united states": "US", usa: "US", america: "US",
  italy: "IT",
  france: "FR",
  netherlands: "NL",
  "united kingdom": "GB", uk: "GB", britain: "GB",
  australia: "AU",
  turkey: "TR",
  hongkong: "HK", "hong kong": "HK",
};

/**
 * Origin decides which certificate applies, so it must be read from the document
 * rather than assumed. Returns null when the document does not say — the caller
 * then shows "not stated" instead of defaulting to Singapore.
 */
export function detectOrigin(text: string): { code: string; evidence: string } | null {
  const explicit = text.match(
    /(?:country\s+of\s+origin|origin|made\s+in|manufactured\s+in|produced\s+in|country\s+of\s+manufacture)\s*[:#-]?\s*([A-Za-z][A-Za-z.\s]{1,30})/i,
  );
  if (explicit) {
    const raw = explicit[1]!.trim().toLowerCase();
    for (const [name, code] of Object.entries(COUNTRY_WORDS)) {
      if (raw.startsWith(name)) return { code, evidence: `document states "${explicit[1]!.trim()}"` };
    }
    const iso = raw.match(/^([a-z]{2})\b/);
    if (iso && iso[1]!.length === 2) {
      const up = iso[1]!.toUpperCase();
      if (Object.values(COUNTRY_WORDS).includes(up)) {
        return { code: up, evidence: `document states "${explicit[1]!.trim()}"` };
      }
    }
  }

  // Fall back to the supplier's address line, which is weaker evidence.
  const head = text.slice(0, 1200).toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_WORDS)) {
    if (code === "ID") continue;
    if (containsPhrase(head, name)) {
      return { code, evidence: `supplier address mentions ${name}` };
    }
  }
  return null;
}

/* ================================================================== */
/* Line items                                                          */
/* ================================================================== */

interface ParsedItem {
  raw: string;
  qty: number;
  uom: Uom;
  unitPrice: number;
  /** Set when the document carried no usable price for the line. */
  priceMissing?: boolean;
  amount?: number;
}

const SKIP_LINE =
  /^(?:total|subtotal|sub-total|freight|insurance|discount|payment|terms|bank|beneficiary|swift|signature|authori[sz]ed|declaration|packing|page\s+\d|invoice\s+no|date\b)/i;

/** Wrapped column-header fragments ("TOTAL CIF", "(USD)") directly under the header row. */
const HEADER_CONT = /^(?:total\b|cif\b|\(?\s*usd\s*\)?)$/i;

const UOM_ALL_RE =
  /\b(PCS|PCE|PC|SETS|SET|UNITS|UNIT|UNT|KGM|KGS|KG|MTR|MTRS|M2|SQM|LTR|LTRS|LITRE|CTN|CTNS|BOX|PAK|PACK|ROLL|BAG|DRUM|PAIL)\b/gi;

/**
 * One row of an item table. Tolerant about column order but strict about
 * evidence: a line only becomes an item when it carries a quantity and a unit.
 *
 * A wrapped table row often carries several quantity+unit pairs — "1,420 kg
 * 24 PCE $2,380.00 $57,120.00" pairs gross weight and ordered quantity. Each
 * candidate pair is tried and the one whose arithmetic reconciles
 * (qty × unit price ≈ amount) wins; a lone pair falls back to the first UOM,
 * which is what single-column invoices have always parsed as.
 */
export function parseItemLine(line: string): ParsedItem | null {
  if (line.length < 8 || SKIP_LINE.test(line)) return null;

  let fallback: ParsedItem | null = null;

  for (const m of line.matchAll(UOM_ALL_RE)) {
    const uom = parseUom(m[1]!);

    const before = numbersIn(line.slice(0, m.index));
    if (!before.length) continue;

    // The quantity is the number closest to the unit token.
    const qtyToken = before[before.length - 1]!;
    const qty = qtyToken.value;
    if (!(qty > 0) || qty > 1_000_000) continue;

    const after = numbersIn(line.slice(m.index + m[0].length));

    let unitPrice = 0;
    let amount: number | undefined;
    let priceMissing = false;

    if (after.length >= 2) {
      unitPrice = after[0]!.value;
      amount = after[after.length - 1]!.value;
    } else if (after.length === 1) {
      // A single trailing number is only a price when it is money-formatted.
      // A bare "1500" in "100 m drum | Rated 1500 V DC" is prose, and dividing
      // it out manufactured a phantom row on wrapped descriptions.
      if (!/\d[.,]\d{2}\b/.test(line.slice(m.index + m[0].length))) continue;
      amount = after[0]!.value;
      unitPrice = amount / qty;
    } else {
      priceMissing = true;
    }

    // A line whose only number is a part code is not an item row.
    if (!priceMissing && !(unitPrice > 0)) continue;

    let desc = line.slice(0, qtyToken.start).trim();
    // Drop a leading line number ("1", "01", "1.").
    desc = desc.replace(/^0?\d{1,3}[.)\s]+/, "").trim();
    // A picked-later pair leaves the earlier weight pair in the description.
    desc = desc.replace(
      /\s+\d[\d.,]*\s*(?:kgm|kgs|kg|mtrs|mtr|pcs|pce|pc|sets|set|ctns|ctn|box|roll|bag|drum|pail|units?|unt|ltr|litre|m2|sqm)\s*$/i,
      "",
    ).trim();
    if (desc.length < 4) continue;

    const item: ParsedItem = {
      raw: desc,
      qty,
      uom,
      unitPrice: Math.round(unitPrice * 100) / 100,
      priceMissing,
      amount,
    };

    // The raw pair reconciling is the strongest possible evidence that this is
    // the qty/UNIT column and not a neighbouring weight or pack column.
    if (
      !priceMissing &&
      after.length >= 2 &&
      Math.abs(after[0]!.value * qty - (amount ?? 0)) <= Math.max(1, (amount ?? 0) * 0.05)
    ) {
      return item;
    }
    if (!fallback) fallback = item;
  }

  return fallback;
}

function buildLine(pos: number, item: ParsedItem, origin: string): InvoiceLine {
  const cls = classify(item.raw);
  return {
    id: `doc-line-${pos}`,
    pos,
    raw: item.raw,
    qty: item.qty,
    uom: item.uom,
    unitCifUsd: item.unitPrice,
    netKg: 0,
    origin,
    hs: cls.hs,
    confidence: cls.confidence,
    candidates: cls.candidates,
    ftzCoverage: 1,
    ftz_exemption_eligible: true,
    span: { x: 0.045, w: 0.6 },
    ocrNote: cls.unclassified
      ? "No heading matched — classify by hand."
      : item.priceMissing
        ? "No unit price was readable on this line."
        : undefined,
  };
}

/* ================================================================== */
/* Document                                                            */
/* ================================================================== */

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/**
 * Normalise a date into YYYY-MM-DD without passing through a timezone.
 * `new Date("14 October 2026")` is UTC midnight and renders as the 13th for
 * anyone east of Greenwich, which silently shifts the declaration date.
 */
function toIsoDate(raw: string): string | null {
  const pad = (n: string) => n.padStart(2, "0");
  const named = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (named) {
    const m = MONTH_NAMES.indexOf(named[2]!.toLowerCase());
    if (m >= 0) return `${named[3]}-${pad(String(m + 1))}-${pad(named[1]!)}`;
  }
  const ymd = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${pad(ymd[2]!)}-${pad(ymd[3]!)}`;
  const dmy = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${pad(dmy[2]!)}-${pad(dmy[1]!)}`;
  return null;
}

export interface SourceMeta {
  fileName: string;
  sizeKb: number;
  pages: number;
  kind: "PDF" | "PNG";
  /** How the text was obtained, so the document can say so on its face. */
  method: "text-layer" | "ocr" | "mixed";
}

export function parseRawInvoice(text: string, meta: SourceMeta): DemoInvoice | null {
  if (!text || text.trim().length < 20) return null;

  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim());

  /* ---- document identity ---- */
  const docNoMatch = text.match(
    /(?:Invoice\s*(?:No|Number|#)|Inv\s*No|Doc\s*No|Bill\s*No|INV\s*REF)[\s:.]*([A-Za-z0-9][A-Za-z0-9\-/]{2,})/i,
  );
  const docNo = docNoMatch?.[1] ?? "";

  let docDate = "";
  const dateMatch = text.match(
    /(?:Date\s*of\s*Issue|Invoice\s*Date|Date)[\s:]*(\d{1,2}\s+[A-Za-z]+\s+20\d{2}|20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]20\d{2})/i,
  );
  if (dateMatch) docDate = toIsoDate(dateMatch[1]!) ?? "";

  /* ---- parties ---- */
  let supplierName = "";
  for (const line of lines.slice(0, 25)) {
    if (
      /(?:PTE\.?\s*LTD|LTD\.?|LIMITED|INC\.?|CORP\.?|GMBH|CO\.,?\s*LTD|SDN\.?\s*BHD|CO\.?,?\s*LTD)/i.test(line) &&
      line.length < 90 &&
      !/^(?:consignee|to|deliver)/i.test(line)
    ) {
      supplierName = line.replace(/^(?:supplier|vendor|from|shipper|exporter|seller)[\s:]*/i, "").trim();
      break;
    }
  }

  let consigneeName = "";
  const consigneeMatch = text.match(
    /(?:Consignee|Importer|Deliver\s*to|Buyer)\s*[:.]?\s*(PT[.\s][^\n]{3,70})/i,
  );
  if (consigneeMatch) {
    consigneeName = consigneeMatch[1]!.trim();
  } else {
    for (const line of lines.slice(0, 35)) {
      if (/^PT[.\s][A-Z][A-Za-z\s.&]{3,60}$/.test(line)) {
        consigneeName = line.trim();
        break;
      }
    }
  }

  const origin = detectOrigin(text);

  /* ---- line items ---- */
  const items: ParsedItem[] = [];

  // Locate the item table: the header row names a description column and a
  // quantity column. Everything between it and the totals belongs to items.
  let headerAt = -1;
  for (let i = 0; i < Math.min(lines.length, 60); i += 1) {
    const l = lines[i]!.toLowerCase();
    if (/(description|goods|item|product)/.test(l) && /(qty|quantity|unit)/.test(l)) {
      headerAt = i;
      break;
    }
  }

  const start = headerAt >= 0 ? headerAt + 1 : 0;
  // Table rows rarely survive text extraction as single lines: a wrapped
  // description, a part number and the figures land on separate baselines.
  // Lines accumulate into a band until it parses as a complete row.
  let pending: string[] = [];

  for (let i = start; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (!line) continue;

    // A totals line without a figure is a wrapped header ("TOTAL CIF"), not
    // the end of the table — breaking on it found zero items on invoices
    // whose column header spans two baselines.
    if (/^(?:total|subtotal|sub-total|grand\s*total)/i.test(line) && (/\d/.test(line) || items.length > 0)) {
      pending = [];
      break;
    }

    const joined = pending.length ? `${pending.join(" ")} ${line}`.replace(/\s+/g, " ") : line;
    const parsed = parseItemLine(joined);

    if (parsed && !parsed.priceMissing) {
      // A price-carrying row is complete regardless of how many baselines
      // it was spread across.
      items.push(parsed);
      pending = [];
      continue;
    }

    if (parsed && pending.length === 0) {
      // A priceless single line can still be a row — but when baselines are
      // already pending, the figures may be on the next one, so wait.
      items.push(parsed);
      continue;
    }

    if (
      line.length > 3 &&
      !SKIP_LINE.test(line) &&
      !(items.length === 0 && HEADER_CONT.test(line)) &&
      pending.length < 8
    ) {
      pending.push(line);
    }
  }

  // A final row whose figures never arrived still deserves its lines.
  if (pending.length) {
    const tail = parseItemLine(pending.join(" "));
    if (tail) items.push(tail);
  }

  if (!items.length) return null;

  const originCode = origin?.code ?? "";
  const detected: InvoiceLine[] = items.map((item, i) => buildLine(i + 1, item, originCode));

  const methodNote =
    meta.method === "ocr"
      ? `Read by OCR from ${meta.fileName} — every figure was recognised from pixels, so verify against the original.`
      : meta.method === "mixed"
        ? `Text layer read directly; scanned pages of ${meta.fileName} were read by OCR.`
        : `Text layer read directly from ${meta.fileName}.`;

  const originNote = origin
    ? `Origin read as ${origin.code} (${origin.evidence}).`
    : "Origin is not stated on the document — select it before relying on a preferential rate.";

  return {
    id: `doc-${Math.random().toString(36).slice(2, 8)}`,
    label: `${supplierName || meta.fileName} — ${detected.length} line${detected.length > 1 ? "s" : ""}`,
    headline: `Line items extracted from ${meta.fileName}`,
    fileName: meta.fileName,
    kind: meta.kind,
    pages: meta.pages,
    sizeKb: meta.sizeKb,
    docNo,
    docDate,
    currency: "USD",
    supplier: {
      name: supplierName,
      addr: "",
      country: originCode,
      taxId: "",
    },
    consignee: {
      name: consigneeName,
      addr: "",
      country: "ID",
      taxId: "",
    },
    // Carriage details live on the bill of lading and the manifest, not the
    // invoice. They stay blank rather than being invented.
    freight: {
      incoterm: "",
      portOfLoading: "",
      portOfDischarge: "",
      vessel: "",
      voyage: "",
      container: "",
      manifest: "",
      eta: docDate,
      freightUsd: 0,
      insuranceUsd: 0,
    },
    lines: detected,
    footnotes: [
      methodNote,
      originNote,
      `Classified against ${TARIFF.length} headings in the BTKI 2022 register. Rows below 70% confidence need a human decision.`,
    ],
  };
}
