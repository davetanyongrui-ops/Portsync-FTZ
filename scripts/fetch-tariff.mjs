/**
 * Pull Indonesian applied MFN rates from the World Bank WITS / TRAINS dataset.
 *
 * Source: WITS SDMX API, reporter 360 (Indonesia), partner 000 (MFN), datatype
 * "reported" — i.e. the rate Indonesia actually applied, not a bound ceiling.
 * Latest year with coverage is 2022, which is the BTKI 2022 schedule.
 *
 * Output: src/data/tariff-mfn.json  { "848210": { min, max, avg, n, year } }
 *
 * Run with: node scripts/fetch-tariff.mjs
 * The JSON is committed so the app has no runtime network dependency.
 */
import fs from "node:fs";
import path from "node:path";

/** HS6 codes worth carrying in the register: industrial inputs plus common consumer lines. */
const HS6 = [
  // 22 — beverages / alcohol (excise)
  "220710", "220820", "220830", "220890",
  // 33/34 — cosmetics, soap
  "330499", "340111", "340220",
  // 38 — chemicals
  "381800", "382499",
  // 39 — plastics
  "390761", "392010", "392062", "392330", "392690",
  // 40 — rubber
  "401110", "401693", "400931",
  // 48 — paper
  "480256", "481910", "482110",
  // 52/54/55 — textiles
  "520942", "540761", "550953", "551511",
  // 61/62 — apparel
  "610910", "620342", "620520",
  // 63 — made-up textiles
  "630260", "630790",
  // 68/69/70 — stone, ceramics, glass
  "680221", "690722", "700529", "701337",
  // 72 — iron & steel
  "720839", "720917", "721049", "721934", "721935", "722860",
  // 73 — articles of iron & steel
  "730630", "730721", "731815", "731816", "731821", "732690",
  // 74 — copper
  "740811", "741220",
  // 76 — aluminium
  "760110", "760410", "760429", "760612", "761699",
  // 82 — tools
  "820320", "820750", "820900",
  // 83 — misc metal
  "830241", "830249",
  // 84 — machinery
  "840721", "840820", "841221", "841319", "841370", "841391", "841459",
  "841869", "842121", "842139", "842230", "842833", "843139", "844399",
  "845710", "846221", "846729", "847130", "847150", "847330", "847759",
  "847989", "848120", "848180", "848210", "848220", "848291", "848310",
  "848340", "848410", "848620",
  // 85 — electrical & electronics
  "850110", "850152", "850431", "850440", "850490", "850511", "850650",
  "850720", "850760", "851660", "851713", "851762", "852872", "853400", "853650",
  "853710", "854143", "854231", "854239", "854442", "854449", "854470",
  // 87 — vehicles & parts
  "870322", "870829", "870840", "870899",
  // 90 — optical / measuring
  "900150", "901720", "902620", "903149", "903289",
  // 94 — furniture
  "940130", "940310", "940330", "940360",
  // 95 — toys & sport
  "950300", "950662",
];

const BASE = "https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN";
const YEARS = ["2022", "2021", "2020", "2019"];
const CHUNK = 14;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchChunk(codes, year) {
  const url = `${BASE}/reporter/360/partner/000/product/${codes.join(";")}/year/${year}/datatype/reported`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${codes.length} codes`);
  const xml = await res.text();

  // Series header carries PRODUCTCODE; the following <Obs> carries the values.
  const out = {};
  const seriesRe = /<Series[^>]*PRODUCTCODE="(\d{6})"[\s\S]*?<Obs\b([^>]*)\/>/g;
  let m;
  while ((m = seriesRe.exec(xml))) {
    const code = m[1];
    const attrs = m[2];
    const num = (k) => {
      const hit = attrs.match(new RegExp(`${k}="([-0-9.eE]+)"`));
      return hit ? Number(hit[1]) : null;
    };
    const min = num("MIN_RATE");
    const max = num("MAX_RATE");
    const avg = num("OBS_VALUE");
    const lines = num("TOTALNOOFLINES");
    if (min === null && avg === null) continue;
    out[code] = {
      min: min ?? avg,
      max: max ?? avg,
      avg,
      lines: lines ?? 1,
      year,
    };
  }
  return out;
}

const result = {};
const codes = HS6;

for (let i = 0; i < codes.length; i += CHUNK) {
  const chunk = codes.slice(i, i + CHUNK);
  let attempt = 0;
  for (;;) {
    try {
      const got = await fetchChunk(chunk, YEARS[0]);
      Object.assign(result, got);
      const missing = chunk.filter((c) => !(c in got));
      process.stdout.write(`  ${i + chunk.length}/${codes.length} ok (+${Object.keys(got).length})`);
      process.stdout.write(missing.length ? `  missing: ${missing.join(",")}\n` : "\n");
      break;
    } catch (err) {
      attempt += 1;
      if (attempt > 3) {
        console.error(`  FAILED chunk at ${i}: ${err.message}`);
        break;
      }
      await sleep(1200 * attempt);
    }
  }
  await sleep(350);
}

// Some subheadings are simply absent from the newest release. Walk back a year at
// a time rather than inventing a rate, and record which year each row came from.
const gaps = codes.filter((c) => !(c in result));
for (const year of YEARS.slice(1)) {
  if (!gaps.length) break;
  for (let i = 0; i < gaps.length; i += CHUNK) {
    const chunk = gaps.slice(i, i + CHUNK).filter((c) => !(c in result));
    if (!chunk.length) continue;
    try {
      const got = await fetchChunk(chunk, year);
      Object.assign(result, got);
      if (Object.keys(got).length) {
        console.log(`  fallback ${year}: +${Object.keys(got).length} (${Object.keys(got).join(",")})`);
      }
    } catch (err) {
      console.error(`  fallback ${year} failed: ${err.message}`);
    }
    await sleep(400);
  }
}

const outPath = path.resolve("src/data/tariff-mfn.json");
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      source: "World Bank WITS / TRAINS — Indonesia (reporter 360), MFN applied, 2022",
      url: "https://wits.worldbank.org/",
      note: "min/max are the range across the national tariff lines inside each HS6 subheading; a single-line subheading has min = max.",
      fetched: new Date().toISOString().slice(0, 10),
      rates: Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b))),
    },
    null,
    1,
  ) + "\n",
);

console.log(`\nwrote ${Object.keys(result).length} subheadings to ${outPath}`);
