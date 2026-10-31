/**
 * Headless QA harness for the PortSync FTZ dashboard.
 * Drives Chrome over CDP, clicks through the real UI, and re-derives the duty
 * arithmetic from the downloaded payload, so the money maths is proven rather than assumed.
 *
 *   npm run dev            # port 5178
 *   node scripts/qa.mjs    # writes screenshots + downloads into .qa/
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, ".qa");
const DL = path.join(OUT, "downloads");
// the profile must live outside the project: Chrome's code cache inside it makes Vite reload the page mid-run
const PROFILE = path.join(os.tmpdir(), "portsync-ftz-qa-profile");
const APP_URL = "http://localhost:5178/";
const KURS = 16200;

fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(PROFILE, { recursive: true, force: true });
fs.mkdirSync(DL, { recursive: true });

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) pass += 1;
  else fail += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--disable-component-update",
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-sync",
    "--window-size=1700,1080",
    "about:blank",
  ],
  { stdio: "ignore" },
);

process.on("unhandledRejection", (err) => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});

async function findTarget() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* devtools not listening yet */
    }
    await sleep(250);
  }
  throw new Error("chrome devtools endpoint never came up");
}

const ws = new WebSocket(await findTarget());
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let seq = 0;
const pending = new Map();
const consoleErrors = [];

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) rej(new Error(`${msg.method}: ${msg.error.message}`));
    else res(msg.result);
    return;
  }
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    consoleErrors.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
  }
  if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    const where = msg.params.entry.url ? ` (${msg.params.entry.url})` : "";
    consoleErrors.push(`log: ${msg.params.entry.text}${where}`);
  }
};

const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });

async function ev(expression, label = "eval") {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) {
    throw new Error(`${label}: ${r.exceptionDetails.exception?.description ?? JSON.stringify(r.exceptionDetails)}`);
  }
  return r.result.value;
}

async function shot(name) {
  const r = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(r.data, "base64"));
}

const setViewport = (w, h) =>
  send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });

async function waitFor(expr, ms, label) {
  const t0 = Date.now();
  for (;;) {
    if (await ev(`Boolean(${expr})`)) return;
    if (Date.now() - t0 > ms) throw new Error(`timeout waiting for ${label}`);
    await sleep(120);
  }
}

/** Page-side query helpers, injected once. */
const HELPERS = `(() => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const card = (label) => document.querySelector('[data-kpi="' + label + '"]');
  const cardText = (label) => { const c = card(label); return c ? norm(c.innerText) : null; };
  const cardValue = (label) => {
    const v = card(label)?.querySelector('[data-kpi-value]');
    return v ? norm(v.innerText) : null;
  };
  const rowEls = () => [...document.querySelectorAll('tr[data-line]')];
  const rows = () => rowEls().map((r) => ({
    desc: norm(r.children[1].innerText),
    hs: norm(r.children[2].querySelector('select')?.value),
    value: norm(r.children[3].innerText),
    rates: norm(r.children[4].innerText),
    tags: norm(r.children[5].innerText),
    selected: r.querySelector('input[type=checkbox]').checked,
  }));
  const pick = (id, value) => {
    const s = document.getElementById(id);
    if (!s) throw new Error('no select #' + id);
    if (![...s.options].some((o) => o.value === value && !o.disabled))
      throw new Error('option ' + value + ' is not selectable in #' + id + ' (has: ' + [...s.options].map(o => o.value + (o.disabled ? '(disabled)' : '')).join(', ') + ')');
    s.value = value;
    s.dispatchEvent(new Event('change', { bubbles: true }));
    return s.value;
  };
  const clickText = (sel, txt) => {
    const el = [...document.querySelectorAll(sel)].find((e) => norm(e.innerText).includes(txt) && !e.disabled);
    if (!el) throw new Error('no enabled [' + txt + '] among ' + sel);
    el.click();
    return norm(el.innerText);
  };
  const toasts = () => [...document.querySelectorAll('[role="status"]')].map((t) => norm(t.innerText)).join(' | ');
  const filed = () => norm((document.body.innerText.match(/Lines filed[\\s\\S]{0,18}/i) || [''])[0]);
  const rects = () => [...document.querySelectorAll('main > div')].map((d) => {
    const r = d.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), display: getComputedStyle(d).display };
  });
  const inViewport = (sel, txt) => {
    const el = [...document.querySelectorAll(sel)].find((e) => norm(e.innerText).includes(txt));
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    return { found: true, r: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
             ok: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && r.width > 0 && r.height > 0 };
  };
  window.__qa = { norm, cardText, cardValue, rowEls, rows, pick, clickText, toasts, filed, rects, inViewport };
  return true;
})()`;

