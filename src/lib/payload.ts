import { CEISA, KPB, OPERATOR, PPH22_RATE } from "../data/constants";
import { FX } from "./fx";
import type { DeclarationTotals, DemoInvoice, LineCalc } from "../types";

const r2 = (n: number) => Math.round(n * 100) / 100;
const r0 = (n: number) => Math.round(n);

/** Stable per-declaration key so a re-clicked button is idempotent at the gateway. */
export function idempotencyKey(docNo: string, calcs: LineCalc[]): string {
  const basis = `${docNo}|${calcs.map((c) => `${c.pos}:${c.hs}`).join(",")}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < basis.length; i += 1) {
    h ^= basis.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `ps-ftz-${h.toString(16).padStart(8, "0")}`;
}

export function validationReport(calcs: LineCalc[], totals: DeclarationTotals) {
  const blocking: { pos: number; code: string; message: string }[] = [];
  const warnings: { pos: number; code: string; message: string }[] = [];

  for (const c of calcs) {
    if (c.blocked) {
      blocking.push({
        pos: c.pos,
        code: "LARTAS-PRE",
        message: `${c.hs} is pre-border Lartas: ${c.entry.permits?.[0]?.label ?? "import approval"} must be quoted in the PIB licence block.`,
      });
    }
    if (c.lartas === "POST_BORDER") {
      warnings.push({
        pos: c.pos,
        code: "LARTAS-POST",
        message: `${c.hs} is post-border Lartas: report ${c.entry.permits?.[0]?.code ?? "the permit"} within the zone reporting window.`,
      });
    }
    if (c.entry.sni) warnings.push({ pos: c.pos, code: "SNI", message: `${c.entry.sni.standard} certificate number not present on the source document.` });
    if (c.bmadRate > 0) warnings.push({ pos: c.pos, code: "BMAD", message: `Anti-dumping ${Math.round(c.bmadRate * 100)}% on ${c.line.origin} origin — exempted in-zone, due on any TPBD release.` });
    if (c.coverage < 1) warnings.push({ pos: c.pos, code: "TPBD", message: c.line.releaseNote ?? "Partial mainland release on this line." });
    if (c.confidence < 0.7) warnings.push({ pos: c.pos, code: "CLASS-LOW", message: `Classification confidence ${(c.confidence * 100).toFixed(0)}% — broker review required before filing.` });
  }

  if (totals.selected === 0) blocking.push({ pos: 0, code: "EMPTY-SET", message: "No lines selected for filing." });

  return { blocking, warnings };
}

export interface PayloadOptions {
  generatedAt: string;
  draft: boolean;
}

export type FilingRow = LineCalc & { selected: boolean };

export function buildPpftzPayload(
  inv: DemoInvoice,
  rows: FilingRow[],
  totals: DeclarationTotals,
  opts: PayloadOptions,
) {
  const report = validationReport(rows, totals);

  return {
    meta: {
      schemaVersion: `${KPB.facilityForm}/4.2`,
      sourceSystem: "PortSync FTZ Agent 1.0.0",
      gateway: `${CEISA.system} ${CEISA.channel}`,
      environment: CEISA.env,
      generatedAt: opts.generatedAt,
      idempotencyKey: idempotencyKey(inv.docNo, rows),
      submissionState: opts.draft ? "DRAFT_LOCAL" : "READY_TO_SUBMIT",
      operator: {
        ppkbm: OPERATOR.company,
        user: OPERATOR.user,
        role: OPERATOR.role,
        branch: OPERATOR.branch,
      },
    },
    facility: {
      jenisKawasan: "KPBPB",
      kodeKawasan: KPB.kodeKawasan,
      namaKawasan: KPB.region,
      regulator: KPB.authority,
      dasarHukum: KPB.regulation,
      formulir: KPB.facilityForm,
      kantorPabean: { kode: KPB.code, nama: KPB.customsOffice },
      nomorPersetujuan: `${KPB.facilityForm}/${inv.id.toUpperCase()}/${inv.docNo}`,
    },
    pengaju: {
      nama: inv.consignee.name,
      npwp: inv.consignee.taxId,
      nib: inv.consignee.nib,
      api: inv.consignee.api,
      alamat: inv.consignee.addr,
    },
    dokumenDagang: {
      nomorFaktur: inv.docNo,
      tanggalFaktur: inv.docDate,
      incoterm: inv.freight.incoterm,
      mataUang: inv.currency,
      nilaiFakturUsd: r2(totals.usdCif),
      kursPabean: { usdIdr: FX.USD_IDR, sgdIdr: FX.SGD_IDR, sumber: "Kurs Pabean / HPI periode berjalan" },
      nilaiPabeanIdr: r0(totals.idrCif),
      pengangkut: {
        namaKapal: inv.freight.vessel,
        voyage: inv.freight.voyage,
        nomorManifes: inv.freight.manifest,
        container: inv.freight.container,
        pelabuhanMuat: inv.freight.portOfLoading,
        pelabuhanBongkar: inv.freight.portOfDischarge,
        eta: inv.freight.eta,
        freightUsd: inv.freight.freightUsd,
        insuranceUsd: inv.freight.insuranceUsd,
        alokasiFreight: "CIF-inclusive, pro-rata per baris",
      },
      penjual: { nama: inv.supplier.name, alamat: inv.supplier.addr, negara: inv.supplier.country, pajak: inv.supplier.taxId },
    },
    jumlah: {
      barisDiajukan: totals.selected,
      barisTerdeteksi: totals.lines,
      beaMasukStandarIdr: r0(totals.standard.bm),
      bmadStandarIdr: r0(totals.standard.bmad),
      ppnbmStandarIdr: r0(totals.standard.ppnbm),
      ppnStandarIdr: r0(totals.standard.ppn),
      totalStandarIdr: r0(totals.standard.total),
      totalFtzIdr: r0(totals.ftz.total),
      penghematanFasilitasIdr: r0(totals.saved),
      harusDibayarIdr: r0(totals.payable),
      pp22ImporIdr: r0(totals.pph22),
      rataRataKeyakinanKlasifikasi: r2(totals.avgConfidence),
      barisBerisikoTinggi: totals.highRisk,
      barisTerblokir: totals.blocked,
    },
    barang: rows.filter((c) => c.selected).map((c) => ({
      posBgi: c.pos,
      selected: c.selected,
      hsBtki: c.hs.replace(/\./g, ""),
      hsDisplay: c.hs,
      uraianBarang: c.line.raw,
      uraianBtki: c.entry.titleId,
      referensiPenjual: c.line.supplierRef ?? null,
      jumlah: c.qty,
      satuan: c.uom,
      beratNettoKg: c.line.netKg,
      negaraAsal: c.line.origin,
      nilaiPabean: { usd: r2(c.usdCif), idr: r0(c.idrCif), unitUsd: r2(c.unitCifUsd) },
      klasifikasi: {
        metode: c.overridden ? "BROKER_OVERRIDE" : "AGENT_BTKI_V4",
        skorKepercayaan: r2(c.confidence),
        alternatif: c.line.candidates.map((k) => ({ hs: k.hs, skor: r2(k.confidence) })),
      },
      tarifStandar: {
        beaMasukPersen: r2(c.bmRate * 100),
        beaMasukIdr: r0(c.standard.bm),
        bmadPersen: r2(c.bmadRate * 100),
        bmadIdr: r0(c.standard.bmad),
        ppnbmPersen: r2(c.ppnbmRate * 100),
        ppnbmIdr: r0(c.standard.ppnbm),
        ppnPersen: r2(c.ppnRate * 100),
        ppnIdr: r0(c.standard.ppn),
        totalIdr: r0(c.standard.total),
      },
      fasilitasFtz: {
        kode: KPB.facilityForm,
        cakupanPersen: r2(c.coverage * 100),
        beaMasukPersen: r2((c.bmRate * (1 - c.coverage)) * 100),
        ppnPersen: r2((c.ppnRate * (1 - c.coverage)) * 100),
        totalHarusDibayarIdr: r0(c.payable),
        penghematanIdr: r0(c.saved),
        catatan: c.line.releaseNote ?? "Seluruh nilai barang dimanfaatkan di dalam enklave KPBPB.",
      },
      opsiPreferensi: {
        skema: c.fta.scheme,
        beaMasukPersen: r2(c.fta.bmRate * 100),
        selisihTerhadapMfnIdr: r0(c.fta.deltaVsMfn),
        catatan: "Ditampilkan untuk perbandingan; tidak dipakai pada pembanding standar.",
      },
      perizinan: {
        lartas: c.lartas,
        diblokir: c.blocked,
        persyaratan: (c.entry.permits ?? []).map((p) => ({
          lembaga: p.agency,
          kode: p.code,
          tahapan: p.stage,
          uraian: p.label,
        })),
        sni: c.entry.sni ? { standar: c.entry.sni.standard, lingkup: c.entry.sni.scope } : null,
        tkdnPersenMinimal: c.entry.tkdnFloorPct ?? null,
      },
      penanda: c.badges.map((b) => b.label),
      pp22ImporIdr: r0(c.pph22),
    })),
    validasi: {
      status: report.blocking.length > 0 ? "READY_WITH_BLOCKERS" : report.warnings.length > 0 ? "PASS_WITH_WARNINGS" : "PASS",
      checkedAt: opts.generatedAt,
      pemblokir: report.blocking,
      peringatan: report.warnings,
      catatan:
        "Payload generated locally by the PortSync agent. No transmission to a customs system has occurred; validate against live BTKI and INATRADE data before filing.",
    },
  };
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** CEISA-flavoured document interchange: attribute-light, element-per-value. */
export function buildCeisaXml(
  inv: DemoInvoice,
  calcs: FilingRow[],
  totals: DeclarationTotals,
  generatedAt: string,
): string {
  const report = validationReport(calcs, totals);
  const head = (n: number) => `${" ".repeat(n)}`;

  const itemXml = calcs
    .filter((c) => c.selected)
    .map((c) => {
      const permits = (c.entry.permits ?? [])
        .map((p) => `${head(10)}<Permit agency="${esc(p.agency)}" code="${esc(p.code)}" stage="${p.stage}">${esc(p.label)}</Permit>`)
        .join("\n");
      return [
        `${head(6)}<Item pos="${c.pos}" selected="Y">`,
        `${head(8)}<HsCode>${c.hs.replace(/\./g, "")}</HsCode>`,
        `${head(8)}<HsCodeDisplay>${c.hs}</HsCodeDisplay>`,
        `${head(8)}<Description raw="Y">${esc(c.line.raw)}</Description>`,
        `${head(8)}<DescriptionBTKI>${esc(c.entry.titleId)}</DescriptionBTKI>`,
        `${head(8)}<SupplierRef>${esc(c.line.supplierRef ?? "")}</SupplierRef>`,
        `${head(8)}<Quantity uom="${c.uom}">${c.qty}</Quantity>`,
        `${head(8)}<NetWeightKg>${c.line.netKg}</NetWeightKg>`,
        `${head(8)}<Origin>${c.line.origin}</Origin>`,
        `${head(8)}<UnitPrice currency="${inv.currency}" basis="CIF">${r2(c.unitCifUsd)}</UnitPrice>`,
        `${head(8)}<CustomsValue currency="${inv.currency}">${r2(c.usdCif)}</CustomsValue>`,
        `${head(8)}<CustomsValueIDR>${r0(c.idrCif)}</CustomsValueIDR>`,
        `${head(8)}<Classification method="${c.overridden ? "BROKER_OVERRIDE" : "AGENT_BTKI_V4"}" confidence="${r2(c.confidence * 100)}"/>`,
        `${head(8)}<DutyStandard>`,
        `${head(10)}<BeaMasuk rate="${r2(c.bmRate * 100)}">${r0(c.standard.bm)}</BeaMasuk>`,
        `${head(10)}<BMAD rate="${r2(c.bmadRate * 100)}">${r0(c.standard.bmad)}</BMAD>`,
        `${head(10)}<PPnBM rate="${r2(c.ppnbmRate * 100)}">${r0(c.standard.ppnbm)}</PPnBM>`,
        `${head(10)}<PPN rate="${r2(c.ppnRate * 100)}">${r0(c.standard.ppn)}</PPN>`,
        `${head(10)}<TotalIDR>${r0(c.standard.total)}</TotalIDR>`,
        `${head(8)}</DutyStandard>`,
        `${head(8)}<Facility code="${KPB.facilityForm}" coverage="${r2(c.coverage * 100)}">`,
        `${head(10)}<BeaMasuk rate="${r2(c.bmRate * (1 - c.coverage) * 100)}">${r0(c.ftz.bm)}</BeaMasuk>`,
        `${head(10)}<PPN rate="${r2(c.ppnRate * (1 - c.coverage) * 100)}">${r0(c.ftz.ppn)}</PPN>`,
        `${head(10)}<PayableIDR>${r0(c.payable)}</PayableIDR>`,
        `${head(10)}<SavingIDR>${r0(c.saved)}</SavingIDR>`,
        `${head(8)}</Facility>`,
        `${head(8)}<PPh22 rate="${r2(PPH22_RATE * 100)}">${r0(c.pph22)}</PPh22>`,
        `${head(8)}<Lartas level="${c.lartas}" blocked="${c.blocked ? "Y" : "N"}">`,
        permits ? `${permits}\n${head(8)}</Lartas>` : `${head(8)}</Lartas>`,
        c.entry.sni
          ? `${head(8)}<SNI standard="${esc(c.entry.sni.standard)}">${esc(c.entry.sni.scope)}</SNI>`
          : `${head(8)}<SNI required="N"/>`,
        `${head(8)}<Preferential scheme="${esc(c.fta.scheme)}" bmRate="${r2(c.fta.bmRate * 100)}"/>`,
        `${head(8)}<Risk>${c.risk}</Risk>`,
        `${head(6)}</Item>`,
      ].join("\n");
    })
    .join("\n");

  const blockers = report.blocking
    .map((b) => `${head(6)}<Block pos="${b.pos}" code="${b.code}">${esc(b.message)}</Block>`)
    .join("\n");
  const warns = report.warnings
    .map((w) => `${head(6)}<Warning pos="${w.pos}" code="${w.code}">${esc(w.message)}</Warning>`)
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<CEISA4:DocPPFTZ xmlns:CEISA4="http://www.beacukai.go.id/schema/ceisa4/ppftz" version="4.2.1" environment="${CEISA.env}">`,
    `${head(4)}<Header>`,
    `${head(6)}<ReferenceNumber>${esc(idempotencyKey(inv.docNo, calcs))}</ReferenceNumber>`,
    `${head(6)}<FormType>${KPB.facilityForm}</FormType>`,
    `${head(6)}<GeneratedAt>${generatedAt}</GeneratedAt>`,
    `${head(6)}<Office code="${KPB.code}">${esc(KPB.customsOffice)}</Office>`,
    `${head(6)}<Zone type="KPBPB" code="${KPB.kodeKawasan}">${esc(KPB.region)}</Zone>`,
    `${head(6)}<LegalBasis>${esc(KPB.regulation)}</LegalBasis>`,
    `${head(6)}<PPKBM nib="${esc(OPERATOR.nib)}" api="${esc(OPERATOR.api)}">${esc(OPERATOR.company)}</PPKBM>`,
    `${head(4)}</Header>`,
    `${head(4)}<Importer npwp="${esc(inv.consignee.taxId)}" nib="${esc(inv.consignee.nib ?? "")}">`,
    `${head(6)}<Name>${esc(inv.consignee.name)}</Name>`,
    `${head(6)}<Address>${esc(inv.consignee.addr)}</Address>`,
    `${head(4)}</Importer>`,
    `${head(4)}<CommercialDocument number="${esc(inv.docNo)}" date="${inv.docDate}" currency="${inv.currency}" incoterm="${esc(inv.freight.incoterm)}">`,
    `${head(6)}<Exporter taxId="${esc(inv.supplier.taxId)}">${esc(inv.supplier.name)}</Exporter>`,
    `${head(6)}<CIFTotal currency="${inv.currency}">${r2(totals.usdCif)}</CIFTotal>`,
    `${head(6)}<CIFTotalIDR>${r0(totals.idrCif)}</CIFTotalIDR>`,
    `${head(6)}<ExchangeRate pair="USD/IDR">${FX.USD_IDR}</ExchangeRate>`,
    `${head(6)}<ExchangeRate pair="SGD/IDR">${FX.SGD_IDR}</ExchangeRate>`,
    `${head(4)}</CommercialDocument>`,
    `${head(4)}<Transport mode="sea">`,
    `${head(6)}<Vessel name="${esc(inv.freight.vessel)}" voyage="${esc(inv.freight.voyage)}"/>`,
    `${head(6)}<Manifest>${esc(inv.freight.manifest)}</Manifest>`,
    `${head(6)}<Container>${esc(inv.freight.container)}</Container>`,
    `${head(6)}<PortOfLoading>${esc(inv.freight.portOfLoading)}</PortOfLoading>`,
    `${head(6)}<PortOfDischarge>${esc(inv.freight.portOfDischarge)}</PortOfDischarge>`,
    `${head(6)}<ETA>${inv.freight.eta}</ETA>`,
    `${head(4)}</Transport>`,
    `${head(4)}<GoodsList count="${totals.selected}">`,
    itemXml || `${head(6)}<!-- no lines selected for filing -->`,
    `${head(4)}</GoodsList>`,
    `${head(4)}<Totals currency="IDR">`,
    `${head(6)}<BeaMasukStandard>${r0(totals.standard.bm)}</BeaMasukStandard>`,
    `${head(6)}<BMADStandard>${r0(totals.standard.bmad)}</BMADStandard>`,
    `${head(6)}<PPnBMStandard>${r0(totals.standard.ppnbm)}</PPnBMStandard>`,
    `${head(6)}<PPNStandard>${r0(totals.standard.ppn)}</PPNStandard>`,
    `${head(6)}<StandardGrandTotal>${r0(totals.standard.total)}</StandardGrandTotal>`,
    `${head(6)}<FacilitySaving>${r0(totals.saved)}</FacilitySaving>`,
    `${head(6)}<PayableAfterFacility>${r0(totals.payable)}</PayableAfterFacility>`,
    `${head(6)}<PPh22Fiscal>${r0(totals.pph22)}</PPh22Fiscal>`,
    `${head(6)}<HighRiskLines>${totals.highRisk}</HighRiskLines>`,
    `${head(6)}<BlockedLines>${totals.blocked}</BlockedLines>`,
    `${head(6)}<AverageConfidence>${r2(totals.avgConfidence * 100)}%</AverageConfidence>`,
    `${head(4)}</Totals>`,
    `${head(4)}<Validation status="${report.blocking.length ? "READY_WITH_BLOCKERS" : report.warnings.length ? "PASS_WITH_WARNINGS" : "PASS"}">`,
    blockers,
    warns,
    `${head(4)}</Validation>`,
    `</CEISA4:DocPPFTZ>`,
    ``,
  ]
    .filter((l) => l.length > 0)
    .join("\n");
}
