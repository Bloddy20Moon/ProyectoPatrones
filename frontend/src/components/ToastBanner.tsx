import { AlertTriangle, CheckCircle2, ShieldAlert, X, XCircle } from 'lucide-react';
import { ToastMessage } from '../types/inventory';

interface ToastBannerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastBanner({ toasts, onDismiss }: ToastBannerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const styles =
          toast.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-50'
            : toast.type === 'proxy'
              ? 'bg-amber-950/95 border-amber-500/50 text-amber-50'
              : toast.type === 'warning'
                ? 'bg-amber-950/95 border-amber-500/40 text-amber-50'
                : 'bg-rose-950/95 border-rose-500/50 text-rose-50';

        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'proxy'
              ? ShieldAlert
              : toast.type === 'warning'
                ? AlertTriangle
                : XCircle;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all ${styles}`}
          >
            <Icon className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{toast.title}</p>
                {toast.pattern && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15">
                    {toast.pattern}
                  </span>
                )}
              </div>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="opacity-70 hover:opacity-100 p-0.5 transition"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
