/**
 * Provenance registry.
 *
 * Every number the terminal shows has to be traceable to one of these records.
 * The `status` field is the honest part: only some of this is published data.
 *   published — retrieved from a named public source, dated
 *   modelled  — a rule this build applies; plausible, but not read from a schedule
 *   derived   — computed by our own code from the above
 *   local     — runs on the device, no external source
 */

export type SourceStatus = "published" | "modelled" | "derived" | "local";

export type SourceGroup =
  | "Duty rates"
  | "Classification"
  | "Facility and procedure"
  | "Tax computation"
  | "Document reading";

export interface SourceRecord {
  id: string;
  name: string;
  publisher: string;
  group: SourceGroup;
  status: SourceStatus;
  /** What this feeds, in the order the user meets it. */
  feeds: string;
  /** Exact reference: API endpoint, instrument number, or module. */
  reference?: string;
  url?: string;
  /** When the data was pulled, for published sources. */
  retrieved?: string;
  /** How the app actually uses it. */
  method: string;
  /** What it does not tell you. Never empty — every source has a blind spot. */
  limits: string;
}

export const SOURCES: SourceRecord[] = [
  {
    id: "wits",
    name: "WITS / TRAINS — applied MFN tariff",
    publisher: "World Bank, on data reported by Directorate General of Customs (Indonesia)",
    group: "Duty rates",
    status: "published",
    feeds: "Bea Masuk (MFN) for each of the subheadings in the register",
    reference:
      "SDMX V21 · /TRN/reporter/360/partner/000/product/{HS6}/year/2022/datatype/reported · reporter 360 = Indonesia, partner 000 = MFN, datatype reported = applied (not bound) rate",
    url: "https://wits.worldbank.org/",
    retrieved: "2026-11-01",
    method:
      "A build script requests every HS6 in the register, parses OBS_VALUE / MIN_RATE / MAX_RATE, and writes src/data/tariff-mfn.json. The app reads that file at build time — no request is made in the browser.",
    limits:
      "HS6 only. An eight-digit BTKI line can sit at a different rate from its six-digit parent; where MIN_RATE and MAX_RATE disagree the app uses MAX and marks the line as a rate range. 2022 is the latest year with full coverage, so post-2022 rate changes are not reflected.",
  },
  {
    id: "btki",
    name: "BTKI 2022 — tariff book",
    publisher: "Ministry of Finance, via PMK 26/PMK.010/2022",
    group: "Classification",
    status: "published",
    feeds: "Heading structure, English and Indonesian titles, statistical units",
    reference: "PMK 26/PMK.010/2022 (AHTN 2022)",
    method:
      "119 subheadings are transcribed into src/data/tariff.ts with their dotted code, titles and default unit. These are the headings the classifier can return.",
    limits:
      "This is a working subset, not the book. BTKI 2022 runs to several thousand national lines; anything outside these 119 returns an explicit 'no heading' result rather than a guess. The English titles are working translations, not the legal text.",
  },
  {
    id: "classifier",
    name: "Description classifier",
    publisher: "This build",
    group: "Classification",
    status: "derived",
    feeds: "The HS heading proposed for each invoice line, and its confidence",
    method:
      "The supplier description is lowercased and scored against a keyword index built from the register: 4 points for a register keyword, 1.2 for an English title word, 0.8 for an Indonesian title word, with word-boundary matching. Confidence is 1 − e^(−score/3). Below a score of 2 no heading is named.",
    limits:
      "This is keyword matching, not a legal classification. It cannot see material composition, function, or essential character, which is what the General Rules for Interpretation actually turn on. When two headings score within 20% of each other the confidence is capped at 55% to say so. Every result is a proposal for a human to accept or override.",
  },
  {
    id: "fta",
    name: "Preferential schedules (ACFTA / ATIGA / IJEPA / AIFTA)",
    publisher: "Modelled in this build",
    group: "Duty rates",
    status: "modelled",
    feeds: "The preferential Bea Masuk applied when an origin qualifies",
    method:
      "Chapters 61–64, 72, 73 and 94 carry 5% ACFTA and 0% ATIGA; other industrial chapters carry 0%. Chapters 22 and 24 are excluded entirely. A preference only applies when the origin is in the scheme and the preferential rate is below MFN.",
    limits:
      "These rates are NOT read from the published schedules. Real ACFTA and ATIGA outcomes depend on the specific national line and on a valid Form E or Form D being presented. Treat the saving shown here as an indication of magnitude, not an entitlement.",
  },
  {
    id: "lartas",
    name: "Lartas and permit flags",
    publisher: "Modelled in this build",
    group: "Classification",
    status: "modelled",
    feeds: "Pre-border and post-border restriction badges, SNI obligations",
    method:
      "Permits and SNI requirements are attached to register entries as shorthand flags, and surface when that heading is selected.",
    limits:
      "Not read from the Permendag lartas list or the SNI compulsory-standard register. A heading flagged here may be unrestricted in practice, and a heading not flagged may still need a permit. Verify against the current lartas module before filing.",
  },
  {
    id: "ppftz",
    name: "Free-zone facility",
    publisher: "Government of Indonesia / BP Batam",
    group: "Facility and procedure",
    status: "published",
    feeds: "Whether duty is suspended, deferred, or payable at the chosen entry point",
    reference: "PP 10/2012 · PMK 47/PMK.04/2012 · Perka BP Batam 8/2019 (as amended)",
    url: "https://peraturan.bpk.go.id/",
    method:
      "Entry points are modelled with a treatment — suspended (into the KPBPB), onward (released to the customs area under PPFTZ-03), or direct (a PIB at a TLDDP port). Suspension zeroes duty, PPN, PPnBM and PPh 22 while the goods remain in the enclave.",
    limits:
      "Excise goods are excluded from the facility. Zone entry also assumes the importer holds the BP Batam masterlist where the app applies it. This is the treatment in the regulations, not a ruling on your specific consignment.",
  },
  {
    id: "tax",
    name: "PPN and PPh 22 rates",
    publisher: "Ministry of Finance",
    group: "Tax computation",
    status: "published",
    feeds: "Value added tax and income-tax prepayment on each line",
    reference: "UU 7/2021 (HPP) · PMK 41/PMK.03/2022",
    method:
      "PPN is 11% of (CIF + Bea Masuk + PPnBM). PPh 22 is 2.5% of CIF for an importer holding an API.",
    limits:
      "Indonesia moved to a 12% headline rate in 2025, with the dasar pengenaan pajak mechanism keeping most goods effectively at 11%. That mechanism is not modelled here. PPh 22 without an API is 7.5%, and PMK 41/2022 sets different rates for certain sectors — neither is handled.",
  },
  {
    id: "fx",
    name: "Kurs pabean",
    publisher: "Ministry of Finance (weekly KMK)",
    group: "Tax computation",
    status: "modelled",
    feeds: "The rupiah value every duty figure is computed on",
    method:
      "A fixed reference rate is compiled into the build. The market spot rate shown in the header is display-only and is never used in a calculation.",
    limits:
      "Duty is legally computed on the KMK rate in force for the week of entry. The rate in this build is a placeholder and must be replaced before any real filing.",
  },
  {
    id: "ocr",
    name: "Tesseract OCR",
    publisher: "tesseract.js, engine assets self-hosted",
    group: "Document reading",
    status: "local",
    feeds: "Text recovered from scanned PDFs and photographs",
    reference: "tesseract.js · eng traineddata",
    method:
      "PDF pages are rasterised with pdf.js and recognised on the device. A page with fewer than 120 characters of text layer is treated as scanned and sent to OCR. Greyscale and histogram stretch are applied first.",
    limits:
      "English model only — Indonesian-language documents are read as English. Handwriting and low-resolution photographs will misread. Figures are always worth checking against the original image, which is why the source document stays on screen.",
  },
  {
    id: "parser",
    name: "Invoice parser",
    publisher: "This build",
    group: "Document reading",
    status: "derived",
    feeds: "Line items, quantities, unit prices, origin, CIF build-up",
    method:
      "Line detection looks for a description followed by a quantity, a unit token and a price, taking the number nearest the unit as the quantity. Origin is read from a stated country or the supplier address, and is left blank when the document does not say.",
    limits:
      "No value is invented. A line with no readable price is flagged rather than filled in, and a missing origin stays empty. Unusual layouts — multi-page tables, merged cells, non-Latin scripts — may produce no lines at all, in which case the app says so instead of substituting a document.",
  },
];

export const SOURCE_GROUPS: SourceGroup[] = [
  "Duty rates",
  "Classification",
  "Facility and procedure",
  "Tax computation",
  "Document reading",
];

export const STATUS_LABEL: Record<SourceStatus, string> = {
  published: "Published",
  modelled: "Modelled",
  derived: "Derived",
  local: "On device",
};

/** One-line version for tooltips and inline citations. */
export function cite(id: string): string {
  const s = SOURCES.find((x) => x.id === id);
  if (!s) return "";
  return `${s.name} — ${s.publisher}`;
}
