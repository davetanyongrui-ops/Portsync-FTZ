import { useEffect } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "../lib/cn";

export type ToastTone = "ok" | "warn" | "bad" | "brand" | "neutral";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
}

const VIEW: Record<ToastTone, { bar: string; Icon: typeof Check; ink: string }> = {
  ok: { bar: "bg-ok", Icon: Check, ink: "text-ok" },
  warn: { bar: "bg-warn", Icon: AlertTriangle, ink: "text-warn" },
  bad: { bar: "bg-bad", Icon: AlertTriangle, ink: "text-bad" },
  brand: { bar: "bg-brand", Icon: Info, ink: "text-brand" },
  neutral: { bar: "bg-ink-3", Icon: Info, ink: "text-ink-3" },
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { bar, Icon, ink } = VIEW[toast.tone] ?? VIEW.neutral;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.tone === "bad" ? 7000 : 5000);
    return () => clearTimeout(t);
  }, [toast.id, toast.tone, onDismiss]);

  return (
    <div
      role="status"
      className="animate-rise pointer-events-auto flex w-full overflow-hidden rounded-[6px] border border-line bg-surface shadow-[var(--shadow-modal)] sm:w-[330px]"
    >
      <span className={cn("w-[3px] shrink-0", bar)} />
      <div className="flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2">
        <Icon size={13} strokeWidth={2.2} className={cn("mt-px shrink-0", ink)} />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] leading-snug font-medium text-ink">{toast.title}</div>
          {toast.detail && <div className="mt-0.5 text-[11px] leading-[1.5] text-ink-2">{toast.detail}</div>}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 cursor-pointer text-ink-3 transition-colors hover:text-ink"
          aria-label="Dismiss notification"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed right-2 bottom-[104px] left-2 z-40 flex flex-col gap-2 sm:right-3 sm:bottom-[96px] sm:left-auto sm:w-[330px]">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
