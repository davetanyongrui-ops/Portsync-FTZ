/**
 * Statutory customs exchange rates (Kurs Keputusan Menteri Keuangan).
 * Deterministic for official Batam Customs PPFTZ declaration arithmetic.
 */
export const FX = {
  USD_IDR: 16200,
  SGD_IDR: 12150,
  USD_SGD: 1.3333,
};

export const FX_DELTA = {
  USD_IDR: 0,
  SGD_IDR: 0,
};

let listeners: Array<() => void> = [];
export function subscribeFx(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

export function refreshFx(): boolean {
  listeners.forEach((l) => l());
  return true;
}
