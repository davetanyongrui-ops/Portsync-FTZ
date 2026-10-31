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
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  bad: "border-rose-200 bg-rose-50 text-rose-700",
  brand: "border-blue-200 bg-blue-50 text-blue-700",
  iris: "border-violet-200 bg-violet-50 text-violet-700",
  mut: "border-slate-200 bg-slate-100 text-slate-600",
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
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
  brand: "bg-blue-500",
  iris: "bg-violet-500",
  mut: "bg-slate-400",
};

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
    "border-transparent bg-blue-600 font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 disabled:hover:bg-blue-600",
  secondary: "border-slate-300 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900",
  ghost: "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
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
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border text-[13px] tracking-tight whitespace-nowrap transition-colors duration-150 select-none",
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
          "peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white",
          checked
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-slate-300 bg-white text-transparent hover:border-slate-400",
        )}
      >
        <svg viewBox="0 0 12 12" className="size-[10px]" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path d="M2 6.2 4.6 8.8 10 3.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </label>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-xs font-medium tracking-wider text-slate-500 uppercase", className)}>{children}</div>
  );
}