/** Read a downloaded file, assert per-line and roll-up arithmetic against the reference register. */
function verifyPayload(label, file, expect) {
  const p = JSON.parse(fs.readFileSync(path.join(DL, file), "utf8"));
  const issues = { fx: [], bm: [], ppn: [], item: [], roll: [] };
  let sumStd = 0;
  let sumPay = 0;

  for (const it of p.barang) {
    const cif = it.nilaiPabean.idr;
    if (Math.abs(cif - Math.round(it.nilaiPabean.usd * KURS)) > 1)
      issues.fx.push(`pos ${it.posBgi}: ${cif} vs USD×kurs ${Math.round(it.nilaiPabean.usd * KURS)}`);

    const bm = Math.round(cif * (it.tarifStandar.beaMasukPersen / 100));
    if (Math.abs(it.tarifStandar.beaMasukIdr - bm) > 2)
      issues.bm.push(`pos ${it.posBgi}: BM ${it.tarifStandar.beaMasukIdr} vs ${bm}`);

    const base = cif + it.tarifStandar.beaMasukIdr + it.tarifStandar.bmadIdr + it.tarifStandar.ppnbmIdr;
    const ppn = Math.round(base * (it.tarifStandar.ppnPersen / 100));
    if (Math.abs(it.tarifStandar.ppnIdr - ppn) > 2)
      issues.ppn.push(`pos ${it.posBgi}: PPN ${it.tarifStandar.ppnIdr} vs ${ppn}`);

    const tot = it.tarifStandar.beaMasukIdr + it.tarifStandar.bmadIdr + it.tarifStandar.ppnbmIdr + it.tarifStandar.ppnIdr;
    if (Math.abs(tot - it.tarifStandar.totalIdr) > 4)
      issues.item.push(`pos ${it.posBgi}: ${it.tarifStandar.totalIdr} vs ${tot}`);

    const expectedPayable = it.tarifStandar.totalIdr * (1 - it.fasilitasFtz.cakupanPersen / 100);
    if (Math.abs(it.fasilitasFtz.totalHarusDibayarIdr - expectedPayable) > 4)
      issues.item.push(`pos ${it.posBgi}: ftz payable ${it.fasilitasFtz.totalHarusDibayarIdr} vs expected ${expectedPayable.toFixed(0)}`);

    sumStd += it.tarifStandar.totalIdr;
    sumPay += it.fasilitasFtz.totalHarusDibayarIdr;
  }

  if (Math.abs(sumStd - p.jumlah.totalStandarIdr) > 12 || Math.abs(sumPay - p.jumlah.harusDibayarIdr) > 12)
    issues.roll.push(`Σ items ${sumStd}/${sumPay} vs header ${p.jumlah.totalStandarIdr}/${p.jumlah.harusDibayarIdr}`);
  if (Math.abs(p.jumlah.penghematanFasilitasIdr - (p.jumlah.totalStandarIdr - p.jumlah.harusDibayarIdr)) > 12)
    issues.roll.push("saving != standard − payable");

  console.log(
    `   ${label}: ${p.barang.length} items · standard ${p.jumlah.totalStandarIdr.toLocaleString("id-ID")}` +
      ` · payable ${p.jumlah.harusDibayarIdr.toLocaleString("id-ID")} · saved ${p.jumlah.penghematanFasilitasIdr.toLocaleString("id-ID")}` +
      ` · status ${p.validasi.status} (${p.validasi.pemblokir.length} block / ${p.validasi.peringatan.length} warn)`,
  );

  check(`${label}: USD→IDR at the 16,200 kurs`, issues.fx.length === 0, issues.fx[0] ?? "");
  check(`${label}: Bea Masuk levied on CIF`, issues.bm.length === 0, issues.bm[0] ?? "");
  check(`${label}: PPN levied on CIF + duty (not on CIF alone)`, issues.ppn.length === 0, issues.ppn[0] ?? "");
  check(`${label}: per-line standard and FTZ splits reconcile`, issues.item.length === 0, issues.item[0] ?? "");
  check(`${label}: header totals equal the sum of lines`, issues.roll.length === 0, issues.roll[0] ?? "");
  check(`${label}: item count`, p.barang.length === expect.lines, `${p.barang.length} lines`);
  if (expect.approxStandard !== undefined) {
    check(
      `${label}: standard duty matches the hand-computed reference (±25)`,
      Math.abs(p.jumlah.totalStandarIdr - expect.approxStandard) <= 25,
      `payload ${p.jumlah.totalStandarIdr} vs reference ${expect.approxStandard}`,
    );
  }
  if (expect.payable !== undefined) {
    check(`${label}: payable ${expect.payable === 0 ? "is Rp 0" : "matches the TPBD residual"}`, Math.abs(p.jumlah.harusDibayarIdr - expect.payable) <= 25, String(p.jumlah.harusDibayarIdr));
  }
  if (expect.blocking !== undefined) {
    check(`${label}: ${expect.blocking} blocking finding(s)`, p.validasi.pemblokir.length === expect.blocking, JSON.stringify(p.validasi.pemblokir.map((b) => b.code)));
  }
  return p;
}

