/**
 * Responsive audit.
 *
 * Loads every page at every breakpoint that matters and reports, per viewport:
 *   - horizontal overflow of the document itself
 *   - the specific elements that stick out past the right edge
 *   - undersized tap targets
 *
 *   npm run dev            # port 5179
 *   node scripts/responsive.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9377;
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, ".qa-responsive");
const PROFILE = path.join(os.tmpdir(), "portsync-resp-profile");
const BASE = "http://localhost:5179/";

const WIDTHS = [320, 360, 390, 414, 480, 640, 768, 834, 1024, 1180, 1280, 1440, 1920];
const PAGES = [
  ["terminal", "#/"],
  ["home", "#/home"],
  ["features", "#/features"],
  ["pricing", "#/pricing"],
  ["contact", "#/contact"],
  ["sources", "#/sources"],
  ["login", "#/login"],
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(PROFILE, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
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
  } catch { /* not up yet */ }
  await sleep(250);
}
if (!wsUrl) throw new Error("Chrome did not expose CDP");

const ws = new WebSocket(wsUrl);
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
const send = (method, params = {}, sessionId) => {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
};

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

await S("Page.enable");
await S("Runtime.enable");
await S("Emulation.setDeviceMetricsOverride", {
  width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
});

async function evaluate(expr) {
  const r = await S("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { __error: r.exceptionDetails.text };
  return r.result.value;
}

/** Injected auditor: finds elements whose box extends past the viewport. */
const AUDIT = `(() => {
  const vw = document.documentElement.clientWidth;
  const docOverflow = document.documentElement.scrollWidth - vw;

  // An element that lives inside a horizontal scroller is *supposed* to be wider
  // than the viewport — the user scrolls to it. Only count genuine leaks.
  const inScroller = (el) => {
    let p = el.parentElement;
    while (p && p !== document.body) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') return true;
      p = p.parentElement;
    }
    return false;
  };

  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue;
    if (r.right > vw + 1 && !inScroller(el)) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 90),
        text: (el.textContent || '').trim().slice(0, 40),
        right: Math.round(r.right),
        width: Math.round(r.width),
      });
    }
  }

  // small tap targets among interactive elements (touch widths only)
  const small = [];
  if (vw < 768) {
    for (const el of document.querySelectorAll('button, a, [role="button"], input, select')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (getComputedStyle(el).visibility === 'hidden') continue;
      if (r.height < 24) {
        small.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24),
          w: Math.round(r.width), h: Math.round(r.height),
        });
      }
    }
  }

  return { vw, docOverflow, offenders: offenders.slice(0, 8), small: small.slice(0, 8) };
})()`;

const report = [];

for (const width of WIDTHS) {
  const mobile = width < 768;
  await S("Emulation.setDeviceMetricsOverride", {
    width, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile,
  });

  for (const [name, hash] of PAGES) {
    await S("Page.navigate", { url: BASE + hash });
    await sleep(900);
    const res = await evaluate(AUDIT);
    if (res && !res.__error) {
      report.push({ width, page: name, ...res });
    }
    const { data } = await S("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUT, `${String(width).padStart(4, "0")}-${name}.png`), Buffer.from(data, "base64"));
  }
}

// ------------------------------------------------------------------ findings
let problems = 0;
for (const width of WIDTHS) {
  const rows = report.filter((r) => r.width === width);
  const bad = rows.filter((r) => r.docOverflow > 0 || r.offenders.length > 0);
  const small = rows.filter((r) => r.small.length > 0);
  if (bad.length === 0 && small.length === 0) {
    console.log(`PASS ${width}px — all pages clean`);
    continue;
  }
  problems += bad.length + small.length;
  for (const r of bad) {
    console.log(`FAIL ${width}px ${r.page} — doc overflow ${r.docOverflow}px`);
    for (const o of r.offenders) {
      console.log(`       <${o.tag}> right=${o.right} w=${o.width} "${o.text}" .${o.cls}`);
    }
  }
  for (const r of small) {
    console.log(`WARN ${width}px ${r.page} — ${r.small.length} small tap target(s)`);
    for (const t of r.small.slice(0, 3)) {
      console.log(`       <${t.tag}> ${t.w}x${t.h} "${t.text}"`);
    }
  }
}

// ------------------------------------------------- loaded-document pass
// The empty terminal hides most layout problems: the real test is a parsed
// consignment with a table, a document preview and a summary strip.
const DOC = path.join(ROOT, ".qa-test", "invoice.png");
if (fs.existsSync(DOC)) {
  console.log("\n— with a parsed document —");
  for (const width of [390, 768, 1024, 1280, 1440]) {
    const mobile = width < 768;
    await S("Emulation.setDeviceMetricsOverride", {
      width, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile,
    });
    await S("Page.navigate", { url: BASE + "#/" });
    await sleep(1400);

    const { root } = await S("DOM.getDocument", { depth: -1 });
    const { nodeId } = await S("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' });
    if (nodeId) {
      await S("DOM.setFileInputFiles", { nodeId, files: [DOC] });
      // wait for OCR + parse
      for (let i = 0; i < 60; i++) {
        await sleep(1000);
        const t = await evaluate("document.body.innerText");
        if (typeof t === "string" && /Linear motion guide/i.test(t) && !/Reading the image|Loading the OCR engine/i.test(t)) break;
      }
      // Only click when the engine has not already run — a manual "Re-classify"
      // would push a second toast and make the screenshot misrepresent the flow.
      const runBtn = await evaluate(`(() => {
        const b = [...document.querySelectorAll('button')].find(x => /Analyze\\s*&\\s*map/i.test(x.textContent || ''));
        if (!b || b.disabled) return false; b.click(); return true;
      })()`);
      if (runBtn) await sleep(2200);
    }

    const res = await evaluate(AUDIT);
    if (res && !res.__error) {
      const bad = res.docOverflow > 0 || res.offenders.length > 0;
      console.log(`${bad ? "FAIL" : "PASS"} ${width}px terminal+document — overflow ${res.docOverflow}px`);
      for (const o of res.offenders) {
        console.log(`       <${o.tag}> right=${o.right} w=${o.width} "${o.text}" .${o.cls}`);
      }
    }

    const { data } = await S("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(OUT, `${String(width).padStart(4, "0")}-terminal-doc.png`), Buffer.from(data, "base64"));

    // also capture the declaration view on the tabbed layouts
    if (width < 1024) {
      await evaluate(`(() => {
        const t = document.querySelector('[data-tab="declaration"]');
        if (t) t.click();
      })()`);
      await sleep(800);
      const { data: d2 } = await S("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(OUT, `${String(width).padStart(4, "0")}-terminal-doc-decl.png`), Buffer.from(d2, "base64"));
    }
  }
}

console.log(`\n${report.length} page-loads audited, ${problems} issue group(s)`);
ws.close();
chrome.kill();
process.exit(0);
