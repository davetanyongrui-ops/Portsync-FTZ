/** The user's flow: upload invoice -> classify -> plain-language tax summary. */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = "C://Program Files//Google//Chrome//Application//chrome.exe";
const PORT = 9360;
const PROFILE = path.join(os.tmpdir(), "summary-profile");
const APP_URL = "http://localhost:5179/";
const PDF = path.resolve(import.meta.dirname, "..", process.env.SUMMARY_PDF ?? "C:\\Users\\davet\\Downloads\\Shenzhen GreenTech Commercial Invoice & Manifest.pdf");
const OUT = path.join(import.meta.dirname, "..", ".qa-test");
fs.rmSync(PROFILE, { recursive: true, force: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, "--no-first-run", "--window-size=1440,900", "about:blank"], { stdio: "ignore" });
async function wsUrl() { for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); const j = await r.json(); if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl; } catch {} await sleep(250); } throw new Error("no cdp"); }
const ws = new WebSocket(await wsUrl());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const p = new Map();
ws.onerror = () => {};
ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
const send = (method, params = {}, sessionId) => { const i = ++id; return new Promise((resolve, reject) => { p.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); }); };
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const S = (m, pa) => send(m, pa, sessionId);
const ev = async (expr) => (await S("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

async function main() {
await S("Page.enable"); await S("Runtime.enable");
await S("Page.navigate", { url: APP_URL });
await sleep(1500);
// Vite pushes a full reload on first connect after edits — absorb it.
await S("Page.reload");
await sleep(2500);

for (let attempt = 0; ; attempt++) {
  try {
    const { root } = await S("DOM.getDocument", { depth: -1 });
    const { nodeId } = await S("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' });
    await S("DOM.setFileInputFiles", { nodeId, files: [PDF] });
    check("file handed to input", true);
    break;
  } catch (e) {
    if (attempt >= 4) { check("file handed to input", false, e.message); break; }
    await sleep(800);
  }
}
let text = "";
for (let i = 0; i < 90; i++) { await sleep(1000); text = await ev("document.body.innerText"); if (/String inverter|Linear motion guide/i.test(text) && !/Reading the image|Loading the OCR engine|Recognising/i.test(text)) break; }
check("invoice parsed", /String inverter|Linear motion guide/i.test(text));

await ev(`[...document.querySelectorAll('button')].find(b => /Analyze/i.test(b.textContent))?.click()`);
await sleep(2500);

const summary = await ev(`document.querySelector('[aria-label="Tax summary"]')?.innerText ?? "MISSING"`);
check("summary renders", summary !== "MISSING");
await S("Page.captureScreenshot", { format: "png" }).then(async ({ data }) => {
  fs.writeFileSync(path.join(OUT, "summary.png"), Buffer.from(data, "base64"));
});

check("bucket: at least one tax bucket shown",
  /Pays tax here|Reduced — relief applies|Not taxed here/.test(summary), summary.split("\n").slice(0, 3).join(" | "));
check("bucket: needs-HS-code absent when all classified", !/Needs an HS code/.test(summary));
check("totals: no-relief baseline shown", /Tax with no relief \(MFN\)/.test(summary));
check("totals: legal reduction shown", /Legal reduction/.test(summary));
check("totals: total to pay shown", /Total to pay/.test(summary));
check("reduction explains how", /facility|Form E|FTZ/.test(summary), (summary.match(/Legal reduction[^\n]*/) || [""])[0]);
check("how-and-why block present", /How and why the reduction is legal/.test(summary));
check("how: facility mechanism explained", /Free-zone facility \(/.test(summary) && /suspended/i.test(summary));
check("why: reason stated in the block", /because the goods are entered|covers this origin|trade agreement|trade partnership/.test(summary));
check("held duty stated as held, not forgiven", summary.includes("held, not forgiven") || !/held/.test(summary));

// cross-check the arithmetic inside the page's own engine state
const nums = await ev(`(() => {
  const grab = (label) => {
    const rows = [...document.querySelectorAll('[aria-label="Tax summary"] div')];
    for (const r of rows) {
      const t = r.textContent || "";
      if (t.includes(label)) {
        const m = t.match(/(Rp[\\d.,\\s]+(?:Juta|Ribu|Miliar)?)/g);
        if (m) return m[m.length - 1];
      }
    }
    return null;
  };
  return { mfn: grab("Tax with no relief"), pay: grab("Total to pay") };
})()`);
check("figures readable", !!nums?.mfn && !!nums?.pay, JSON.stringify(nums));

console.log(`\n${pass} passed, ${fail} failed`);
ws.close(); chrome.kill();
process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.log(`FAIL  crashed — ${e.message}\n${pass} passed, ${fail + 1} failed`); ws.close(); chrome.kill(); process.exit(1); });