async function grabPayload(tag) {
  const ext = tag === "json" ? ".json" : ".xml";
  const before = new Set(fs.readdirSync(DL));
  await ev(`__qa.clickText('button','Download ${tag === "json" ? "JSON" : "XML"}')`, "download click");
  for (let i = 0; i < 25; i += 1) {
    await sleep(200);
    const fresh = fs.readdirSync(DL).filter((f) => !before.has(f) && f.endsWith(ext) && !f.endsWith(".crdownload"));
    if (fresh.length) return fresh.sort()[0];
  }
  throw new Error(`no ${ext} file landed in downloads`);
}

/* ------------------------------------------------------------------ */

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: DL }).catch(() =>
  console.log("   (Page.setDownloadBehavior unsupported, using Browser domain)"),
);
await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: DL, eventsEnabled: true }).catch(() => {});
await send("Browser.grantPermissions", {
  origin: "http://localhost:5178",
  permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
}).catch(() => {});
await setViewport(1680, 1050);
await send("Page.navigate", { url: APP_URL });
await waitFor("document.getElementById('root')?.childElementCount > 0", 15000, "app mount");
await ev(HELPERS, "helpers");
await sleep(800);

check("Inter Variable font applied", (await ev(`document.fonts.check('700 16px "Inter Variable"')`)) === true, "");
check(
  "dark zinc shell painted",
  await ev(`getComputedStyle(document.body).backgroundColor.replace(/\\s/g,'') === 'rgb(9,9,11)'`),
  "",
);
check("navbar ticker shows both pairs", await ev(`/USD\\/IDR/.test(document.body.innerText) && /16,200|16.200/.test(document.body.innerText)`), "");
check("KPBPB compliance badge present", await ev(`/Batam Free Trade Zone \\(KPBPB\\)/.test(document.body.innerText)`), "");
check("idle declaration engine is empty", await ev(`/Declaration engine idle/.test(document.body.innerText)`), "");
check("idle KPI cards show placeholders", /—/.test((await ev(`__qa.cardText('Final Duty Payable')`)) ?? ""), "");
check("navbar agent status is honest while idle", /Agent idle · awaiting analysis/.test(await ev(`document.body.innerText`)), "");
await shot("01-idle");

/* ---------- fixture A — Singapore, 8 lines, fully exempt ---------- */
await ev(`__qa.clickText('button','Analyze & Map to BTKI Tariff')`);
await sleep(500);
check("navbar follows the running agent", /Agent running · mapping BTKI/.test(await ev(`document.body.innerText`)), "");
await shot("02-analyzing");
await waitFor(
  `(() => { const c = __qa.cardText('Total CIF Value'); return !!c && c.includes('@ Rp 16,200/USD'); })()`,
  10000,
  "KPIs populated",
);
await sleep(300);

