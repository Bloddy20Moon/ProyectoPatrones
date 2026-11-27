import { AlertOctagon, AlertTriangle, BellRing, PlusCircle } from 'lucide-react';
import { AlertItem } from '../types/inventory';

interface AlertsPanelProps {
  alerts: AlertItem[];
  onQuickRestock: (productId: string, productCode: string) => void;
}

export function AlertsPanel({ alerts, onQuickRestock }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-3">
        <BellRing className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="text-sm text-emerald-800 font-medium">
          Sin alertas activas — Todos los productos superan su stock mínimo configurado.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <h3 className="text-sm font-semibold">
            Alertas Automáticas de Inventario ({alerts.length})
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-medium">
            Patrón Observer · DashboardAlertObserver
          </span>
        </div>
        <span className="text-xs text-slate-300">
          Se actualizan y resuelven automáticamente al modificar el stock
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          return (
            <div
              key={alert.id}
              className={`px-5 py-3 flex items-center justify-between gap-4 flex-wrap ${
                isCritical ? 'bg-rose-50/60' : 'bg-amber-50/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isCritical ? (
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        isCritical
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {isCritical ? 'AGOTADO' : 'STOCK BAJO'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {alert.productCode}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {alert.productName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
                </div>
              </div>

              <button
                onClick={() => onQuickRestock(alert.productId, alert.productCode)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-indigo-600 transition shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Reabastecer +5
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
