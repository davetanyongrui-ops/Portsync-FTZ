/**
 * ES2025 typed-array hex methods, polyfilled because pdf.js 6.4 fingerprints
 * documents with `Uint8Array.prototype.toHex()` — an API recent engines ship
 * but older browsers do not. The PDF *worker* realm gets the same polyfill
 * prepended to its source in `ocr.ts`; this covers the main thread.
 */

declare global {
  interface Uint8Array {
    toHex(): string;
  }
  interface Uint8ArrayConstructor {
    fromHex(hex: string): Uint8Array;
  }
}

const proto = Uint8Array.prototype as Uint8Array & Partial<Record<"toHex", () => string>>;
const ctor = Uint8Array as Uint8ArrayConstructor & Partial<Record<"fromHex", (hex: string) => Uint8Array>>;

if (typeof proto.toHex !== "function") {
  proto.toHex = function (this: Uint8Array) {
    let out = "";
    for (let i = 0; i < this.length; i++) out += (this[i] ?? 0).toString(16).padStart(2, "0");
    return out;
  };
}
if (typeof ctor.fromHex !== "function") {
  ctor.fromHex = function (hex: string) {
    const clean = hex.length % 2 ? hex.slice(0, -1) : hex;
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
    return out;
  };
}

export {};