const kpiA = {
  cif: await ev(`__qa.cardText('Total CIF Value')`),
  cifValue: await ev(`__qa.cardValue('Total CIF Value')`),
  std: await ev(`__qa.cardText('Standard Mainland Duty')`),
  saved: await ev(`__qa.cardText('FTZ Exemption Savings')`),
  savedValue: await ev(`__qa.cardValue('FTZ Exemption Savings')`),
  payable: await ev(`__qa.cardText('Final Duty Payable')`),
  payableValue: await ev(`__qa.cardValue('Final Duty Payable')`),
  risk: await ev(`__qa.cardText('Lartas / Regulatory Alerts')`),
};
console.log("KPI A:", JSON.stringify(kpiA, null, 1));
check("A: USD CIF total", /^\$ 46,022\.00$/.test(kpiA.cifValue ?? ""), kpiA.cifValue);
check("A: IDR equivalent = USD × 16,200", /Rp 745\.556\.400/.test(kpiA.cif ?? ""), kpiA.cif);
check("A: saving rendered as a green minus figure", /^−Rp/.test(kpiA.savedValue ?? ""), kpiA.savedValue);
check("A: 100% of standard duty avoided", /100% of standard duty/.test(kpiA.saved ?? ""), kpiA.saved);
check("A: payable Rp 0", /^Rp 0$/.test(kpiA.payableValue ?? "") && /100% exempt/i.test(kpiA.payable ?? ""), kpiA.payable);
check("A: 8 classified lines in the table", (await ev(`__qa.rows().length`)) === 8, "");
check("A: bounding boxes drawn over the document", (await ev(`document.querySelectorAll('.paper-shadow .animate-draw').length`)) >= 8, "");
check("A: HS codes rendered in the table", await ev(`__qa.rows().every(r => /^\\d{4}\\.\\d{2}\\.\\d{2}$/.test(r.hs.split(' ')[0]))`), "");
check("A: risk KPI agrees with the payload blocker", /1 pre-border/.test(kpiA.risk ?? ""), kpiA.risk);
check(
  "navbar reports the classified line and blocker counts",
  /Agent ready · 8 lines · 1 blocked/.test(await ev(`document.body.innerText`)),
  "",
);
const kpiGeom = await ev(
  `(() => [...document.querySelectorAll('[data-kpi]')].map(c => { const r = c.getBoundingClientRect(); return { y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }))()`,
);
console.log("KPI geometry:", JSON.stringify(kpiGeom));
check("five KPI cards render", kpiGeom.length === 5, `${kpiGeom.length} cards`);
check(
  "primary row is three cards on one line",
  new Set(kpiGeom.slice(0, 3).map((c) => c.y)).size === 1,
  JSON.stringify(kpiGeom.slice(0, 3).map((c) => c.y)),
);
check(
  "secondary row is two cards on its own line",
  kpiGeom.length === 5 && new Set(kpiGeom.slice(3).map((c) => c.y)).size === 1 && kpiGeom[3].y > kpiGeom[0].y,
  JSON.stringify(kpiGeom.slice(3).map((c) => c.y)),
);
check("no KPI card is squeezed below 200px", kpiGeom.every((c) => c.w >= 200), JSON.stringify(kpiGeom.map((c) => c.w)));
check(
  "declaration grid is a real <table> with one row per line",
  (await ev(`!!document.querySelector('table') && document.querySelectorAll('tr[data-line]').length === 8`)) === true,
  "",
);
check(
  "table rows have vertical breathing room",
  (await ev(
    `(() => { const r = document.querySelector('tr[data-line]'); return r ? Math.round(r.getBoundingClientRect().height) : 0; })()`,
  )) >= 80,
  "",
);
await shot("03-ready-fixture-a");

