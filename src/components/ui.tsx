import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeCheck,
  CircleAlert,
  CircleHelp,
  Factory,
  Lock,
  Percent,
  Radar,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../lib/cn";
import type { RegulatoryBadge } from "../types";

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  block?: boolean;
};

const BTN: Record<NonNullable<BtnProps["variant"]>, string> = {
  primary:
    "border-ink bg-ink text-paper hover:opacity-88 active:opacity-100 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
  secondary:
    "border-line-strong bg-surface text-ink hover:bg-sunken hover:border-ink-3",
  ghost:
    "border-transparent bg-transparent text-ink-2 hover:bg-sunken hover:text-ink",
  danger:
    "border-bad/40 bg-bad-soft text-bad hover:border-bad",
};

const SIZE: Record<NonNullable<BtnProps["size"]>, string> = {
  xs: "h-7 px-2 gap-1.5 text-[11.5px]",
  sm: "h-8 px-2.5 gap-1.5 text-[12px]",
  md: "h-9.5 px-3.5 gap-2 text-[13px]",
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
      type="button"
      {...rest}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[5px] border font-medium tracking-[-0.005em] whitespace-nowrap transition-[background-color,border-color,opacity,color] duration-120 select-none",
        "disabled:cursor-not-allowed disabled:opacity-35",
        SIZE[size],
        BTN[variant],
        block && "w-full",
        className,
      )}
    >
      {Icon && <Icon size={size === "md" ? 14 : 13} strokeWidth={2} />}
      {children}
      {IconRight && <IconRight size={size === "md" ? 14 : 13} strokeWidth={2} />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Tags — statutory state only                                         */
/* ------------------------------------------------------------------ */

export type Tone = "neutral" | "ok" | "warn" | "bad" | "brand";

const TAG: Record<Tone, string> = {
  neutral: "border-line bg-sunken text-ink-2",
  ok: "border-ok/25 bg-ok-soft text-ok",
  warn: "border-warn/25 bg-warn-soft text-warn",
  bad: "border-bad/25 bg-bad-soft text-bad",
  brand: "border-brand/20 bg-brand-soft text-brand",
};

export function Tag({
  tone = "neutral",
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
        "inline-flex items-center gap-1 rounded-[3px] border px-1.5 py-[1.5px] text-[10.5px] leading-[15px] font-medium whitespace-nowrap",
        TAG[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const BADGE_VIEW: Record<RegulatoryBadge["kind"], { tone: Tone; icon: LucideIcon }> = {
  facility: { tone: "ok", icon: ShieldCheck },
  tpbd: { tone: "warn", icon: ArrowLeftRight },
  "lartas-pre": { tone: "bad", icon: Lock },
  "lartas-post": { tone: "warn", icon: Radar },
  sni: { tone: "brand", icon: BadgeCheck },
  ad: { tone: "bad", icon: Percent },
  tkdn: { tone: "brand", icon: Factory },
  excise: { tone: "bad", icon: AlertTriangle },
  asset: { tone: "warn", icon: CircleAlert },
  unclassified: { tone: "bad", icon: CircleHelp },
  preference: { tone: "ok", icon: Percent },
  "rate-range": { tone: "warn", icon: CircleAlert },
  figure: { tone: "warn", icon: AlertTriangle },
};

export function RegBadgeView({ badge }: { badge: RegulatoryBadge }) {
  const view = BADGE_VIEW[badge.kind];
  const Icon = view.icon;
  return (
    <Tag tone={view.tone} title={badge.detail} className="cursor-help">
      <Icon size={10} strokeWidth={2.2} />
      {badge.label}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Small controls                                                      */
/* ------------------------------------------------------------------ */

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  indeterminate,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  indeterminate?: boolean;
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
          "grid size-[14px] place-items-center rounded-[3px] border transition-colors",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-surface",
          checked || indeterminate
            ? "border-ink bg-ink text-paper"
            : "border-line-strong bg-surface text-transparent hover:border-ink-3",
        )}
      >
        {indeterminate && !checked ? (
          <span className="h-[1.5px] w-[7px] rounded-full bg-paper" />
        ) : (
          <svg viewBox="0 0 12 12" className="size-[9px]" fill="none" stroke="currentColor" strokeWidth={2.6}>
            <path d="M2 6.2 4.6 8.8 10 3.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </label>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-[10px] font-semibold tracking-[0.09em] text-ink-3 uppercase", className)}>
      {children}
    </div>
  );
}

/** Shared field chrome so every input, select and textarea matches. */
export const FIELD =
  "w-full rounded-[5px] border border-line-strong bg-surface px-2.5 py-1.5 text-[13px] text-ink placeholder:text-ink-3 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:opacity-50";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "sm",
  label,
}: {
  value: T;
  options: { value: T; label: string; icon?: LucideIcon }[];
  onChange: (v: T) => void;
  size?: "xs" | "sm";
  label?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex items-center rounded-[5px] border border-line bg-sunken p-[2px]"
    >
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-[3px] font-medium whitespace-nowrap transition-colors",
              size === "xs" ? "px-2 py-[3px] text-[11px]" : "px-2.5 py-1 text-[11.5px]",
              active
                ? "bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-line"
                : "text-ink-3 hover:text-ink",
            )}
          >
            {Icon && <Icon size={12} strokeWidth={2} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Hairline key/value row used across the summary and metadata blocks. */
export function MetaRow({
  k,
  v,
  mono,
  className,
}: {
  k: string;
  v: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-[3px]", className)}>
      <span className="shrink-0 text-[11.5px] text-ink-3">{k}</span>
      <span className={cn("truncate text-right text-[11.5px] text-ink-2", mono && "font-mono text-[11px]")}>{v}</span>
    </div>
  );
}
