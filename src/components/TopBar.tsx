import { useEffect, useState } from "react";
import { Anchor, Clock, Moon, RefreshCw, ShieldCheck, Sun, TrendingUp, X } from "lucide-react";
import { KPB, OPERATOR } from "../data/constants";
import { LIVE_MARKET_FX, fetchLiveRates, refreshFx, subscribeFx } from "../lib/fx";
import { fmtClock } from "../lib/format";
import { cn } from "../lib/cn";
import { Btn, Pill } from "./ui";
import type { AuthUser } from "../lib/auth";

function Rate({
  pair,
  value,
  delta,
  onClick,
}: {
  pair: string;
  value: string;
  delta: string;
  onClick?: () => void;
}) {
  const down = delta.startsWith("-");
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-baseline gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
      title="Click to view Live Market Spot vs Statutory KMK Customs Rates"
    >
      <span className="font-mono text-[11px] tracking-tight text-slate-500 dark:text-zinc-400">{pair}</span>
      <span className="tnum text-[12.5px] font-semibold text-slate-900 dark:text-zinc-100">{value}</span>
      <span
        className={cn(
          "tnum text-[10.5px] font-medium inline-flex items-center gap-0.5",
          down ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400",
        )}
      >
        {down ? "−" : "+"}
        {delta.replace(/^[+-]/, "")}
      </span>
    </button>
  );
}

