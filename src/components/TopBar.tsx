import { useEffect, useState } from "react";
import { Anchor, Clock, ShieldCheck } from "lucide-react";
import { KPB, OPERATOR } from "../data/constants";
import { FX, FX_DELTA, refreshFx, subscribeFx } from "../lib/fx";
import { fmtClock } from "../lib/format";
import { cn } from "../lib/cn";
import { Pill } from "./ui";
import type { AuthUser } from "../lib/auth";

function Rate({ pair, value, delta }: { pair: string; value: string; delta: string }) {
  const down = delta.startsWith("-");
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[11px] tracking-tight text-zinc-400">{pair}</span>
      <span className="tnum text-[13px] font-semibold text-zinc-100">{value}</span>
      <span className={cn("tnum text-[11px] font-medium", down ? "text-rose-400" : "text-emerald-400")}>
        {down ? "−" : "+"}
        {delta.replace(/^[+-]/, "")}
      </span>
    </div>
  );
}

export function TopBar({
  agent,
  user,
}: {
  agent: { text: string; tone: "idle" | "busy" | "ready" };
  user?: AuthUser | null;
  onLogout?: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const [, force] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = subscribeFx(() => force((n) => n + 1));
    refreshFx();
    const interval = setInterval(() => refreshFx(), 60000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

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
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-5 border-b border-zinc-800/80 bg-zinc-950/90 px-6 backdrop-blur-md">
      <div className="flex shrink-0 items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
          <Anchor size={16} strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold tracking-tight text-white">PortSync FTZ</span>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-px font-mono text-[10px] text-emerald-400">
              v1.0
            </span>
          </div>
          <div className="hidden text-[11px] text-zinc-400 xl:block">Batam Automated Customs &amp; Tariff Agent</div>
        </div>
      </div>

      <div className="hidden h-6 w-px shrink-0 bg-zinc-800 md:block" />

      <div className="hidden shrink-0 items-center gap-4 md:flex">
        <span className="flex items-center gap-2">
          <span className="relative grid size-2 place-items-center">
            <span className="absolute size-2 animate-blip rounded-full bg-emerald-400" />
            <span className="size-2 rounded-full bg-emerald-400/40" />
          </span>
          <span className="hidden text-[11px] font-medium tracking-wider text-zinc-400 uppercase 2xl:inline">
            Kurs pabean
          </span>
        </span>
        <div className="rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 font-mono text-xs text-zinc-200">
          <Rate pair="USD/IDR" value={FX.USD_IDR.toLocaleString("id-ID")} delta={String(FX_DELTA.USD_IDR)} />
        </div>
        <div className="hidden h-4 w-px bg-zinc-800 lg:block" />
        <div className="hidden rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 font-mono text-xs text-zinc-200 lg:block">
          <Rate pair="SGD/IDR" value={FX.SGD_IDR.toLocaleString("id-ID")} delta={String(FX_DELTA.SGD_IDR)} />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div
          className="hidden items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 xl:flex"
          title={`${KPB.regulation} · ${KPB.customsOffice}`}
        >
          <ShieldCheck size={14} strokeWidth={2.2} className="text-emerald-400" />
          <div className="leading-tight">
            <div className="text-[12px] whitespace-nowrap font-medium text-emerald-300">{KPB.region}</div>
            <div className="tnum text-[10.5px] whitespace-nowrap text-zinc-400">
              {KPB.kodeKawasan} · {KPB.authority}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5">
          <span
            className={cn(
              "size-1.5 rounded-full",
              agent.tone === "busy" ? "animate-blip bg-cyan-400" : agent.tone === "ready" ? "bg-emerald-400" : "bg-zinc-500",
            )}
          />
          <span className="hidden text-[12px] whitespace-nowrap text-zinc-300 sm:inline">{agent.text}</span>
        </div>

        <div className="hidden items-center gap-1.5 text-zinc-400 2xl:flex">
          <Clock size={13} />
          <span className="tnum text-[12px] text-zinc-300">{fmtClock(now)} WIB</span>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 py-1 pr-3 pl-1">
          <div className="grid size-7 place-items-center rounded-md bg-zinc-800 text-[11px] font-semibold text-emerald-400">
            {initials}
          </div>
          <div className="hidden leading-tight 2xl:block">
            <div className="text-[12px] font-medium text-zinc-200">{displayName}</div>
            <div className="text-[10.5px] text-zinc-400">{displayRole}</div>
          </div>
        </div>

        <Pill tone="mut" className="shrink-0" title="This build never transmits to a customs system.">
          SANDBOX
        </Pill>
      </div>
    </header>
  );
}