/* document-level payload check for A */
await ev(`__qa.clickText('button','Generate PPFTZ-01 Declaration Payload')`);
await waitFor(`document.querySelector('[role="dialog"]') !== null`, 6000, "modal A");
await sleep(400);
const modalA = await ev(`__qa.norm(document.querySelector('[role="dialog"]').innerText)`);
check("A: modal opens with a validation status", /READY_WITH_BLOCKERS/.test(modalA), modalA.slice(0, 140));
check("A: modal shows schema + idempotency key", /PPFTZ-01\/4\.2/.test(modalA) && /idempotency ps-ftz-/.test(modalA), "");
check("A: JSON is syntax-highlighted, not a wall of text", await ev(`document.querySelectorAll('[role="dialog"] .font-mono span[class*="text-"]').length > 40`), "");
await shot("04-modal-json");
verifyPayload("A", await grabPayload("json"), { lines: 8, approxStandard: 134194069, payable: 0, blocking: 1 });
await ev(`__qa.clickText('button','CEISA Interchange XML')`);
await sleep(300);
const xmlFile = await grabPayload("xml");
const xmlText = fs.readFileSync(path.join(DL, xmlFile), "utf8");
const xmlInfo = await ev(
  `(() => { const d = new DOMParser().parseFromString(${JSON.stringify(xmlText)}, 'application/xml');
     return { err: d.querySelectorAll('parsererror').length,
              items: d.getElementsByTagName('Item').length,
              payable: d.querySelector('PayableAfterFacility')?.textContent,
              saving: d.querySelector('FacilitySaving')?.textContent }; })()`,
  "xml parse",
);
check("A: CEISA XML is well-formed", xmlInfo.err === 0, JSON.stringify(xmlInfo));
check("A: XML carries all 8 filed lines", xmlInfo.items === 8, "");
check("A: XML payable equals the KPI figure", Number(xmlInfo.payable) === 0, String(xmlInfo.payable));
await shot("04-modal-xml");

/* cross-panel focus link */
await ev(`__qa.clickText('button','Close')`);
await sleep(300);
const scrollBefore = await ev(`document.querySelector('.dotgrid').scrollTop`);
await ev(`__qa.rowEls()[5].click()`);
await sleep(700);
const scrollAfter = await ev(`document.querySelector('.dotgrid').scrollTop`);
check("clicking a row scrolls the viewer to its detection", scrollAfter !== scrollBefore, `${scrollBefore} → ${scrollAfter}`);
check(
  "the focused detection gets a ring",
  await ev(
    `(() => { const b = document.querySelector('.paper-shadow .animate-draw[title^="POS 6"]'); return !!b && getComputedStyle(b).boxShadow !== 'none'; })()`,
  ),
  "",
);
await shot("05-row-focus");

/* HS override */
const rate0 = await ev(`__qa.rows()[0].rates`);
const saved0 = await ev(`__qa.cardText('FTZ Exemption Savings')`);
await ev(`__qa.pick('ovr-smp-1','8471.50.00')`);
await sleep(500);
const rate1 = await ev(`__qa.rows()[0].rates`);
check("override recalculates the line's duty split", rate0 !== rate1, `${rate0} → ${rate1}`);
check("override is labelled on the row", /broker override/.test(await ev(`__qa.norm(__qa.rowEls()[0].children[2].innerText)`)), "");
check("override changes the roll-up saving card", saved0 !== (await ev(`__qa.cardText('FTZ Exemption Savings')`)), `${saved0} → ${await ev(`__qa.cardText('FTZ Exemption Savings')`)}`);
check("override raises a toast", /re-mapped to 8471\.50\.00/.test(await ev(`__qa.toasts()`)), "");
await shot("06-override");

await ev(`__qa.clickText('button','Reset overrides')`);
await sleep(400);
check("reset restores the agent's top pick", (await ev(`__qa.rows()[0].rates`)) === rate0, "");

/* selection mechanics */
await ev(`__qa.rowEls()[0].querySelector('input[type=checkbox]').click()`);
await sleep(350);
check("unchecking a line shrinks the filing set", /^lines filed 7\/8/i.test(await ev(`__qa.filed()`)), await ev(`__qa.filed()`));
const cifAfterUncheck = await ev(`__qa.cardText('Total CIF Value')`);
check("CIF card flags the reduced filing set", /7\/8 lines/.test(cifAfterUncheck ?? ""), cifAfterUncheck);
await ev(`__qa.clickText('button','Select all')`);
await sleep(350);
check("select-all restores 8/8", /^lines filed 8\/8/i.test(await ev(`__qa.filed()`)), await ev(`__qa.filed()`));