export function TopBar({
  agent,
  user,
  theme = "light",
  onToggleTheme,
}: {
  agent: { text: string; tone: "idle" | "busy" | "ready" };
  user?: AuthUser | null;
  onLogout?: () => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const [, force] = useState(0);
  const [showFxModal, setShowFxModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = subscribeFx(() => force((n) => n + 1));
    refreshFx();
    const interval = setInterval(() => refreshFx(), 30000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveRates();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const displayName = user?.name || OPERATOR.user;
  const displayRole = user?.role || OPERATOR.role;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "DT";

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 text-slate-800 shadow-2xs backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90 dark:text-zinc-100 sm:px-4 xl:px-6 sm:gap-3 xl:gap-5">
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
        <div className="grid size-8 place-items-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.12)] dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400">
          <Anchor size={16} strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold tracking-tight text-slate-900 dark:text-white">PortSync FTZ</span>
            <span className="rounded border border-emerald-500/30 bg-emerald-50 px-1.5 py-px font-mono text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              v1.0
            </span>
          </div>
          <div className="hidden text-[11px] text-slate-500 dark:text-zinc-400 xl:block">Batam Automated Customs &amp; Tariff Agent</div>
        </div>
      </div>

      <div className="hidden h-6 w-px shrink-0 bg-slate-200 dark:bg-zinc-800 md:block" />

      <div className="hidden shrink-0 items-center gap-2.5 xl:gap-4 md:flex">
        <span className="flex items-center gap-2">
          <span className="relative grid size-2 place-items-center">
            <span className="absolute size-2 animate-blip rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span className="size-2 rounded-full bg-emerald-500/40" />
          </span>
          <span className="hidden text-[11px] font-medium tracking-wider text-slate-500 uppercase 2xl:inline dark:text-zinc-400">
            Kurs KMK 16.200
          </span>
        </span>
        <div className="rounded-md border border-slate-200 bg-slate-50/80 px-2 py-1 font-mono text-xs text-slate-800 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
          <Rate
            pair="USD/IDR"
            value={LIVE_MARKET_FX.spotUsdIdr.toLocaleString("id-ID")}
            delta={LIVE_MARKET_FX.deltaUsdPct}
            onClick={() => setShowFxModal(true)}
          />
        </div>
        <div className="hidden h-4 w-px bg-slate-200 dark:bg-zinc-800 lg:block" />
        <div className="hidden rounded-md border border-slate-200 bg-slate-50/80 px-2 py-1 font-mono text-xs text-slate-800 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 lg:block">
          <Rate
            pair="SGD/IDR"
            value={LIVE_MARKET_FX.spotSgdIdr.toLocaleString("id-ID")}
            delta={LIVE_MARKET_FX.deltaSgdPct}
            onClick={() => setShowFxModal(true)}
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-[11.5px] font-medium text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
            title={`Switch to ${theme === "light" ? "Dark" : "Bright"} theme`}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <>
                <Moon size={13} className="text-slate-600" />
                <span className="hidden md:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun size={13} className="text-amber-400" />
                <span className="hidden md:inline">Bright</span>
              </>
            )}
          </button>
        )}

        <div
          className="hidden items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-1.5 dark:bg-emerald-500/10 2xl:flex"
          title={`${KPB.regulation} · ${KPB.customsOffice}`}
        >
          <ShieldCheck size={14} strokeWidth={2.2} className="text-emerald-600 dark:text-emerald-400" />
          <div className="leading-tight">
            <div className="text-[12px] whitespace-nowrap font-medium text-emerald-800 dark:text-emerald-300">{KPB.region}</div>
            <div className="tnum text-[10.5px] whitespace-nowrap text-slate-500 dark:text-zinc-400">
              {KPB.kodeKawasan} · {KPB.authority}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
          <span
            className={cn(
              "size-1.5 rounded-full",
              agent.tone === "busy" ? "animate-blip bg-blue-500 dark:bg-cyan-400" : agent.tone === "ready" ? "bg-emerald-500 dark:bg-emerald-400" : "bg-slate-400 dark:bg-zinc-500",
            )}
          />
          <span className="hidden text-[12px] whitespace-nowrap text-slate-700 sm:inline dark:text-zinc-300">{agent.text}</span>
        </div>

        <div className="hidden items-center gap-1.5 text-slate-500 2xl:flex dark:text-zinc-400">
          <Clock size={13} />
          <span className="tnum text-[12px] text-slate-700 dark:text-zinc-300">{fmtClock(now)} WIB</span>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 py-1 pr-3 pl-1 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="grid size-7 place-items-center rounded-md bg-emerald-100 text-[11px] font-bold text-emerald-800 dark:bg-zinc-800 dark:text-emerald-400">
            {initials}
          </div>
          <div className="hidden leading-tight 2xl:block">
            <div className="text-[12px] font-medium text-slate-800 dark:text-zinc-200">{displayName}</div>
            <div className="text-[10.5px] text-slate-500 dark:text-zinc-400">{displayRole}</div>
          </div>
        </div>

        <Pill tone="mut" className="shrink-0" title="This build never transmits to a customs system.">
          SANDBOX
        </Pill>
      </div>

      {showFxModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowFxModal(false)}
        >
          <div
            className="animate-pop w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-lg border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-zinc-100">
                    Live FX Rates &amp; Statutory Customs KMK
                  </h3>
                  <div className="text-[11.5px] text-slate-500 dark:text-zinc-400">
                    Auto-polled every 30s · Last updated {LIVE_MARKET_FX.lastUpdated} WIB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFxModal(false)}
                className="grid size-7 place-items-center rounded-md border border-slate-200 text-slate-400 hover:text-slate-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span>USD / IDR</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                    LIVE SPOT MARKET
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-zinc-100">
                  Rp {LIVE_MARKET_FX.spotUsdIdr.toLocaleString("id-ID")}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Intraday Movement:</span>
                  <span className="font-mono">{LIVE_MARKET_FX.deltaUsdPct}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-zinc-800/80 flex items-center justify-between text-[11.5px] text-slate-600 dark:text-zinc-400">
                  <span>Statutory KMK Rate:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">Rp 16.200</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10.5px] text-slate-500 dark:text-zinc-500">
                  <span>Spread vs KMK:</span>
                  <span className="font-mono font-medium text-amber-700 dark:text-amber-400">
                    +Rp {(LIVE_MARKET_FX.spotUsdIdr - 16200).toLocaleString("id-ID")} (+{(((LIVE_MARKET_FX.spotUsdIdr - 16200) / 16200) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  <span>SGD / IDR</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                    LIVE SPOT MARKET
                  </span>
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-zinc-100">
                  Rp {LIVE_MARKET_FX.spotSgdIdr.toLocaleString("id-ID")}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Intraday Movement:</span>
                  <span className="font-mono">{LIVE_MARKET_FX.deltaSgdPct}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-zinc-800/80 flex items-center justify-between text-[11.5px] text-slate-600 dark:text-zinc-400">
                  <span>Statutory KMK Rate:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">Rp 12.150</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10.5px] text-slate-500 dark:text-zinc-500">
                  <span>Spread vs KMK:</span>
                  <span className="font-mono font-medium text-amber-700 dark:text-amber-400">
                    +Rp {(LIVE_MARKET_FX.spotSgdIdr - 12150).toLocaleString("id-ID")} (+{(((LIVE_MARKET_FX.spotSgdIdr - 12150) / 12150) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-50/60 p-3 text-[11.5px] leading-relaxed text-slate-700 dark:border-cyan-500/30 dark:bg-cyan-950/30 dark:text-zinc-300">
              <span className="font-semibold text-blue-900 dark:text-cyan-300">Why are there two exchange rates?</span>
              <ul className="mt-1.5 space-y-1 list-disc list-inside">
                <li><strong className="text-slate-800 dark:text-zinc-200">Live Spot Market (18k+ / 14k+):</strong> Real-time interbank forex rate used by commercial banks and importers to pay international suppliers.</li>
                <li><strong className="text-slate-800 dark:text-zinc-200">Statutory Kurs KMK (16.200 / 12.150):</strong> Under Indonesian customs regulation (PP No. 41/2021 jo. PMK Kepabeanan), PPFTZ-01 and PIB customs declarations legally calculate Bea Masuk and PPN using the active Ministry of Finance decree rate (Kurs Pajak Kemenkeu).</li>
              </ul>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200 transition-colors disabled:opacity-60 cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Fetching Rates…" : "Refresh Live Rates"}
              </button>
              <Btn size="sm" variant="primary" onClick={() => setShowFxModal(false)}>
                Done
              </Btn>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
