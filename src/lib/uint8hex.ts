/**
 * ES2025 polyfills required by pdf.js 6.4 on engines that predate the spec:
 *
 *   - `Uint8Array.prototype.toHex()` / `Uint8Array.fromHex()` — used to
 *     fingerprint documents.
 *   - `Map.prototype.getOrInsert()` / `getOrInsertComputed()` — the upsert
 *     proposal, used by the rendering/font-caching code. Missing here, a
 *     document still PARSES but every canvas preview fails with
 *     "this[#t].getOrInsertComputed is not a function".
 *
 * The PDF *worker* realm gets the same polyfills prepended to its source in
 * `ocr.ts`; this module covers the main thread.
 */

declare global {
  interface Uint8Array {
    toHex(): string;
  }
  interface Uint8ArrayConstructor {
    fromHex(hex: string): Uint8Array;
  }
  interface Map<K, V> {
    getOrInsert(key: K, value: V): V;
    getOrInsertComputed(key: K, callback: (key: K) => V): V;
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

interface MapExtras {
  getOrInsert?: (key: unknown, value: unknown) => unknown;
  getOrInsertComputed?: (key: unknown, callback: (key: unknown) => unknown) => unknown;
}
const mapProto = Map.prototype as unknown as MapExtras;

if (typeof mapProto.getOrInsert !== "function") {
  mapProto.getOrInsert = function (key, value) {
    const self = this as Map<unknown, unknown>;
    if (!self.has(key)) self.set(key, value);
    return self.get(key);
  };
}
if (typeof mapProto.getOrInsertComputed !== "function") {
  mapProto.getOrInsertComputed = function (key, callback) {
    const self = this as Map<unknown, unknown>;
    if (!self.has(key)) self.set(key, callback(key));
    return self.get(key);
  };
}

export {};
