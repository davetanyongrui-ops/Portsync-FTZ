import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  BadgeCheck,
  Factory,
  Lock,
  Percent,
  Radar,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../lib/cn";
import type { RegulatoryBadge } from "../types";

export type Tone = "good" | "warn" | "bad" | "brand" | "iris" | "mut";

const TONE: Record<Tone, string> = {
  good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  bad: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  brand: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  iris: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  mut: "border-zinc-700/70 bg-zinc-850/80 text-zinc-400",
};

export function Pill({
  tone = "mut",
  children,
  className,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const BADGE_VIEW: Record<RegulatoryBadge["kind"], { tone: Tone; icon: LucideIcon }> = {
  facility: { tone: "good", icon: ShieldCheck },
  tpbd: { tone: "warn", icon: ArrowRightLeft },
  "lartas-pre": { tone: "bad", icon: Lock },
  "lartas-post": { tone: "warn", icon: Radar },
  sni: { tone: "iris", icon: BadgeCheck },
  ad: { tone: "bad", icon: Percent },
  tkdn: { tone: "brand", icon: Factory },
};

export function RegBadgeView({ badge }: { badge: RegulatoryBadge }) {
  const view = BADGE_VIEW[badge.kind];
  const Icon = view.icon;
  return (
    <Pill tone={view.tone} title={badge.detail} className="cursor-help">
      <Icon size={11} strokeWidth={2.4} />
      {badge.label}
    </Pill>
  );
}

export const TONE_DOT: Record<Tone, string> = {
  good: "bg-emerald-400",
  warn: "bg-amber-400",
  bad: "bg-rose-400",
  brand: "bg-cyan-400",
  iris: "bg-violet-400",
  mut: "bg-zinc-500",
};

/** Classifier agreement with the BTKI register - colour only, so a figure never prints twice. */
export const confidenceTone = (value: number): Tone => {
  const pct = Math.round(value * 100);
  return pct >= 92 ? "good" : pct >= 75 ? "brand" : pct >= 60 ? "warn" : "bad";
};

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  block?: boolean;
};

const BTN: Record<NonNullable<BtnProps["variant"]>, string> = {
  primary:
    "border-emerald-500/30 bg-emerald-500 font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:shadow-emerald-500/30 disabled:hover:bg-emerald-500",
  secondary: "border-zinc-700/80 bg-zinc-900/90 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white",
  ghost: "border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100",
};

export function Btn({
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  block,
  className,
  children,
  ...rest
}: BtnProps) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border text-[13px] tracking-tight whitespace-nowrap transition-all duration-150 select-none",
        "disabled:cursor-not-allowed disabled:opacity-40 active:translate-y-px",
        size === "sm" ? "h-8 px-3 text-[12px]" : "h-10 px-4",
        BTN[variant],
        block && "w-full",
        className,
      )}
    >
      {Icon && <Icon size={size === "sm" ? 13 : 15} strokeWidth={2.2} />}
      {children}
      {IconRight && <IconRight size={size === "sm" ? 13 : 15} strokeWidth={2.2} />}
    </button>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center", disabled && "cursor-not-allowed opacity-40")}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          "grid size-4 place-items-center rounded-[5px] border transition-colors",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-zinc-950",
          checked
            ? "border-emerald-500 bg-emerald-500 text-zinc-950"
            : "border-zinc-700 bg-zinc-900 text-transparent hover:border-zinc-500",
        )}
      >
        <svg viewBox="0 0 12 12" className="size-[10px]" fill="none" stroke="currentColor" strokeWidth={2.6}>
          <path d="M2 6.2 4.6 8.8 10 3.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-xs font-medium tracking-wider text-zinc-400 uppercase", className)}>{children}</div>
  );
}
