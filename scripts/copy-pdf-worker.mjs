/**
 * Copy the pristine pdf.js worker into public/ so it is served without any
 * Vite transform. Required for dev: the dev transform pipeline injects an
 * `import ... from "/@vite/client"` preamble into files served from
 * /node_modules/, and that import cannot resolve inside a Blob-URL module
 * worker — pdf.js then falls back to the fake worker and hangs.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs");
const DEST = path.join(ROOT, "public", "pdf.worker.mjs");

fs.copyFileSync(SRC, DEST);
console.log(`copied pdf.worker.mjs → public/ (${(fs.statSync(DEST).size / 1e6).toFixed(1)} MB)`);
