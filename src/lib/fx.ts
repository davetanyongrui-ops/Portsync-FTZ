/** Live FX store shared by the ticker and the duty engine. */
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

export async function refreshFx(): Promise<boolean> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) {
      console.warn("FX fetch failed:", res.status);
      return false;
    }
    const data = await res.json();
    console.log("FX fetched:", data?.result, data?.rates?.IDR, data?.rates?.SGD);
    if (data?.rates?.IDR) {
      const next = Math.round(data.rates.IDR);
      FX_DELTA.USD_IDR = next - FX.USD_IDR;
      FX.USD_IDR = next;
    }
    if (data?.rates?.SGD) {
      const nextSgdIdr = Math.round(data.rates.IDR / data.rates.SGD);
      FX_DELTA.SGD_IDR = nextSgdIdr - FX.SGD_IDR;
      FX.USD_SGD = data.rates.SGD;
      FX.SGD_IDR = nextSgdIdr;
    }
    listeners.forEach((l) => l());
    return true;
  } catch {
    return false;
  }
}