/**
 * Currency & Customs Valuation
 *
 * Two distinct things live here and they must not be confused:
 *
 * 1. `FX` — the statutory customs valuation rate ("kurs pabean"). Indonesian duty
 *    is computed on the rate the Minister of Finance publishes for the relevant
 *    period, NOT on the market spot rate. Every rupiah figure in the declaration
 *    uses this. It is a reference value in this build: before filing, replace it
 *    with the KMK rate in force for the week of entry.
 *
 * 2. `LIVE_MARKET_FX` — market spot, display only. It is fetched from a public
 *    FX endpoint and is never used to compute duty. When the request fails the
 *    indicator says so; it does not invent a movement.
 */

export const FX = {
  /** Reference kurs pabean. Substitute the KMK rate for the week of entry. */
  USD_IDR: 16200,
  SGD_IDR: 12150,
  USD_SGD: 1.3333,
} as const;

export interface LiveMarketFx {
  spotUsdIdr: number;
  spotSgdIdr: number;
  /** Signed change since the previous observation, or null when unknown. */
  deltaUsd: number | null;
  deltaSgd: number | null;
  deltaUsdPct: string | null;
  deltaSgdPct: string | null;
  lastUpdated: string | null;
  isLive: boolean;
  source: string;
}

export const LIVE_MARKET_FX: LiveMarketFx = {
  // Until a real observation arrives these mirror the statutory rate, and the
  // UI labels them as a reference rather than a quote.
  spotUsdIdr: FX.USD_IDR,
  spotSgdIdr: FX.SGD_IDR,
  deltaUsd: null,
  deltaSgd: null,
  deltaUsdPct: null,
  deltaSgdPct: null,
  lastUpdated: null,
  isLive: false,
  source: "reference rate — no market quote retrieved",
};

let listeners: Array<() => void> = [];

export function subscribeFx(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

let isFetching = false;

function pct(delta: number, base: number): string {
  return `${delta >= 0 ? "+" : ""}${((delta / base) * 100).toFixed(2)}%`;
}

export async function fetchLiveRates(): Promise<boolean> {
  if (isFetching) return false;
  isFetching = true;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`FX endpoint returned ${res.status}`);

    const data = await res.json();
    const rawUsd = Number(data?.rates?.IDR);
    const rawSgd = Number(data?.rates?.SGD);
    if (!Number.isFinite(rawUsd) || !Number.isFinite(rawSgd) || rawSgd <= 0) {
      throw new Error("FX payload did not contain usable USD/IDR and USD/SGD rates");
    }

    const spotUsd = Math.round(rawUsd);
    const spotSgd = Math.round(rawUsd / rawSgd);

    // A delta only exists once we have a previous genuine observation.
    const hadPrevious = LIVE_MARKET_FX.lastUpdated !== null;
    const prevUsd = LIVE_MARKET_FX.spotUsdIdr;
    const prevSgd = LIVE_MARKET_FX.spotSgdIdr;

    LIVE_MARKET_FX.spotUsdIdr = spotUsd;
    LIVE_MARKET_FX.spotSgdIdr = spotSgd;

    if (hadPrevious) {
      LIVE_MARKET_FX.deltaUsd = spotUsd - prevUsd;
      LIVE_MARKET_FX.deltaSgd = spotSgd - prevSgd;
      LIVE_MARKET_FX.deltaUsdPct = pct(spotUsd - prevUsd, prevUsd);
      LIVE_MARKET_FX.deltaSgdPct = pct(spotSgd - prevSgd, prevSgd);
    } else {
      LIVE_MARKET_FX.deltaUsd = null;
      LIVE_MARKET_FX.deltaSgd = null;
      LIVE_MARKET_FX.deltaUsdPct = null;
      LIVE_MARKET_FX.deltaSgdPct = null;
    }

    LIVE_MARKET_FX.lastUpdated = new Date().toISOString();
    LIVE_MARKET_FX.isLive = true;
    LIVE_MARKET_FX.source = "open.er-api.com";

    listeners.forEach((l) => l());
    return true;
  } catch (err) {
    // Report the failure. Never synthesise a quote.
    LIVE_MARKET_FX.isLive = false;
    LIVE_MARKET_FX.source = `market quote unavailable (${err instanceof Error ? err.message : "network error"})`;
    listeners.forEach((l) => l());
    return false;
  } finally {
    isFetching = false;
  }
}

export function refreshFx(): boolean {
  void fetchLiveRates();
  return true;
}

if (typeof window !== "undefined") {
  setTimeout(() => void fetchLiveRates(), 1000);
  setInterval(() => void fetchLiveRates(), 60000);
}
