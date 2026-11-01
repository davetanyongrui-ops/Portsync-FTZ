import * as pdfjsLib from "pdfjs-dist";
import { createWorker, type Worker as TessWorker } from "tesseract.js";

/**
 * pdf.js 6.4 fingerprints documents with `Uint8Array.prototype.toHex()` — an
 * ES2025 method that recent engines ship but older browsers (and Node) do not.
 * Without it the PDF worker throws `hashOriginal.toHex is not a function` and
 * every upload fails. The worker runs in its own realm, so a main-thread
 * polyfill cannot reach it: we prepend one to the worker source and serve the
 * result as a blob URL.
 */
const U8_HEX_POLYFILL = `
if (typeof Uint8Array !== "undefined" && !Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function () {
    let out = "";
    for (let i = 0; i < this.length; i++) out += this[i].toString(16).padStart(2, "0");
    return out;
  };
}
if (typeof Uint8Array !== "undefined" && !Uint8Array.fromHex) {
  Uint8Array.fromHex = function (hex) {
    const clean = hex.length % 2 ? hex.slice(0, -1) : hex;
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
    return out;
  };
}
`;

/**
 * The pristine worker file lives in public/ (copied from node_modules by
 * scripts/copy-pdf-worker.mjs on predev/prebuild). Fetching the node_modules
 * copy through the Vite dev pipeline does not work: dev injects an
 * `import ... from "/@vite/client"` preamble that cannot resolve inside a
 * blob-URL module worker, so pdf.js silently falls back to its fake worker
 * and the read never completes.
 */
const PDF_WORKER_URL = "/pdf.worker.mjs";

let patchedWorkerSrc: Promise<string> | null = null;
async function loadPatchedWorkerSrc(): Promise<string> {
  if (!patchedWorkerSrc) {
    patchedWorkerSrc = (async () => {
      try {
        const res = await fetch(PDF_WORKER_URL);
        if (!res.ok) throw new Error(String(res.status));
        const src = await res.text();
        const blob = new Blob([`${U8_HEX_POLYFILL}\n${src}`], { type: "text/javascript" });
        return URL.createObjectURL(blob);
      } catch {
        // Same-origin fetch of our own public asset should not fail; if it
        // somehow does, run the unpatched worker rather than none at all.
        return PDF_WORKER_URL;
      }
    })();
  }
  return patchedWorkerSrc;
}

pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

/**
 * Document reading pipeline.
 *
 * Two paths, chosen per document rather than per file type:
 *   1. The PDF carries a text layer  → read it directly (instant, exact).
 *   2. It does not (a scan or a photo) → rasterise each page and run OCR.
 *
 * A mixed PDF (some pages typed, some scanned) is handled page by page, so a
 * 12-page dossier with one scanned annex does not force the whole document
 * through OCR.
 *
 * The Tesseract engine, its WASM core and the English model are served from
 * `/public`, so recognition works with no network access.
 */

export type ExtractPhase = "reading" | "engine" | "rasterise" | "recognise" | "done";

export interface ExtractProgress {
  phase: ExtractPhase;
  /** Human-readable state, e.g. "Recognising page 2 of 4". */
  label: string;
  /** 0–1 across the whole document. */
  pct: number;
}

export interface ExtractedDocument {
  text: string;
  pageTexts: string[];
  pages: number;
  /** How the text was obtained — surfaced in the UI so the user knows what happened. */
  method: "text-layer" | "ocr" | "mixed";
  /** Mean characters per page; a scanned page lands near zero before OCR. */
  meanCharsPerPage: number;
  notes: string[];
}

/** Below this many characters a page is treated as having no usable text layer. */
const MIN_CHARS_PER_PAGE = 120;

/* ------------------------------------------------------------------ */
/* Tesseract worker — created once, reused for every document          */
/* ------------------------------------------------------------------ */

let workerPromise: Promise<TessWorker> | null = null;
/** The active run's progress sink. Rebound per document. */
let emit: (p: ExtractProgress) => void = () => {};

const ENGINE_LABELS: Record<string, string> = {
  "loading tesseract core": "Loading the OCR engine",
  "initializing tesseract": "Initialising the OCR engine",
  "loading language traineddata": "Loading the English model",
  "initializing api": "Preparing the recogniser",
  "recognizing text": "Reading the page",
};