/* ---------- fixture B — Shenzhen, TPBD release + pre-border lartas ---------- */
await ev(`__qa.pick('demo-invoice','gt')`);
await sleep(250);
check("fixture switch resets to the staged state", /Awaiting analysis/.test(await ev(`document.body.innerText`)), "");
await ev(`__qa.clickText('button','Analyze & Map to BTKI Tariff')`);
await sleep(1700);
const kpiB = {
  cif: await ev(`__qa.cardText('Total CIF Value')`),
  payable: await ev(`__qa.cardText('Final Duty Payable')`),
  payableValue: await ev(`__qa.cardValue('Final Duty Payable')`),
  saved: await ev(`__qa.cardText('FTZ Exemption Savings')`),
  savedValue: await ev(`__qa.cardValue('FTZ Exemption Savings')`),
  risk: await ev(`__qa.cardText('Lartas / Regulatory Alerts')`),
};
console.log("KPI B:", JSON.stringify(kpiB, null, 1));
const tagsB = await ev(`__qa.rows().map(r => r.tags).join(' | ')`);
const toastB = await ev(`__qa.toasts()`);
const money = toastB.match(/standard duty Rp ([\d.]+), of which Rp ([\d.]+) avoided/);
check(
  "B: the completion toast separates standard duty from the avoided amount",
  !!money && money[1] !== money[2],
  toastB.slice(0, 170),
);
check("B: 5 lines", (await ev(`__qa.rows().length`)) === 5, "");
check("B: payable is a real residual, not Rp 0", /^Rp /.test(kpiB.payableValue ?? "") && kpiB.payableValue !== "Rp 0", kpiB.payableValue);
check("B: exemption covers less than the whole invoice", /% of standard duty/.test(kpiB.saved ?? "") && !/100% of standard duty/.test(kpiB.saved ?? ""), kpiB.saved);
check("B: partial TPBD release tagged", /Partial TPBD Release/.test(tagsB), "");
check("B: pre-border Lartas tagged and blocking", /Lartas Pre-Border/.test(tagsB) && /block PIB/.test(kpiB.risk ?? ""), kpiB.risk);
check("B: SNI requirement surfaced", /SNI Required/.test(tagsB), "");
check("B: ACFTA Form D recognised for CN origin", /ACFTA/.test(tagsB), "");
check("B: BMAD applies to the CN fastener line", /BMAD/.test(tagsB), "");
await shot("07-fixture-b");

await ev(`__qa.clickText('button','Generate PPFTZ-01 Declaration Payload')`);
await waitFor(`document.querySelector('[role="dialog"]') !== null`, 6000, "modal B");
await sleep(400);
const payloadB = verifyPayload("B", await grabPayload("json"), { lines: 5, blocking: 2 });
check("B: only the TPBD share is payable (25% of line 2)", payloadB.jumlah.harusDibayarIdr > 0 && payloadB.jumlah.harusDibayarIdr < payloadB.jumlah.totalStandarIdr, String(payloadB.jumlah.harusDibayarIdr));
check("B: blocked lines are itemised in the payload", payloadB.validasi.pemblokir.every((b) => b.code === "LARTAS-PRE"), "");
await ev(`__qa.clickText('button','Close')`);
await sleep(250);

/* ---------- fixture C — Johor, origin-triggered AD ---------- */
await ev(`__qa.pick('demo-invoice','jis')`);
await sleep(250);
await ev(`__qa.clickText('button','Analyze & Map to BTKI Tariff')`);
await sleep(1700);
const rowsC = await ev(`__qa.rows().map(r => ({ hs: r.hs, rates: r.rates, tags: r.tags }))`);
const textC = JSON.stringify(rowsC);
console.log("C rows:", textC.slice(0, 900));
check("C: 7 lines", rowsC.length === 7, "");
check("C: BMAD applies to the MY-origin fasteners", /7318\.15\.90[\s\S]{0,260}BMAD/.test(textC), "");
check("C: same invoice, bearings from MY are AD-free", !/8482\.10\.11[\s\S]{0,260}BMAD/.test(textC), "");
check("C: ATIGA Form E used for MY origin", /ATIGA/.test(textC), "");
check("C: no pre-border blockers, so filing is clear", !/blocked/.test(textC.replace("filable", "")), "");
await shot("08-fixture-c");
verifyPayload("C", await (async () => {
  await ev(`__qa.clickText('button','Generate PPFTZ-01 Declaration Payload')`);
  await waitFor(`document.querySelector('[role="dialog"]') !== null`, 6000, "modal C");
  await sleep(400);
  const f = await grabPayload("json");
  await ev(`__qa.clickText('button','Close')`);
  await sleep(200);
  return f;
})(), { lines: 7, blocking: 0 });

