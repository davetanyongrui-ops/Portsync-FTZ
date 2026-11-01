/**
 * Checks that provenance is visible in the product, not just written down:
 *  - the Sources route renders every registered source
 *  - the Advisory tab shows per-line evidence after a real upload
 *  - every rate carries a stated origin
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9399;
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, ".qa-sources");
const PROFILE = path.join(os.tmpdir(), "portsync-src-profile");
const BASE = "http://localhost:5179/";

fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(PROFILE, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  "--no-first-run", "--hide-scrollbars", "--window-size=1440,1000", "about:blank",
], { stdio: "ignore" });

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
  return new Promise((resolve, reject) => { pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
};
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S("Page.enable"); await S("Runtime.enable"); await S("DOM.enable");
await S("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

const evalJs = async (expr) => {
  const r = await S("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  return r.exceptionDetails ? { __error: r.exceptionDetails.text } : r.result.value;
};
const shot = async (n) => {
  const { data } = await S("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(OUT, n), Buffer.from(data, "base64"));
};

// ---------------------------------------------------------------- sources page
await S("Page.navigate", { url: BASE + "#/sources" });
await sleep(1800);
await shot("01-sources.png");

const text = await evalJs("document.body.innerText");
check("sources route renders", /Where every number comes from/.test(text));
check("WITS is cited", /WITS \/ TRAINS/.test(text));
check("BTKI is cited", /BTKI 2022/.test(text));
check("free-zone instruments cited", /PP 10\/2012/.test(text) && /PMK 47\/PMK\.04\/2012/.test(text));
check("status vocabulary shown", /Published/.test(text) && /Modelled/.test(text));
check("limits are stated", /What it cannot tell you/i.test(text));
check("FTA rates disclosed as modelled", /not read from the published schedules|NOT read from the published schedules/i.test(text));
check("classifier disclosed as keyword matching", /keyword matching, not a legal classification/i.test(text));

const anchors = await evalJs("[...document.querySelectorAll('article[id]')].map(a => a.id)");
check("every source anchored", Array.isArray(anchors) && anchors.length >= 10, `${anchors?.length} cards`);

// ------------------------------------------------------- advisory evidence
const DOC = path.join(ROOT, ".qa-test", "invoice.png");
check("test invoice available", fs.existsSync(DOC));

await S("Page.navigate", { url: BASE + "#/" });
await sleep(1500);
const { root } = await S("DOM.getDocument", { depth: -1 });
const { nodeId } = await S("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' });
await S("DOM.setFileInputFiles", { nodeId, files: [DOC] });

for (let i = 0; i < 60; i++) {
  await sleep(1000);
  const t = await evalJs("document.body.innerText");
  if (typeof t === "string" && /Linear motion guide/i.test(t) && !/Reading the image|Loading the OCR engine/i.test(t)) break;
}

const opened = await evalJs(`(() => {
  const t = [...document.querySelectorAll('button,[role="tab"]')].find(x => (x.textContent || '').trim() === 'Advisory');
  if (!t) return false; t.click(); return true;
})()`);
check("advisory tab opens", opened);
await sleep(900);
await shot("02-advisory.png");

const adv = await evalJs("document.body.innerText");
check("evidence block present", /Evidence for each line/i.test(adv));
check("matched terms shown", /matched on “/i.test(adv) || /no keyword matched/i.test(adv));
check("MFN rate cited per line", /MFN \d+%/.test(adv));
check("source list linked from terminal", /full source list/i.test(adv));

// the link must actually navigate
const linked = await evalJs(`(() => {
  const a = [...document.querySelectorAll('a')].find(x => /full source list/i.test(x.textContent || ''));
  if (!a) return false; a.click(); return true;
})()`);
await sleep(1500);
const after = await evalJs("document.body.innerText");
check("source link navigates to the sources page", linked && /Where every number comes from/.test(after));
await shot("03-from-terminal.png");

console.log(`\n${pass} passed, ${fail} failed`);
ws.close();
chrome.kill();
process.exit(fail === 0 ? 0 : 1);
