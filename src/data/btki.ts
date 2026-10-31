import type { BtkiEntry } from "../types";

/**
 * Reference BTKI (Buku Tarif Kepabeanan Indonesia) / AHTN subset used by the agent.
 * Hardcoded so classification + tariff maths answer with zero backend latency.
 * Rates are the demo's reference register — not a live HPI/INATRADE feed.
 */
export const BTKI: BtkiEntry[] = [
  {
    hs: "8507.60.90",
    hsCompact: "85076090",
    titleId: "Akumulator listrik, ion-litium (lainnya)",
    titleEn: "Lithium-ion accumulators, other (cells, modules and packs)",
    uom: "PCE",
    bmMfn: 0.1,
    bmAcf: 0,
    bmAsean: 0.05,
    ppnbm: 0,
    lartas: "POST_BORDER",
    permits: [
      {
        agency: "Kementerian Perdagangan",
        code: "PI-B3",
        label: "Import approval + UN 38.3 test summary (DG class 9)",
        stage: "post-border",
      },
    ],
    risk: "HIGH",
    rationale:
      "Hazardous-goods consignment: packing declaration, UN38.3 report and MSDS are checked after landing; a missing dossier stops the goods from being moved to the storage facility.",
  },
  {
    hs: "8534.00.00",
    hsCompact: "85340000",
    titleId: "Sirkuit tercetak, tunggal/ganda, tanpa komponen terpasang",
    titleEn: "Printed circuits, single or double sided, unpopulated",
    uom: "PCE",
    bmMfn: 0.05,
    bmAcf: 0,
    bmAsean: 0,
    ppnbm: 0,
    lartas: "NONE",
    risk: "LOW",
    rationale:
      "Industrial input with no mandatory standard and no licensing regime; ACFTA origin is verified on Form D only.",
  },
  {
    hs: "8504.40.90",
    hsCompact: "85044090",
    titleId: "Konverter statis, lainnya (inverter PLTS / grid-tie)",
    titleEn: "Static converters, other (PV string and grid-tie inverters)",
    uom: "PCE",
    bmMfn: 0.1,
    bmAcf: 0.05,
    bmAsean: 0.05,
    ppnbm: 0,
    lartas: "PRE_BORDER",
    permits: [
      {
        agency: "Kementerian ESDM",
        code: "REF-PVT",
        label: "Technical recommendation for PV equipment (SLO approved list)",
        stage: "pre-border",
      },
    ],
    sni: {
      standard: "SNI IEC 62109-2:2013",
      scope: "Inverter safety for photovoltaic power conversion equipment",
    },
    tkdnFloorPct: 40,
    risk: "HIGH",
    rationale:
      "Pre-border Lartas: approval must exist before the PIB is filed. Grid-tied units also carry a local-content floor for ESDM programmes.",
  },
  {
    hs: "7604.29.90",
    hsCompact: "76042990",
    titleId: "Batang dan profil dari paduan aluminium, ditempa/ekstrusi, lainnya",
    titleEn: "Bars and rods, aluminium alloys, forged or extruded, other",
    uom: "KGM",
    bmMfn: 0.15,
    bmAcf: 0.05,
    bmAsean: 0,
    ppnbm: 0,
    bmad: 0.1,
    adOrigins: ["CN", "IN", "KR"],
    adNote: "BMAD / safeguard on aluminium flat-rolled and extruded product — origin sensitive.",
    lartas: "NONE",
    risk: "MEDIUM",
    rationale:
      "High MFN wall plus an origin-triggered anti-dumping duty. ACFTA Form D changes the payable rate materially, so origin screening is mandatory.",
  },
  {
    hs: "8481.20.00",
    hsCompact: "84812000",
    titleId: "Klepal transmisi hidrolik/neumatik (direction control, FRL)",
    titleEn: "Valves for transmission, hydraulic or pneumatic (direction control, service units)",
    uom: "PCE",
    bmMfn: 0.1,
    bmAcf: 0,
    bmAsean: 0,
    ppnbm: 0,
    lartas: "NONE",
    risk: "LOW",
    rationale:
      "Standard MRO spare. Only check is the cylinder-vs-valve split: single-acting cylinders fall to 8412.21 and would change the rate.",
  },
  {
    hs: "9026.20.00",
    hsCompact: "90262000",
    titleId: "Instrumen/alat ukur tekanan atau vacuum",
    titleEn: "Instruments and apparatus for measuring or checking pressure",
    uom: "PCE",
    bmMfn: 0.05,
    bmAcf: 0,
    bmAsean: 0,
    ppnbm: 0,
    lartas: "POST_BORDER",
    permits: [
      {
        agency: "Kemendag — Bina Metrologi",
        code: "SPLM",
        label: "Legal metrology verification (Tera / SPLM) for trade-measured units",
        stage: "post-border",
      },
    ],
    risk: "MEDIUM",
    rationale:
      "Instruments used for fiscal or safety measurement need a metrology certificate; process-only transducers can be released first and verified later.",
  },
  {
    hs: "8471.50.00",
    hsCompact: "84715000",
    titleId: "Unit pemrosesan (modul SBC/SoC), selain 8471.41/49",
    titleEn: "Processing units other than those of 8471.41/49 (embedded SoM / SBC)",
    uom: "PCE",
    bmMfn: 0,
    bmAcf: 0,
    bmAsean: 0,
    ppnbm: 0,
    lartas: "NONE",
    risk: "LOW",
    rationale:
      "Duty-free ITA product. The only agent check is that it ships as a board-level module, not a complete system.",
  },
  {
    hs: "8544.42.00",
    hsCompact: "85444200",
    titleId: "Kabel listrik ≤1000 V, dengan alat penyambung",
    titleEn: "Electric conductors ≤1000 V, fitted with connectors (harness / PV DC cable)",
    uom: "MTR",
    bmMfn: 0.1,
    bmAcf: 0,
    bmAsean: 0,
    ppnbm: 0,
    lartas: "PRE_BORDER",
    permits: [
      {
        agency: "Kementerian Perindustrian",
        code: "SNI-WIR",
        label: "Mandatory SNI certificate + INATRADE approval before clearance",
        stage: "pre-border",
      },
    ],
    sni: {
      standard: "SNI 05-3659 / IEC 60227",
      scope: "Insulated cables for nominal voltage up to 450/750 V",
    },
    risk: "HIGH",
    rationale:
      "Cables are pre-border Lartas: no clearance without the SNI certificate number keyed into the PIB licence field.",
  },
  {
    hs: "7318.15.90",
    hsCompact: "73181590",
    titleId: "Sekrup dan baut dari besi/baja lainnya (ulir penuh/sebagian)",
    titleEn: "Other screws and bolts of iron or steel",
    uom: "KGM",
    bmMfn: 0.1,
    bmAcf: 0,
    bmAsean: 0,
    ppnbm: 0,
    bmad: 0.1,
    adOrigins: ["CN", "MY", "TH", "KR"],
    adNote: "BMAD + BMTD on fasteners from the notified origin list.",
    lartas: "NONE",
    risk: "MEDIUM",
    rationale:
      "Fasteners are a trade-remedy commodity. The duty saving on this line is dominated by AD/CVD, not by MFN.",
  },
  {
    hs: "8482.10.11",
    hsCompact: "84821011",
    titleId: "Bantalan bola alur dalam, tertutup, untuk keperluan industri",
    titleEn: "Deep groove ball bearings, sealed, industrial grade",
    uom: "PCE",
    bmMfn: 0.1,
    bmAcf: 0,
    bmAsean: 0,
    ppnbm: 0,
    bmad: 0.1,
    adOrigins: ["CN"],
    adNote: "BMAD on ball bearings from CN origin only.",
    lartas: "NONE",
    risk: "MEDIUM",
    rationale:
      "AD applies to CN origin; the same part shipped from Malaysia or Singapore carries MFN only.",
  },
];

export const BTKI_BY_HS: Record<string, BtkiEntry> = Object.fromEntries(
  BTKI.map((e) => [e.hs, e]),
);

export function getEntry(hs: string): BtkiEntry {
  const found = BTKI_BY_HS[hs];
  if (!found) throw new Error(`BTKI register has no entry for ${hs}`);
  return found;
}
