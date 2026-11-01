/**
 * End-to-end regression for the document that failed to parse:
 * "Shenzhen GreenTech Commercial Invoice & Manifest.pdf".
 *
 * The complaint: "Nothing to declare — no line with a quantity and a unit."
 * Root causes were (1) a wrapped column header whose "TOTAL CIF" baseline
 * tripped the totals break before any row, (2) table rows spread across five
 * baselines so no single line carried qty+unit+price, and (3) a lone prose
 * number ("Rated 1500 V DC") divided out into a phantom price.
 *
 * This drives the real file input in the real app with the real file.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9351;
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, ".qa-test");
const PROFILE = path.join(os.tmpdir(), "sgt-verify-profile");
const APP_URL = "http://localhost:5179/";
const PDF = "C:\\Users\\davet\\Downloads\\Shenzhen GreenTech Commercial Invoice & Manifest.pdf";

fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(PROFILE, { recursive: true, force: true });

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
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) reject(new Error(JSON.stringify(m.error)));
    else resolve(m.result);
  }
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
const evalJs = async (expr) => {
  const r = await S("Runtime.evaluate", { expression: expr, returnByValue: true });
  return r.result.value;
};
const shot = async (name) => {
  const { data } = await S("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, name), Buffer.from(data, "base64"));
};

await S("Page.enable");
await S("Runtime.enable");
await S("Page.navigate", { url: APP_URL });
await sleep(1500);

const { root } = await S("DOM.getDocument", { depth: -1 });
const { nodeId } = await S("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' });
check("file input present", !!nodeId);
await S("DOM.setFileInputFiles", { nodeId, files: [PDF] });

let text = "";
let ready = false;
for (let i = 0; i < 30; i++) {
  await sleep(1000);
  text = await evalJs("document.body.innerText");
  if (/String inverter/i.test(text) && !/Reading the (image|PDF)/i.test(text)) { ready = true; break; }
}
check("document parsed to line items (no Nothing to declare)", ready);
check("failure toast not shown", !/Nothing to declare/i.test(text));
await shot("sgt-parsed.png");

check("row 01 inverter read", /String inverter 100 kW/i.test(text));
check("row 02 battery cabinet read", /LiFePO4 battery cabinet/i.test(text));
check("row 03 LFP cells read", /Lithium iron phosphate raw cells/i.test(text));
check("row 04 PV cable read", /PV DC cable/i.test(text));
check("row 05 fastener kit read", /Rail bolt, earth lug/i.test(text));

// qty and unit must come from the QTY/UNIT column, not the gross weight column.
const engineRan = await evalJs(`(() => {
  const b = [...document.querySelectorAll('button')]
    .find(x => /Analyze\\s*&\\s*map|Re-classify/i.test(x.textContent || ''));
  if (!b) return false;
  b.click();
  return true;
})()`);
check("engine trigger available and clicked", engineRan);
await sleep(2500);

// Summary is the default right-panel tab; the declaration table lives on Lines.
await evalJs(`[...document.querySelectorAll('button')].find(b => /^Lines \\(\\d*\\)?$/.test((b.textContent || '').trim()))?.click()`);
await sleep(500);
await shot("sgt-declaration.png");

const decl = await evalJs("document.body.innerText");
check("origin read as China", /CN\b|China/i.test(decl));

// The chosen heading per line is each row's <select> value; the surrounding
// row text identifies the line. Dropdown options list the whole register, so
// scanning raw text for "8506" is meaningless — read the selection itself.
const rowPick = await evalJs(`(() => {
  return [...document.querySelectorAll('table tbody tr')].map((tr) => {
    const sel = tr.querySelector('select');
    if (!sel) return null;
    return {
      hs: sel.value,
      row: tr.innerText.replace(/\\s+/g, ' ').slice(0, 160),
    };
  }).filter(Boolean);
})()`);
check("five declaration rows", rowPick.length === 5, `${rowPick.length} rows`);
check("inverter under static converters 8504", rowPick.some((r) => /^8504/.test(r.hs) && /String inverter/i.test(r.row)), rowPick.map((r) => r.hs).join(", "));
check("battery cabinet under accumulators 8507", rowPick.some((r) => /^8507/.test(r.hs) && /battery cabinet/i.test(r.row)));
check("LFP cells under accumulators 8507, not primary cells 8506", rowPick.some((r) => /^8507/.test(r.hs) && /Lithium iron phosphate/i.test(r.row)));
check("cable under insulated conductors 8544", rowPick.some((r) => /^8544/.test(r.hs) && /PV DC cable/i.test(r.row)));
check("fasteners under screws/bolts 7318", rowPick.some((r) => /^7318/.test(r.hs) && /Rail bolt/i.test(r.row)));

console.log(`\n${pass} passed, ${fail} failed`);
ws.close();
chrome.kill();
process.exit(fail ? 1 : 0);
