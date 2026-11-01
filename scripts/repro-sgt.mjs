import fs from "node:fs";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// --- 1. exact copy of the app's pageTextFromItems ---
function pageTextFromItems(content) {
  const lines = [];
  let current = [];
  let lastY = null;
  for (const raw of content.items) {
    if (typeof raw !== "object" || raw === null || !("str" in raw)) continue;
    const item = raw;
    const y = item.transform && typeof item.transform[5] === "number" ? Math.round(item.transform[5]) : null;
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 3) {
      if (current.length) lines.push(current.join(" "));
      current = [];
    }
    if (item.str.trim()) current.push(item.str.trim());
    if (y !== null) lastY = y;
  }
  if (current.length) lines.push(current.join(" "));
  return lines.join("\n");
}

const pdfPath = "C:/Users/davet/Downloads/Shenzhen GreenTech Commercial Invoice & Manifest.pdf";
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
let text = "";
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  text += pageTextFromItems(content) + "\n";
}
fs.writeFileSync("/tmp/sgt-text.txt", text);

// --- 2. bundle the real parser and run it ---
execSync(
  "npx esbuild scripts/parser-entry.ts --bundle --format=esm --outfile=.qa-test/parser-bundle.mjs",
  { stdio: "inherit" },
);
const { parseRawInvoice } = await import(pathToFileURL(".qa-test/parser-bundle.mjs").href);
const meta = { fileName: "Shenzhen GreenTech Commercial Invoice & Manifest.pdf", sizeKb: 12, pages: 1, kind: "PDF", method: "text-layer" };
const parsed = parseRawInvoice(text, meta);

// --- assertions: the five rows must land with their QTY/UNIT column figures,
// not the gross-weight column, and prices must reconcile with the line amount.
const expected = [
  { hs: "8504", qty: 24, uom: "PCE", unitPrice: 2380 },
  { hs: "8507", qty: 6, uom: "SET", unitPrice: 18400 },
  { hs: "8507", qty: 18, uom: "CTN", unitPrice: 1240 },
  { hs: "8544", qty: 120, uom: "MTR", unitPrice: 18.6 },
  { hs: "7318", qty: 900, uom: "KGM", unitPrice: 1.85 },
];
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};
check("invoice parses (no Nothing to declare)", parsed !== null);
const lines = parsed?.lines ?? [];
check("five line items", lines.length === 5, `${lines.length}`);
for (let i = 0; i < expected.length; i++) {
  const l = lines[i];
  const e = expected[i];
  check(
    `row ${String(i + 1).padStart(2, "0")}: ${e.qty} ${e.uom} @ $${e.unitPrice} → ${e.hs}`,
    !!l && l.hs.startsWith(e.hs) && l.qty === e.qty && l.uom === e.uom && Math.abs(l.unitCifUsd - e.unitPrice) < 0.01,
    l ? `${l.qty} ${l.uom} @ $${l.unitCifUsd} → ${l.hs}` : "missing",
  );
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
