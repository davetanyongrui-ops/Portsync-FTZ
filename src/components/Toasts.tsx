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
  good: { cls: "border-emerald-200 bg-emerald-50", Icon: ShieldCheck, ink: "text-emerald-700" },
  warn: { cls: "border-amber-200 bg-amber-50", Icon: CircleAlert, ink: "text-amber-700" },
  bad: { cls: "border-rose-200 bg-rose-50", Icon: CircleAlert, ink: "text-rose-700" },
  brand: { cls: "border-blue-200 bg-blue-50", Icon: Info, ink: "text-blue-700" },
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
        "animate-rise pointer-events-auto flex w-[360px] items-start gap-3 rounded-xl border bg-white p-3.5 shadow-[0_18px_44px_-20px_rgba(15,23,42,0.18)] backdrop-blur",
        cls,
      )}
    >
      <Icon size={16} strokeWidth={2.2} className={cn("mt-px shrink-0", ink)} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-snug font-medium text-slate-900">{toast.title}</div>
        {toast.detail && <div className="mt-1 text-[12px] leading-[1.55] text-slate-600">{toast.detail}</div>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-slate-400 transition-colors hover:text-slate-700"
        aria-label="Dismiss notification"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed top-[72px] right-5 z-[60] flex max-h-[calc(100vh-120px)] w-[360px] flex-col-reverse gap-2.5 overflow-hidden">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}