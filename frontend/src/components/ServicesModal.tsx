import { useState } from 'react';
import { Check, Plus, ShieldPlus, Sparkles, Trash2, X } from 'lucide-react';
import { ExtraServiceCatalogItem, ExtraServiceType, ProductDTO } from '../types/inventory';

interface ServicesModalProps {
  product: ProductDTO;
  currencySymbol: string;
  catalog: ExtraServiceCatalogItem[];
  onAddService: (service: ExtraServiceType) => Promise<void>;
  onRemoveService: (service: ExtraServiceType) => Promise<void>;
  onClose: () => void;
}

export function ServicesModal({
  product,
  currencySymbol,
  catalog,
  onAddService,
  onRemoveService,
  onClose,
}: ServicesModalProps) {
  const [busyService, setBusyService] = useState<ExtraServiceType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fmt = (n: number) =>
    `${currencySymbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleToggle = async (serviceType: ExtraServiceType, isActive: boolean) => {
    setBusyService(serviceType);
    setError(null);
    try {
      if (isActive) {
        await onRemoveService(serviceType);
      } else {
        await onAddService(serviceType);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar servicios.');
    } finally {
      setBusyService(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <ShieldPlus className="w-5 h-5 text-violet-400" />
              Servicios Extra (Patrón Decorator)
            </h3>
            <p className="text-xs text-slate-300">
              Envuelve dinámicamente {product.code} con decoradores de precio
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Resumen de cadena Decorator */}
          <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Cadena Decorada Activa
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">
              {product.decoratedDescription}
            </p>
            <div className="mt-3 pt-2.5 border-t border-violet-200/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>BaseProductPricing</span>
                <span className="font-mono font-semibold">{fmt(product.basePrice)}</span>
              </div>
              {product.servicesBreakdown.map((item) => (
                <div key={item.type} className="flex justify-between text-violet-800">
                  <span>+ {item.name}</span>
                  <span className="font-mono font-semibold">+{fmt(item.cost)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-violet-200/80">
                <span>Precio Final Calculado</span>
                <span className="font-mono text-indigo-700">{fmt(product.finalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Lista de Decorators */}
          <div className="space-y-2.5">
            {catalog.map((srv) => {
              const active = product.services.includes(srv.type);
              const loading = busyService === srv.type;
              return (
                <div
                  key={srv.type}
                  className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 transition ${
                    active ? 'bg-indigo-50/70 border-indigo-300' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{srv.name}</p>
                      {active && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="w-3 h-3" /> Activo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{srv.description}</p>
                    <p className="text-[11px] font-semibold text-indigo-700 mt-1">
                      Regla: {srv.pricingRule}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggle(srv.type, active)}
                    disabled={loading}
                    className={`shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      active
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {loading ? (
                      '...'
                    ) : active ? (
                      <>
                        <Trash2 className="w-3.5 h-3.5" /> Quitar
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Añadir
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