/* ---------- drag-and-drop upload ---------- */
await ev(
  `(() => {
     const dt = new DataTransfer();
     dt.items.add(new File([new Uint8Array(4096)], 'Johor-pneumatic-valve-manifest.pdf', { type: 'application/pdf' }));
     const zone = document.querySelector('div[role="button"]');
     zone.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
     zone.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
     return zone ? 1 : 0;
   })()`,
  "drop",
);
await sleep(600);
const dropState = await ev(`({
   chip: __qa.norm([...document.querySelectorAll('div,span')].find(e => e.className.includes('truncate') && e.innerText && e.innerText.includes('Johor-pneumatic-valve-manifest'))?.innerText || ''),
   bar: !!document.querySelector('[role="button"] .size-6'),
   banner: /ships no OCR backend/.test(document.body.innerText),
   fixture: document.getElementById('demo-invoice').value,
   toast: /staged locally/.test(__qa.toasts())
 })`);
check("dropzone stages a dropped PDF", dropState.chip.includes("Johor-pneumatic-valve-manifest.pdf"), dropState.chip);
check("the dropzone collapses to a compact bar once staged", dropState.bar === true && (await ev(`Math.round(document.querySelector('[role="button"]').getBoundingClientRect().height)`)) <= 48, "");
check("uploaded document is honest about the demo grammar", dropState.banner === true, "");
check("keyword match routes to the Johor fixture", dropState.fixture === "jis", dropState.fixture);
check("staging raises a toast", dropState.toast === true, "");
await shot("09-upload-drop");

await ev(
  `(() => { const dt = new DataTransfer();
     dt.items.add(new File([new Uint8Array(64)], 'meeting-notes.docx', { type: 'application/vnd.openxmlformats-officedocument' }));
     document.querySelector('div[role="button"]').dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
     return 1; })()`,
);
await sleep(450);
check("unsupported type is refused", /Document rejected/.test(await ev(`__qa.toasts()`)), "");

/* ---------- clipboard ---------- */
await ev(`__qa.clickText('button','Generate PPFTZ-01 Declaration Payload')`);
await waitFor(`document.querySelector('[role="dialog"]') !== null`, 6000, "modal copy");
await sleep(300);
await ev(`__qa.clickText('button','Copy to clipboard')`);
await sleep(700);
const copyToast = await ev(`__qa.toasts()`);
check("copy reports a definite outcome", /copied|Clipboard blocked/i.test(copyToast), copyToast.slice(0, 140));
await shot("10-copy-toast");
await ev(`document.querySelector('[role="dialog"]').parentElement.click()`);
await waitFor(`document.querySelector('[role="dialog"]') === null`, 5000, "modal close via backdrop");
check("backdrop click closes the modal", true, "");

