import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractPdfText(file: File): Promise<string> {
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: buf,
      useSystemFonts: true,
    }).promise;

    let out = "";
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageLines: string[] = [];
      let currentLine: string[] = [];
      let lastY: number | null = null;

      for (const it of content.items) {
        if (!("str" in it)) continue;
        const textItem = it as { str: string; transform?: number[] };
        const y = textItem.transform && typeof textItem.transform[5] === "number" ? Math.round(textItem.transform[5]) : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 3) {
          if (currentLine.length > 0) pageLines.push(currentLine.join(" "));
          currentLine = [];
        }
        if (textItem.str.trim()) currentLine.push(textItem.str.trim());
        if (y !== null) lastY = y;
      }
      if (currentLine.length > 0) pageLines.push(currentLine.join(" "));
      out += pageLines.join("\n") + "\n";
    }
    return out;
  } catch (err) {
    console.warn("PDF extraction fallback / error:", err);
    return "";
  }
}
