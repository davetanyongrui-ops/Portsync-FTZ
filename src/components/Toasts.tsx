import { useEffect } from "react";
import { CircleAlert, Info, ShieldCheck, X } from "lucide-react";
import { cn } from "../lib/cn";

export interface Toast {
  id: number;
  tone: "good" | "warn" | "bad" | "brand";
  title: string;
  detail?: string;
}

const VIEW = {
  good: { cls: "border-emerald-500/40 bg-zinc-900/95", Icon: ShieldCheck, ink: "text-emerald-400" },
  warn: { cls: "border-amber-500/40 bg-zinc-900/95", Icon: CircleAlert, ink: "text-amber-400" },
  bad: { cls: "border-rose-500/40 bg-zinc-900/95", Icon: CircleAlert, ink: "text-rose-400" },
  brand: { cls: "border-cyan-500/40 bg-zinc-900/95", Icon: Info, ink: "text-cyan-400" },
} as const;

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { cls, Icon, ink } = VIEW[toast.tone];

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.tone === "bad" ? 6500 : 4200);
    return () => clearTimeout(t);
  }, [toast.id, toast.tone, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "animate-rise pointer-events-auto flex w-[380px] items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-xl",
        cls,
      )}
    >
      <Icon size={16} strokeWidth={2.2} className={cn("mt-px shrink-0", ink)} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-snug font-medium text-zinc-100">{toast.title}</div>
        {toast.detail && <div className="mt-1 text-[12px] leading-[1.55] text-zinc-400">{toast.detail}</div>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-200 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed top-[72px] right-5 z-[60] flex max-h-[calc(100vh-120px)] w-[380px] flex-col-reverse gap-2.5 overflow-hidden">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
