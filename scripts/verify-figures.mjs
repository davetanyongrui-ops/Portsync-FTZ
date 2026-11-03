/**
 * OCR figure-reconciliation e2e, driven against the deliberately degraded
 * scan (tmp/degraded-scan.jpg — 1.5° skew, 74% scale, JPEG q8) that produced
 * a 100x figure error in manual testing ($5,100.00 read as $510,000.00).
 *
 * Proves three things:
 *   1. the document-level checksum banner appears when line figures disagree
 *      with the total the document states;
 *   2. the mis-recognised row carries the amber "check qty × price" flag;
 *   3. typing the correct figure into the row recomputes the line, clears its
 *      flag and updates every total on screen.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9372;
const PROFILE = path.join(os.tmpdir(), "figures-profile");
const APP_URL = "http://localhost:5179/";
const FILE = path.resolve(import.meta.dirname, "..", "tmp", "degraded-scan.jpg");
const OUT = path.resolve(import.meta.dirname, "..", ".qa-test");
fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(PROFILE, { recursive: true, force: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  "--no-first-run", "--window-size=1440,900", "about:blank",
], { stdio: "ignore" });

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); const j = await r.json(); if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl; } catch {}
    await sleep(250);
  }
  throw new Error("no cdp");
}
const ws = new WebSocket(await wsUrl());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const p = new Map();
ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
const send = (method, params = {}, sessionId) => { const i = ++id; return new Promise((resolve, reject) => { p.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); }); };
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const S = (m, pa) => send(m, pa, sessionId);
const ev = async (expr) => (await S("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
const shot = async (name) => {
  const { data } = await S("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, name), Buffer.from(data, "base64"));
};

await S("Page.enable"); await S("Runtime.enable");
await S("Page.navigate", { url: APP_URL });
for (let i = 0; i < 30; i++) { await sleep(500); if (await ev(`!!document.querySelector('input[type="file"]')`)) break; }

// The first-visit TermsGate overlays the terminal and would swallow the real
// mouse/keyboard events this test drives. Accept it the way a user does.
const gateBtn = await ev(`(() => {
  const b = [...document.querySelectorAll('button')].find(x => /I understand/i.test(x.textContent || ''));
  if (b) { b.click(); return true; }
  return false;
})()`);
if (gateBtn) { await sleep(400); console.log("terms gate accepted"); }

const { root } = await S("DOM.getDocument", { depth: -1 });
const { nodeId } = await S("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' });
await S("DOM.setFileInputFiles", { nodeId, files: [FILE] });

let text = "";
for (let i = 0; i < 90; i++) {
  await sleep(1000);
  text = await ev("document.body.innerText");
  if (/Linear motion guide|Stainless steel flange/i.test(text) && !/Recognising|Loading the OCR/i.test(text)) break;
}
check("degraded scan parsed", /Linear motion guide/i.test(text));

// 1. document-level checksum banner
check(
  "doc-total mismatch banner shown",
  /Figures may contain OCR errors|may have been misread/i.test(text),
);

// 2. switch to Lines and find the flagged row
await ev(`[...document.querySelectorAll('button')].find(b => /^Lines \\(\\d*\\)?$/.test((b.textContent || '').trim()))?.click()`);
await sleep(400);
const flags = await ev(`document.querySelectorAll('[title*="document prints"]').length`);
check("at least one amber check-qty-x-price flag", flags >= 1, `${flags} flagged`);
const before = await ev(`(() => {
  const rows = [...document.querySelectorAll('table tbody tr')];
  const r = rows.find(tr => /motion guide/i.test(tr.innerText));
  return r ? (r.innerText.match(/\\$[\\d,]+\\.\\d\\d/) || ["?"])[0] : "no-row";
})()`);
check("misread line shows the 100x error", /\$510,000/.test(before), before);
await shot("figures-flagged.png");

// 3. correct the unit price in place: 4250 -> 42.50, via real keyboard input
const coords = await ev(`(() => {
  const rows = [...document.querySelectorAll('table tbody tr')];
  const row = rows.find(tr => /motion guide/i.test(tr.innerText));
  const input = [...row.querySelectorAll('input')].find(i => (i.getAttribute('aria-label') || '').includes('Unit price'));
  if (!input) return null;
  input.scrollIntoView({ block: 'center' });
  const b = input.getBoundingClientRect();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
})()`);
check("unit price input located", !!coords, JSON.stringify(coords));
await S("Input.dispatchMouseEvent", { type: "mousePressed", x: coords.x, y: coords.y, button: "left", clickCount: 1 });
await S("Input.dispatchMouseEvent", { type: "mouseReleased", x: coords.x, y: coords.y, button: "left", clickCount: 1 });
await sleep(200);
await S("Input.dispatchKeyEvent", { type: "keyDown", modifiers: 2, key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
await S("Input.dispatchKeyEvent", { type: "keyUp", modifiers: 2, key: "a", code: "KeyA", windowsVirtualKeyCode: 65 });
await S("Input.insertText", { text: "42.5" });
await sleep(200);
await S("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
await S("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
await sleep(900);

const after = await ev(`(() => {
  const rows = [...document.querySelectorAll('table tbody tr')];
  const r = rows.find(tr => /motion guide/i.test(tr.innerText));
  if (!r) return { cif: "?", flagged: 1 };
  return {
    cif: (r.innerText.match(/\\$[\\d,]+\\.\\d\\d/) || ["?"])[0],
    flagged: (r.innerText.match(/check qty × price/g) || []).length,
  };
})()`);
check("corrected line recomputed to $5,100.00", /5,100\.00/.test(String(after.cif)), JSON.stringify(after));
check("flag cleared on the corrected row", (after.flagged ?? 1) === 0);

const totalsAfter = await ev("document.body.innerText");
check("document CIF dropped from 516,940 to 12,040", /12,040\.00/.test(totalsAfter));
await shot("figures-corrected.png");

console.log(`\n${pass} passed, ${fail} failed`);
ws.close(); chrome.kill();
process.exit(fail ? 1 : 0);
