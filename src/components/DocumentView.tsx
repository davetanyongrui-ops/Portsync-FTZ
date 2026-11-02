import { useEffect, useRef, useState } from "react";
import { FileText, Minus, Plus } from "lucide-react";
import { openPdf } from "../lib/ocr";
import { cn } from "../lib/cn";

/**
 * The document the user actually handed us.
 *
 * The previous build re-drew a synthetic invoice from the parsed values and
 * presented it in the same slot, which is worse than useless: it looks like the
 * source but is not, so a wrong OCR read becomes invisible. This renders the
 * real file — PDF pages rasterised by pdf.js, or the image as-is.
 */
export function DocumentView({
  file,
  activePos,
  className,
}: {
  file: File;
  activePos?: number | null;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pages, setPages] = useState<HTMLCanvasElement[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPages([]);
    setImageUrl(null);

    (async () => {
      try {
        if (!isPdf) {
          const url = URL.createObjectURL(file);
          if (!cancelled) {
            setImageUrl(url);
            setLoading(false);
          }
          return;
        }

        const buf = await file.arrayBuffer();
        // Must go through the shared loader: the polyfilled worker is what
        // makes preview rendering work on engines without the ES2025 Map and
        // typed-array methods pdf.js 6.4 uses.
        const pdf = await openPdf(buf);
        const out: HTMLCanvasElement[] = [];

        for (let i = 1; i <= pdf.numPages; i += 1) {
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          // Render at 2× so the preview stays sharp when zoomed in.
          const scale = Math.min(3, Math.max(1.2, (1200 / base.width) * 1.6));
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          out.push(canvas);
          if (cancelled) return;
        }
        if (!cancelled) {
          setPages(out);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "The document could not be rendered.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, isPdf]);

  // Release the object URL when the image changes.
  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const usable = Math.max(120, width - 24);
  const fit = pages[0] ? usable / pages[0].width : 1;
  const scale = zoom === 1 ? fit : fit * zoom;

  const zoomBtn =
    "grid size-6 cursor-pointer place-items-center rounded-[3px] text-ink-3 transition-colors hover:bg-sunken hover:text-ink disabled:cursor-default disabled:opacity-40";

  return (
    <div className="overflow-hidden rounded-[6px] border border-line bg-surface">
      <div className="flex h-8 items-center gap-1.5 border-b border-line px-2">
        <FileText size={11} className="shrink-0 text-ink-3" />
        <span className="min-w-0 flex-1 truncate text-[11px] text-ink-2" title={file.name}>
          {file.name}
        </span>
        <span className="shrink-0 rounded-[2px] bg-sunken px-1 font-mono text-[9px] tracking-wide text-ink-3 uppercase">
          original
        </span>
        <button
          type="button"
          className={zoomBtn}
          onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          disabled={zoom <= 1}
          aria-label="Zoom out"
        >
          <Minus size={11} />
        </button>
        <span className="tnum w-8 shrink-0 text-center font-mono text-[10px] text-ink-3">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          className={zoomBtn}
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          disabled={zoom >= 3}
          aria-label="Zoom in"
        >
          <Plus size={11} />
        </button>
      </div>

      <div ref={hostRef} className={cn("scroll-thin max-h-[46vh] overflow-auto bg-sunken/70 p-3", className)}>
        {loading && <div className="py-8 text-center font-mono text-[10.5px] text-ink-3">rendering document…</div>}

        {error && (
          <div className="px-2 py-6 text-center text-[11px] leading-relaxed text-bad">
            {error}
            <div className="mt-1 text-ink-3">The file is still parsed; only the preview failed.</div>
          </div>
        )}

        {imageUrl && (
          <img
            src={imageUrl}
            alt={file.name}
            className="mx-auto block max-w-none rounded-[2px] shadow-[0_1px_2px_rgb(23_24_26/0.08),0_8px_24px_-12px_rgb(23_24_26/0.18)]"
            style={{ width: usable }}
          />
        )}

        {pages.map((canvas, i) => (
          <div
            key={i}
            className="mx-auto mb-3 last:mb-0"
            style={{ width: canvas.width * scale, height: canvas.height * scale }}
          >
            <canvas
              ref={(el) => {
                if (!el || el.dataset.painted === "1") return;
                el.width = canvas.width;
                el.height = canvas.height;
                el.style.width = "100%";
                el.style.height = "100%";
                el.getContext("2d")?.drawImage(canvas, 0, 0);
                el.dataset.painted = "1";
              }}
              className="block rounded-[2px] shadow-[0_1px_2px_rgb(23_24_26/0.08),0_8px_24px_-12px_rgb(23_24_26/0.18)]"
            />
          </div>
        ))}
      </div>

      {activePos != null && (
        <div className="border-t border-line px-2 py-1 font-mono text-[10px] text-ink-3">
          POS {String(activePos).padStart(2, "0")} selected · coordinates are not overlaid on the original
        </div>
      )}
    </div>
  );
}