function getWorker(): Promise<TessWorker> {
  if (!workerPromise) {
    workerPromise = createWorker("eng", 1, {
      workerPath: "/tesseract/worker.min.js",
      corePath: "/tesseract/core",
      langPath: "/tessdata",
      gzip: true,
      cacheMethod: "write",
      logger: (m: { status: string; progress: number }) => {
        const label = ENGINE_LABELS[m.status];
        if (!label) return;
        // Engine setup has no page context; recognition is scaled by the caller.
        if (m.status !== "recognizing text") {
          emit({ phase: "engine", label, pct: Math.min(0.2, m.progress * 0.2) });
        }
      },
    }).catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

/** Release the WASM worker when the tab goes away. */
export function disposeOcr() {
  const p = workerPromise;
  workerPromise = null;
  p?.then((w) => w.terminate()).catch(() => {});
}

/* ------------------------------------------------------------------ */
/* Image preparation                                                    */
/* ------------------------------------------------------------------ */

/**
 * Grayscale + contrast stretch. Scans and phone photos arrive with a grey cast
 * and uneven exposure; stretching the histogram measurably improves recognition
 * on the figures, which are the part that must be exact.
 */
function prepareCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;
  const { width, height } = source;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;

  let lo = 255;
  let hi = 0;
  const grey = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < d.length; i += 4, p += 1) {
    const v = (d[i]! * 299 + d[i + 1]! * 587 + d[i + 2]! * 114) / 1000;
    grey[p] = v;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = Math.max(1, hi - lo);
  for (let i = 0, p = 0; i < d.length; i += 4, p += 1) {
    const v = ((grey[p]! - lo) / span) * 255;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return source;
}

/* ------------------------------------------------------------------ */
/* PDF helpers                                                          */
/* ------------------------------------------------------------------ */

async function openPdf(file: File) {
  const buf = await file.arrayBuffer();
  // Swap in the polyfilled worker before the first document opens.
  pdfjsLib.GlobalWorkerOptions.workerSrc = await loadPatchedWorkerSrc();
  return pdfjsLib.getDocument({ data: buf, useSystemFonts: true }).promise;
}

/** Group text items into visual lines by their baseline. */
function pageTextFromItems(content: { items: unknown[] }): string {
  const lines: string[] = [];
  let current: string[] = [];
  let lastY: number | null = null;

  for (const raw of content.items) {
    if (typeof raw !== "object" || raw === null || !("str" in raw)) continue;
    const item = raw as { str: string; transform?: number[] };
    const y =
      item.transform && typeof item.transform[5] === "number"
        ? Math.round(item.transform[5])
        : null;
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

async function rasterise(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNo: number,
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNo);
  const base = page.getViewport({ scale: 1 });
  // ~1800 px wide is roughly 220 dpi for A4 — the point where Tesseract stops
  // gaining accuracy but memory use keeps climbing.
  const scale = Math.min(3, Math.max(1.4, 1800 / base.width));
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas;
}

async function imageToCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = () => rej(new Error("The image could not be decoded."));
      el.src = url;
    });
    // Phone photos are often far larger than needed; upscale tiny crops instead.
    const target = Math.min(2200, Math.max(1400, img.naturalWidth));
    const scale = target / img.naturalWidth;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ------------------------------------------------------------------ */
/* Public entry point                                                   */
/* ------------------------------------------------------------------ */

export async function extractDocument(
  file: File,
  onProgress: (p: ExtractProgress) => void = () => {},
): Promise<ExtractedDocument> {
  emit = onProgress;
  const notes: string[] = [];
  const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";

  if (!isPdf) {
    emit({ phase: "engine", label: "Loading the OCR engine", pct: 0.04 });
    const canvas = await imageToCanvas(file);
    const worker = await getWorker();
    emit({ phase: "recognise", label: "Reading the image", pct: 0.25 });
    const { data } = await worker.recognize(prepareCanvas(canvas));
    emit({ phase: "done", label: "Done", pct: 1 });
    notes.push(
      "Read with OCR from an image — verify figures against the original before filing.",
    );
    const text = data.text ?? "";
    return {
      text,
      pageTexts: [text],
      pages: 1,
      method: "ocr",
      meanCharsPerPage: text.length,
      notes,
    };
  }

  emit({ phase: "reading", label: "Opening the PDF", pct: 0.02 });
  const pdf = await openPdf(file);
  const pages = pdf.numPages;

  // Pass 1 — collect whatever text layer exists.
  const pageTexts: string[] = [];
  for (let i = 1; i <= pages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pageTexts.push(pageTextFromItems(content as { items: unknown[] }));
    emit({
      phase: "reading",
      label: `Reading text layer ${i} of ${pages}`,
      pct: 0.02 + (i / pages) * 0.28,
    });
  }

  const totalChars = pageTexts.reduce((n, t) => n + t.replace(/\s/g, "").length, 0);
  const meanCharsPerPage = Math.round(totalChars / Math.max(1, pages));
  const needsOcr = pageTexts.map(
    (t) => t.replace(/\s/g, "").length < MIN_CHARS_PER_PAGE,
  );
  const ocrCount = needsOcr.filter(Boolean).length;

  if (ocrCount === 0) {
    emit({ phase: "done", label: "Done", pct: 1 });
    return {
      text: pageTexts.join("\n"),
      pageTexts,
      pages,
      method: "text-layer",
      meanCharsPerPage,
      notes,
    };
  }

  if (meanCharsPerPage > MIN_CHARS_PER_PAGE && ocrCount < pages) {
    notes.push(
      `${ocrCount} of ${pages} pages had no text layer and were read with OCR.`,
    );
  }

  // Pass 2 — OCR only the pages without a usable text layer.
  emit({
    phase: "engine",
    label: `Loading the OCR engine for ${ocrCount} scanned page${ocrCount > 1 ? "s" : ""}`,
    pct: 0.3,
  });
  const worker = await getWorker();

  let done = 0;
  for (let i = 0; i < pages; i += 1) {
    if (!needsOcr[i]) continue;
    const pageNo = i + 1;
    emit({
      phase: "rasterise",
      label: `Rendering page ${pageNo}`,
      pct: 0.3 + (done / ocrCount) * 0.65,
    });
    const canvas = await rasterise(pdf, pageNo);

    emit({
      phase: "recognise",
      label: `Recognising page ${pageNo} of ${pages}`,
      pct: 0.3 + (done / ocrCount) * 0.65,
    });
    const { data } = await worker.recognize(prepareCanvas(canvas));
    pageTexts[i] = data.text ?? "";
    done += 1;
    emit({
      phase: "recognise",
      label: `Recognising page ${pageNo} of ${pages}`,
      pct: 0.3 + (done / ocrCount) * 0.65,
    });
  }

  emit({ phase: "done", label: "Done", pct: 1 });

  const method: ExtractedDocument["method"] =
    ocrCount === pages ? "ocr" : "mixed";
  if (method === "ocr") {
    notes.push(
      "This PDF has no text layer — every page was read with OCR. Check the figures.",
    );
  }

  return {
    text: pageTexts.join("\n"),
    pageTexts,
    pages,
    method,
    meanCharsPerPage,
    notes,
  };
}
