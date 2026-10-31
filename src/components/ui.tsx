import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
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
  good: "border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
  warn: "border-amber-500/30 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
  bad: "border-rose-500/30 bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30",
  brand: "border-blue-500/30 bg-blue-50 text-blue-800 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30",
  iris: "border-violet-500/30 bg-violet-50 text-violet-800 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30",
  mut: "border-slate-200 bg-slate-100 text-slate-600 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-400",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap transition-colors",
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
  excise: { tone: "bad", icon: AlertTriangle },
  asset: { tone: "warn", icon: AlertCircle },
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
  good: "bg-emerald-500 dark:bg-emerald-400",
  warn: "bg-amber-500 dark:bg-amber-400",
  bad: "bg-rose-500 dark:bg-rose-400",
  brand: "bg-blue-500 dark:bg-cyan-400",
  iris: "bg-violet-500 dark:bg-violet-400",
  mut: "bg-slate-400 dark:bg-zinc-500",
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
    "border-emerald-600 bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-500 hover:shadow disabled:hover:bg-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400",
  secondary:
    "border-slate-300 bg-white text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:text-white",
  ghost:
    "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100",
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
        size === "sm" ? "h-8.5 px-3 text-[12px]" : "h-10 px-4",
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
          "peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white dark:peer-focus-visible:ring-offset-zinc-950",
          checked
            ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-zinc-950"
            : "border-slate-300 bg-white text-transparent hover:border-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500",
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
    <div className={cn("text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-zinc-400", className)}>{children}</div>
  );
}
