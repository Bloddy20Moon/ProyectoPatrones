import { AlertTriangle, Boxes, DollarSign, PackageX } from 'lucide-react';
import { DashboardSummary } from '../types/inventory';

interface KpiCardsProps {
  summary: DashboardSummary | null;
}

export function KpiCards({ summary }: KpiCardsProps) {
  const kpis = summary?.kpis;
  const symbol = summary?.config.currencySymbol ?? '$';

  const formatCurrency = (val: number) =>
    `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cards = [
    {
      label: 'Total Productos',
      value: kpis ? String(kpis.totalProducts) : '—',
      sub: kpis ? `${kpis.totalUnits} unidades · ${kpis.totalKits} combos` : 'Cargando...',
      icon: Boxes,
      iconBg: 'bg-indigo-100 text-indigo-700',
      border: 'border-slate-200',
    },
    {
      label: 'Valor del Inventario',
      value: kpis ? formatCurrency(kpis.totalInventoryValue) : '—',
      sub:
        kpis && kpis.totalInventoryValue > kpis.totalBaseInventoryValue
          ? `Base: ${formatCurrency(kpis.totalBaseInventoryValue)} (+servicios)`
          : 'Incluye servicios Decorator',
      icon: DollarSign,
      iconBg: 'bg-emerald-100 text-emerald-700',
      border: 'border-slate-200',
    },
    {
      label: 'Stock Bajo',
      value: kpis ? String(kpis.lowStockCount) : '—',
      sub: 'Por debajo o igual al mínimo',
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 text-amber-700',
      border: kpis && kpis.lowStockCount > 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200',
    },
    {
      label: 'Agotados',
      value: kpis ? String(kpis.outOfStockCount) : '—',
      sub:
        kpis && kpis.discontinuedCount > 0
          ? `Stock = 0 · ${kpis.discontinuedCount} descontinuados`
          : 'Bloqueados por OutOfStockState',
      icon: PackageX,
      iconBg: 'bg-rose-100 text-rose-700',
      border: kpis && kpis.outOfStockCount > 0 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-2xl bg-white border p-5 shadow-sm hover:shadow-md transition ${card.border}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
                  {card.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
