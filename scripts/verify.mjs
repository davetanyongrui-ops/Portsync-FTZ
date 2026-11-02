/**
 * Verification pass for the honesty sweep:
 *  - idle terminal copy no longer cites a regulation that does not exist
 *  - OCR still reads a scanned image and the tariff still prices it
 *  - destination switch still moves money between KPBPB and TLDDP
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9344;
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, ".qa2");
const PROFILE = path.join(os.tmpdir(), "portsync-verify-profile");
const APP_URL = "http://localhost:5179/";

fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(PROFILE, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--window-size=1440,900",
  "--hide-scrollbars",
  "about:blank",
], { stdio: "ignore" });

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const j = await r.json();
      if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error("Chrome did not expose a CDP endpoint");
}

const ws = new WebSocket(await wsUrl());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let msgId = 0;
const pending = new Map();
const events = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) reject(new Error(JSON.stringify(m.error)));
    else resolve(m.result);
  } else if (m.method) events.push(m);
};
function send(method, params = {}, sessionId) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

await S("Page.enable");
await S("Runtime.enable");
await S("DOM.enable");

async function goto(url) {
  await S("Page.navigate", { url });
  await sleep(2600);
}
async function evalJs(expr) {
  const r = await S("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " :: " + expr.slice(0, 120));
  return r.result.value;
}
/** Wait until the app has actually mounted (file input exists) — fixed sleeps race on cold machines. */
async function waitReady(maxMs = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    if (await evalJs(`!!document.querySelector('input[type="file"]')`)) return true;
    await sleep(500);
  }
  return false;
}
async function gotoLines() {
  // Poll until the tab button exists, then click — the default tab is Summary.
  const t0 = Date.now();
  while (Date.now() - t0 < 10000) {
    const clicked = await evalJs(`(() => {
      const b = [...document.querySelectorAll('button')].find(b => /^Lines \\(\\d*\\)?$/.test((b.textContent || '').trim()));
      if (!b) return false;
      b.click();
      return true;
    })()`);
    if (clicked) break;
    await sleep(500);
  }
  await sleep(350);
}
async function shot(name) {
  const { data } = await S("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, name), Buffer.from(data, "base64"));
}

// ---------------------------------------------------------------- idle state
await goto(APP_URL);
if (!(await waitReady())) throw new Error("app never mounted (no file input)");
await sleep(500);
await shot("01-idle.png");

await gotoLines(); // regulatory idle copy lives on the Lines tab now
const bodyText = await evalJs("document.body.innerText");
check("no 'BTKI 2026' in rendered copy", !/BTKI 2026/.test(bodyText));
check("no 'PP 41/2021' in rendered copy", !/PP\s*41\/2021/.test(bodyText));
check("idle copy cites BTKI 2022", /BTKI 2022/.test(bodyText));
check("idle copy cites PP 10/2012", /PP 10\/2012/.test(bodyText));
check("idle copy no longer promises a fixed PPFTZ-01 rate", !/PPFTZ-01 facility rate/.test(bodyText));

// ------------------------------------------------------- scanned invoice OCR
// Build an image-only invoice (no text layer at all) so only OCR can read it.
const invoiceSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1600">
  <rect width="1240" height="1600" fill="#ffffff"/>
  <g font-family="Helvetica, Arial, sans-serif" fill="#111">
    <text x="60" y="80" font-size="30" font-weight="bold">NINGBO HANLIN PRECISION CO., LTD.</text>
    <text x="60" y="112" font-size="17">No. 288 Jiangnan Road, Beilun District, Ningbo, Zhejiang, China</text>
    <text x="60" y="150" font-size="26" font-weight="bold">COMMERCIAL INVOICE</text>
    <text x="60" y="180" font-size="17">Invoice No: HL-2026-0417    Date: 2026-04-17</text>
    <text x="60" y="206" font-size="17">Country of Origin: CHINA</text>
    <text x="60" y="232" font-size="17">Consignee: PT BATAM TEKNIK MANDIRI, Batam, Indonesia</text>
    <text x="60" y="270" font-size="17" font-weight="bold">Description</text>
    <text x="640" y="270" font-size="17" font-weight="bold">Qty</text>
    <text x="760" y="270" font-size="17" font-weight="bold">Unit</text>
    <text x="880" y="270" font-size="17" font-weight="bold">Unit Price</text>
    <text x="1060" y="270" font-size="17" font-weight="bold">Amount</text>
    <line x1="60" y1="282" x2="1180" y2="282" stroke="#111" stroke-width="2"/>
    <text x="60" y="316" font-size="16">Linear motion guide HSR25</text>
    <text x="640" y="316" font-size="16">120</text>
    <text x="760" y="316" font-size="16">PCS</text>
    <text x="880" y="316" font-size="16">42.50</text>
    <text x="1060" y="316" font-size="16">5,100.00</text>
    <text x="60" y="350" font-size="16">Stainless steel flange DN50</text>
    <text x="640" y="350" font-size="16">300</text>
    <text x="760" y="350" font-size="16">PCS</text>
    <text x="880" y="350" font-size="16">8.20</text>
    <text x="1060" y="350" font-size="16">2,460.00</text>
    <text x="60" y="384" font-size="16">Office chair mesh back</text>
    <text x="640" y="384" font-size="16">80</text>
    <text x="760" y="384" font-size="16">PCS</text>
    <text x="880" y="384" font-size="16">56.00</text>
    <text x="1060" y="384" font-size="16">4,480.00</text>
    <text x="60" y="418" font-size="16">Ethyl alcohol 96 percent</text>
    <text x="640" y="418" font-size="16">40</text>
    <text x="760" y="418" font-size="16">LTR</text>
    <text x="880" y="418" font-size="16">12.00</text>
    <text x="1060" y="418" font-size="16">480.00</text>
    <line x1="60" y1="440" x2="1180" y2="440" stroke="#111" stroke-width="1"/>
    <text x="880" y="474" font-size="17" font-weight="bold">Total FOB</text>
    <text x="1060" y="474" font-size="17" font-weight="bold">12,520.00</text>
    <text x="880" y="504" font-size="17">Freight</text>
    <text x="1060" y="504" font-size="17">1,850.00</text>
    <text x="880" y="532" font-size="17">Insurance</text>
    <text x="1060" y="532" font-size="17">89.00</text>
    <text x="880" y="566" font-size="18" font-weight="bold">Total CIF</text>
    <text x="1060" y="566" font-size="18" font-weight="bold">14,459.00</text>
  </g>
</svg>`;

const pngPath = path.join(OUT, "scanned-invoice.png");
// Render the SVG to PNG through the browser itself, then re-load it as a file.
await goto("data:text/html,<body style='margin:0'>" + encodeURIComponent(invoiceSvg) + "</body>");
await sleep(600);
const { data: pngData } = await S("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
fs.writeFileSync(pngPath, Buffer.from(pngData, "base64"));
check("scanned fixture written", fs.statSync(pngPath).size > 20000, `${Math.round(fs.statSync(pngPath).size / 1024)} kB`);

await goto(APP_URL);
if (!(await waitReady())) throw new Error("app never mounted (no file input)");
await sleep(500);

// Hand the file to the real <input type="file"> through CDP.
const { root } = await S("DOM.getDocument", { depth: -1 });
const { nodeId } = await S("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' });
check("file input present", !!nodeId);
await S("DOM.setFileInputFiles", { nodeId, files: [pngPath] });

// Wait for OCR to finish (engine download + recognise).
let ready = false;
for (let i = 0; i < 90; i++) {
  await sleep(1000);
  const t = await evalJs("document.body.innerText");
  if (/Linear motion guide|Stainless steel flange/i.test(t) && !/Reading the image|Loading the OCR engine/i.test(t)) {
    ready = true;
    break;
  }
}
check("OCR produced line items", ready);
await shot("02-ocr-parsed.png");

await gotoLines(); // the Lines table carries origin and heading detail
const after = await evalJs("document.body.innerText");
check("OCR read the guide line", /Linear motion guide/i.test(after));
check("OCR read the flange line", /Stainless steel flange/i.test(after));
check("origin read as China, not defaulted", /(^|\s)CN(\s|$)|CHINA|China/.test(after));
check("OCR badge surfaced", /OCR/.test(after));

// The engine runs automatically once a document parses; the button then reads
// "Re-classify". Accept either, but require the engine to have produced output.
const ranEngine = await evalJs(`(() => {
  const b = [...document.querySelectorAll('button')]
    .find(x => /Analyze\\s*&\\s*map|Re-classify/i.test(x.textContent || ''));
  if (!b) return false;
  b.click();
  return true;
})()`);
check("engine trigger available and clicked", ranEngine);
await sleep(2500);
await shot("03-engine-run.png");

const run = await evalJs("document.body.innerText");
check("engine produced a payable figure", /Payable/i.test(run));
check("register heading assigned", /\b\d{4}\.\d{2}\.\d{2}\b/.test(run));

// Destination switch: KPBPB Batam vs Belawan TLDDP must differ.
const openTab = (label) => evalJs(`(() => {
  const t = [...document.querySelectorAll('button,[role="tab"]')]
    .find(x => (x.textContent || '').trim() === ${JSON.stringify(label)});
  if (!t) return false;
  t.click();
  return true;
})()`);

const pickDestination = (id) => evalJs(`(() => {
  const b = document.querySelector('[data-destination="${id}"]');
  if (!b) return false;
  b.click();
  return true;
})()`);

/** Read a KPI cell in Rp millions, using the data-kpi hook on the summary strip. */
const kpiJuta = (label) => evalJs(`(() => {
  const el = document.querySelector('[data-kpi="${label}"]');
  if (!el) return null;
  const t = el.innerText.replace(/\\s+/g, ' ');
  const m = t.match(/-?Rp\\s*([\\d.,]+)\\s*(Juta|Miliar|Rb)?/);
  if (!m) return null;
  // fmtIdrShort renders "3.4 Juta": dot is the decimal point, comma is thousands.
  const n = Number(m[1].replace(/,/g, ''));
  if (!Number.isFinite(n)) return null;
  const sign = /-/.test(m[0]) ? -1 : 1;
  const scale = m[2] === 'Miliar' ? 1000 : m[2] === 'Juta' ? 1 : m[2] === 'Rb' ? 0.001 : 1 / 1e6;
  return sign * n * scale;
})()`);

const opened = await openTab("Destination");
check("Destination tab opened", opened);
await sleep(700);
await shot("04-destination-tab.png");

const batamPayable = await kpiJuta("Payable");
check("Batam payable readable", typeof batamPayable === "number", `${batamPayable} Rp Juta`);

const belawanPicked = await pickDestination("mdn-belawan");
check("Belawan selected", belawanPicked);
await sleep(1600);
await shot("05-belawan.png");

const belawanText = await evalJs("document.body.innerText");
check("Belawan shown as customs area", /Belawan/i.test(belawanText) && /TLDDP|Daerah Pabean|customs area/i.test(belawanText));
check("direct import declares a PIB, not a free-zone release form",
  /Direct import · PIB/.test(belawanText) && !/Direct import · PPFTZ-03/.test(belawanText));

const belawanPayable = await kpiJuta("Payable");
check("payable differs between Batam and Belawan",
  typeof belawanPayable === "number" && belawanPayable !== batamPayable,
  `Batam ${batamPayable} vs Belawan ${belawanPayable} (Rp Juta)`);
check("Belawan payable exceeds Batam payable", belawanPayable > batamPayable,
  `Batam ${batamPayable} < Belawan ${belawanPayable}`);

// Onward = entered the enclave, then released to the customs area under PPFTZ-03.
// Duty is deferred at entry but falls due in full on release, so the eventual
// amount must match a direct import; what differs is when it is paid and under
// which declaration.
await pickDestination("btm-onward");
await sleep(1500);
await shot("06-onward.png");
const onwardPayable = await kpiJuta("Payable");
const onwardText = await evalJs("document.body.innerText");

check("onward payable matches a direct TLDDP import",
  typeof onwardPayable === "number" && Math.abs(onwardPayable - belawanPayable) < 0.05,
  `onward ${onwardPayable} vs Belawan ${belawanPayable} (Rp Juta)`);
check("onward still costs more than staying in the zone", onwardPayable > batamPayable,
  `${onwardPayable} > ${batamPayable}`);
check("onward declares a release under PPFTZ-03", /PPFTZ-03/.test(onwardText));
check("onward defers nothing at entry", !(await kpiJuta("Deferred in-zone")));

await pickDestination("btm-batuampar");
await sleep(1200);
await shot("07-final.png");

console.log(`\n${pass} passed, ${fail} failed`);
ws.close();
chrome.kill();
process.exit(fail === 0 ? 0 : 1);
