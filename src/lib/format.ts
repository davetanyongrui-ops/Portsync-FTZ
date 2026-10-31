const idr0 = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const idr2 = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const qty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });

export const fmtIdr = (n: number) => `Rp ${idr0.format(Math.round(n))}`;
export const fmtIdrExact = (n: number) => `Rp ${idr2.format(n)}`;
export const fmtUsd = (n: number) => `$ ${usd2.format(n)}`;
export const fmtUsd0 = (n: number) => `$ ${usd0.format(n)}`;
export const fmtQty = (n: number) => qty.format(n);

export const fmtPct = (r: number, digits = 0) => `${(r * 100).toFixed(digits)}%`;

/** Indonesian standardized currency format: Miliar (>= 1 Mrd), Juta (>= 1 Jt), Ribu (>= 1 Rb). */
export function fmtIdrShort(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1_000_000_000) return `${sign}Rp ${(a / 1_000_000_000).toFixed(2)} Miliar`;
  if (a >= 1_000_000) return `${sign}Rp ${(a / 1_000_000).toFixed(1)} Juta`;
  if (a >= 1_000) return `${sign}Rp ${Math.round(a / 1000)} Ribu`;
  return `${sign}Rp ${Math.round(a)}`;
}

export function fmtDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function fmtClock(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}
