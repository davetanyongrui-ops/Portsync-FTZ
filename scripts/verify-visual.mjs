/** DOM-level verification of the colour + imagery pass. */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = "C://Program Files//Google//Chrome//Application//chrome.exe";
const PORT = 9356;
const PROFILE = path.join(os.tmpdir(), "visual-profile");
const APP_URL = "http://localhost:5179/#/home";
fs.rmSync(PROFILE, { recursive: true, force: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { const { resolve, reject } = p.get(m.id); p.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); } };
const send = (method, params = {}, sessionId) => { const i = ++id; return new Promise((resolve, reject) => { p.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); }); };
const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const S = (m, pa) => send(m, pa, sessionId);
const ev = async (expr) => (await S("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

await S("Page.enable"); await S("Runtime.enable");
await S("Page.navigate", { url: APP_URL });
await sleep(2000);

// images decode and are substantive
const imgs = await ev(`Promise.all([...document.querySelectorAll("img")].map(async (i) => {
  try { await i.decode(); } catch { return { src: i.src, ok: false }; }
  return { src: i.currentSrc.split("/").pop(), ok: i.naturalWidth > 400, w: i.naturalWidth };
}))`);
check("hero illustration loads", imgs.some((i) => i.src.startsWith("hero-terminal") && i.ok), JSON.stringify(imgs));

// NO gradients anywhere — flat editorial, by request
const gradCount = await ev(`(() => {
  let n = 0;
  for (const el of document.querySelectorAll("body *")) {
    const bi = getComputedStyle(el).backgroundImage;
    if (bi && bi.includes("linear-gradient") && !bi.includes("var(--line)")) n++;
  }
  return n;
})()`);
check("no decorative gradients on the page", gradCount === 0, `${gradCount} elements with linear-gradient`);

// closing band: white text on dark image
const band = await ev(`(() => {
  const h = [...document.querySelectorAll("h2")].find(x => /Bring your own invoice/.test(x.textContent));
  if (!h) return null;
  const sec = h.closest("section");
  return getComputedStyle(h).color + " | bg:" + getComputedStyle(sec).backgroundColor + " | img:" + (sec.querySelector("img") ? "yes" : "no");
})()`);
check("closing band is flat solid ink with paper text", /250, 249, 246/.test(band || "") && /img:no/.test(band || ""), band);

// single remaining image: the hero illustration, framed with a flat caption
const caption = await ev(`(() => {
  const fig = document.querySelector("figure");
  const cap = fig?.querySelector("figcaption");
  return cap ? cap.textContent.trim().slice(0, 40) : "none";
})()`);
check("hero figure keeps flat caption bar", /ILLUSTRATION/.test(caption || ""), caption);

// responsive: no horizontal overflow at phone width
await S("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await sleep(700);
const over390 = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
check("no horizontal overflow at 390", over390 <= 1, `${over390}px`);
await S("Emulation.setDeviceMetricsOverride", { width: 768, height: 1024, deviceScaleFactor: 1, mobile: true });
await sleep(700);
const over768 = await ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
check("no horizontal overflow at 768", over768 <= 1, `${over768}px`);

console.log(`\n${pass} passed, ${fail} failed`);
ws.close(); chrome.kill();
process.exit(fail ? 1 : 0);