/* ---------- layout architecture + responsive ---------- */
const layoutAt = async (w, h) => {
  await setViewport(w, h);
  await sleep(650);
  return {
    overflow: await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`),
    panels: await ev(`__qa.rects()`),
    tabs: await ev(`getComputedStyle(document.querySelector('nav')).display`),
    cta: await ev(`__qa.inViewport('button','Generate PPFTZ-01 Declaration Payload')`),
    analyze: await ev(`__qa.inViewport('button','Map to BTKI Tariff')`),
    sticky: await ev(`(() => { const th = document.querySelector('thead th'); return th ? getComputedStyle(th).position : 'none'; })()`),
    editor: await ev(`(() => {
      const s = document.querySelector('tr[data-line] select');
      if (!s) return null;
      const w = s.closest('table').parentElement.getBoundingClientRect();
      const r = s.getBoundingClientRect();
      return { right: Math.round(r.right), limit: Math.round(w.right), ok: r.right <= w.right + 1 && r.left >= w.left - 1 };
    })()`),
    tableX: await ev(`(() => { const t = document.querySelector('table'); if (!t) return -1; const w = t.parentElement; return w.scrollWidth - w.clientWidth; })()`),
    nav: await ev(`(() => {
      const h = document.querySelector('header').getBoundingClientRect();
      const r = [...document.querySelectorAll('header *')].map((e) => e.getBoundingClientRect()).filter((b) => b.width);
      return {
        h: Math.round(h.height),
        spill: Math.round(Math.max(...r.map((b) => b.right)) - h.right),
        above: Math.round(h.top - Math.min(...r.map((b) => b.top))),
      };
    })()`),
  };
};

for (const [w, h, tag] of [
  [1440, 900, "11-1440"],
  [1280, 800, "12-1280"],
  [1100, 900, "13-1100"],
  [1024, 860, "16-1024"],
]) {
  const L = await layoutAt(w, h);
  check(`no horizontal overflow at ${w}px`, L.overflow <= 1, `overflow ${L.overflow}px`);
  check(
    `navbar holds one unclipped row at ${w}px`,
    L.nav.h === 56 && L.nav.spill <= 0 && L.nav.above <= 0,
    JSON.stringify(L.nav),
  );
  check(
    `both panels render side-by-side at ${w}px`,
    L.panels.length === 2 && L.panels.every((p) => p.display !== "none") && L.panels[1].x > L.panels[0].x + 100,
    JSON.stringify(L.panels),
  );
  const share = L.panels[0].w / (L.panels[0].w + L.panels[1].w);
  check(`source panel holds ~38% of the width at ${w}px`, Math.abs(share - 0.38) < 0.02, `${(share * 100).toFixed(1)}%`);
  check(`tab bar is hidden at ${w}px`, L.tabs === "none", L.tabs);
  check(`primary CTA stays inside the viewport at ${w}px`, L.cta.ok === true, JSON.stringify(L.cta));
  check(`analyze CTA stays inside the viewport at ${w}px`, L.analyze.ok === true, JSON.stringify(L.analyze));
  check(`sticky table header is in effect at ${w}px`, L.sticky === "sticky", L.sticky);
  check(`HS editor is reachable without scrolling the table at ${w}px`, L.editor?.ok === true, JSON.stringify(L.editor));
  if (w >= 1440)
    check(
      `declaration table needs no horizontal scroll at ${w}px`,
      L.tableX <= 2,
      `table scroll ${L.tableX}px`,
    );
  await shot(tag);
}

await setViewport(900, 980);
await sleep(650);
check(
  "tab bar takes over below the lg breakpoint",
  (await ev(`getComputedStyle(document.querySelector('nav')).display`)) !== "none",
  "",
);
check(
  "only one panel renders at 900px",
  (await ev(`__qa.rects().map(p => p.display).join(',')`)) === "flex,none",
  await ev(`__qa.rects().map(p => p.display).join(',')`),
);
check("no horizontal overflow at 900px", (await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`)) <= 1, "");
const navFit = await ev(`(() => {
  const h = document.querySelector('header').getBoundingClientRect();
  const r = [...document.querySelectorAll('header *')].map((e) => e.getBoundingClientRect()).filter((b) => b.width);
  return {
    headerH: Math.round(h.height),
    spill: Math.round(Math.max(...r.map((b) => b.right)) - h.right),
    tallest: Math.round(Math.max(...r.map((b) => b.height))),
  };
})()`);
check(
  "navbar degrades to one unclipped row at 900px",
  navFit.headerH === 56 && navFit.spill <= 0 && navFit.tallest <= 40,
  JSON.stringify(navFit),
);
check(
  "source panel is the default tab",
  (await ev(`[...document.querySelectorAll('[data-tab]')].find(b => b.getAttribute('aria-pressed') === 'true')?.dataset.tab`)) === "source",
  "",
);
await shot("14-narrow-source");
await ev(`__qa.clickText('button','Customs Declaration')`);
await sleep(550);
const swapped = await ev(`__qa.rects().map(p => p.display).join(',')`);
check("the declaration tab swaps the panels", swapped === "none,flex", swapped);
check(
  "declaration CTA is reachable on the mobile tab",
  (await ev(`__qa.inViewport('button','Generate PPFTZ-01 Declaration Payload')`)).ok === true,
  "",
);
await shot("15-narrow-declaration");

await setViewport(1680, 1050);
await ev(`__qa.clickText('button','Invoice & Source')`);
await sleep(400);

// Chrome's own component installer writes into the download dir; keep the artifacts folder to payload files only
const noise = fs.readdirSync(DL).filter((f) => !/\.(json|xml)$/.test(f));
if (noise.length) {
  console.log(`   pruned ${noise.length} browser-side file(s) from downloads: ${noise.join(", ")}`);
  for (const f of noise) fs.rmSync(path.join(DL, f), { force: true });
}

check("no console errors during the run", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" || "));

console.log(`\n${pass}/${pass + fail} checks passed${fail ? ` — ${fail} FAILED` : ""}`);
ws.close();
chrome.kill();
process.exit(fail ? 1 : 0);
