/**
 * Writes .qa-test/invoice.png — a photograph-style invoice with no text layer,
 * so the terminal has to OCR it. Used by the responsive and verify harnesses.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9388;
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, ".qa-test");
const PROFILE = path.join(os.tmpdir(), "portsync-gen-profile");

fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(PROFILE, { recursive: true, force: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROWS = [
  ["Linear motion guide HSR25", "120", "PCS", "42.50", "5,100.00"],
  ["Stainless steel flange DN50", "300", "PCS", "8.20", "2,460.00"],
  ["Office chair mesh back", "80", "PCS", "56.00", "4,480.00"],
  ["Ethyl alcohol 96 percent", "40", "LTR", "12.00", "480.00"],
  ["Ball bearing 6205 ZZ", "500", "PCS", "3.10", "1,550.00"],
  ["Hydraulic hose assembly 1in", "60", "MTR", "9.40", "564.00"],
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1754">
  <rect width="1240" height="1754" fill="#ffffff"/>
  <g font-family="Helvetica, Arial, sans-serif" fill="#111">
    <text x="60" y="78" font-size="29" font-weight="bold">NINGBO HANLIN PRECISION CO., LTD.</text>
    <text x="60" y="108" font-size="16">No. 288 Jiangnan Road, Beilun District, Ningbo, Zhejiang, China</text>
    <text x="60" y="148" font-size="25" font-weight="bold">COMMERCIAL INVOICE</text>
    <text x="60" y="178" font-size="16">Invoice No: HL-2026-0417    Date: 2026-04-17</text>
    <text x="60" y="204" font-size="16">Country of Origin: CHINA</text>
    <text x="60" y="230" font-size="16">Consignee: PT BATAM TEKNIK MANDIRI, Batam, Indonesia</text>
    <text x="60" y="268" font-size="16" font-weight="bold">Description</text>
    <text x="660" y="268" font-size="16" font-weight="bold">Qty</text>
    <text x="770" y="268" font-size="16" font-weight="bold">Unit</text>
    <text x="880" y="268" font-size="16" font-weight="bold">Unit Price</text>
    <text x="1055" y="268" font-size="16" font-weight="bold">Amount</text>
    <line x1="60" y1="280" x2="1180" y2="280" stroke="#111" stroke-width="2"/>
    ${ROWS.map((r, i) => {
      const y = 314 + i * 34;
      return `<text x="60" y="${y}" font-size="15">${r[0]}</text>
      <text x="660" y="${y}" font-size="15">${r[1]}</text>
      <text x="770" y="${y}" font-size="15">${r[2]}</text>
      <text x="880" y="${y}" font-size="15">${r[3]}</text>
      <text x="1055" y="${y}" font-size="15">${r[4]}</text>`;
    }).join("\n    ")}
    <line x1="60" y1="530" x2="1180" y2="530" stroke="#111" stroke-width="1"/>
    <text x="880" y="564" font-size="16" font-weight="bold">Total FOB</text>
    <text x="1055" y="564" font-size="16" font-weight="bold">14,634.00</text>
    <text x="880" y="594" font-size="16">Freight</text>
    <text x="1055" y="594" font-size="16">1,850.00</text>
    <text x="880" y="622" font-size="16">Insurance</text>
    <text x="1055" y="622" font-size="16">89.00</text>
    <text x="880" y="656" font-size="17" font-weight="bold">Total CIF</text>
    <text x="1055" y="656" font-size="17" font-weight="bold">16,573.00</text>
  </g>
</svg>`;

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    "--no-first-run",
    "--hide-scrollbars",
    "--window-size=1240,1754",
    "about:blank",
  ],
  { stdio: "ignore" },
);

let wsUrl;
for (let i = 0; i < 80; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    const j = await r.json();
    if (j.webSocketDebuggerUrl) { wsUrl = j.webSocketDebuggerUrl; break; }
  } catch { /* not up */ }
  await sleep(250);
}

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
};
const send = (method, params = {}, sessionId) => {
  const i = ++id;
  return new Promise((resolve, reject) => {
    pending.set(i, { resolve, reject });
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
};

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S("Page.enable");
await S("Emulation.setDeviceMetricsOverride", { width: 1240, height: 1754, deviceScaleFactor: 1, mobile: false });
await S("Page.navigate", { url: "data:text/html,<body style='margin:0'>" + encodeURIComponent(svg) + "</body>" });
await sleep(900);
const { data } = await S("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
const file = path.join(OUT, "invoice.png");
fs.writeFileSync(file, Buffer.from(data, "base64"));
console.log(`wrote ${file} (${Math.round(fs.statSync(file).size / 1024)} kB)`);

ws.close();
chrome.kill();
process.exit(0);
