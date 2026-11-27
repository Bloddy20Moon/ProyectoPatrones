import React, { useState } from 'react';
import { CheckCircle2, Lock, RefreshCw, Save, Settings } from 'lucide-react';
import { DashboardSummary, GlobalConfigData, UserRole } from '../types/inventory';

interface PatternsAndConfigSectionProps {
  summary: DashboardSummary | null;
  role: UserRole;
  onUpdateConfig: (updates: Partial<GlobalConfigData>) => Promise<void>;
  onResetSeed: () => Promise<void>;
}

const PATTERN_GROUPS = [
  {
    group: 'Patrones Creacionales (5)',
    color: 'indigo',
    items: [
      {
        name: 'Singleton',
        classes: 'DatabaseConfig, InventoryStore',
        usage: 'Configuración global (moneda, stock mínimo) y almacén centralizado persistente.',
      },
      {
        name: 'Factory Method',
        classes: 'ProductFactory → LaptopFactory, PeripheralFactory, ComponentFactory, AccessoryFactory',
        usage: 'Genera prefijos de código (LAP/PER/CMP/ACC) y validaciones por categoría.',
      },
      {
        name: 'Abstract Factory',
        classes: 'IProductLineFactory → GamerLineFactory, OfficeLineFactory',
        usage: 'Produce familias coherentes de Ficha Técnica + Etiqueta de Código por gama.',
      },
      {
        name: 'Builder',
        classes: 'ProductBuilder, ProductDirector',
        usage: 'Construye paso a paso productos con specs, foto, proveedor, stock y servicios.',
      },
      {
        name: 'Prototype',
        classes: 'IPrototype, Product.clone(), ProductPrototypeRegistry',
        usage: 'Duplica un registro existente para crear variantes con nuevo código al instante.',
      },
    ],
  },
  {
    group: 'Patrones Estructurales (6)',
    color: 'violet',
    items: [
      {
        name: 'Adapter',
        classes: 'IReportExporter, ExcelExporterAdapter, CsvExporterAdapter',
        usage: 'Adapta la librería externa ExcelJS a la interfaz interna de exportación.',
      },
      {
        name: 'Facade',
        classes: 'InventoryFacade',
        usage: 'Orquesta validación, creación, comandos, mementos, alertas y exportación.',
      },
      {
        name: 'Decorator',
        classes: 'ProductDecorator → ExtendedWarrantyDecorator, SoftwareSetupDecorator, PrioritySupportDecorator',
        usage: 'Añade dinámicamente servicios extra y recalcula el precio final.',
      },
      {
        name: 'Composite',
        classes: 'InventoryItem → SingleProduct, ProductKit',
        usage: 'Calcula uniformemente precio y stock disponible en productos individuales y combos.',
      },
      {
        name: 'Proxy',
        classes: 'InventoryAccessProxy',
        usage: 'Controla acceso RBAC (Administrador vs Vendedor) bloqueando operaciones sensibles.',
      },
      {
        name: 'Bridge',
        classes: 'InventoryReport (General, LowStock, Valued) × IReportFormat (Excel, CSV)',
        usage: 'Desacopla la lógica de cada reporte de su formato de salida.',
      },
    ],
  },
  {
    group: 'Patrones de Comportamiento (4)',
    color: 'emerald',
    items: [
      {
        name: 'State',
        classes: 'IStockState → AvailableState, LowStockState, OutOfStockState, DiscontinuedState',
        usage: 'Transiciones automáticas de estado y bloqueo de salidas en agotados/descontinuados.',
      },
      {
        name: 'Observer',
        classes: 'InventorySubject → DashboardAlertObserver, AuditLogObserver',
        usage: 'Genera alertas automáticas de stock bajo y registra eventos en auditoría.',
      },
      {
        name: 'Command',
        classes: 'AddStockCommand, RemoveStockCommand, UpdateProductCommand + CommandInvoker',
        usage: 'Encapsula movimientos y ediciones manteniendo un historial estructurado.',
      },
      {
        name: 'Memento',
        classes: 'ProductMemento, ProductHistory',
        usage: 'Guarda instantáneas previas antes de editar para habilitar Deshacer (Undo).',
      },
    ],
  },
];

export function PatternsAndConfigSection({
  summary,
  role,
  onUpdateConfig,
  onResetSeed,
}: PatternsAndConfigSectionProps) {
  const cfg = summary?.config;
  const metrics = summary?.patternMetrics;

  const [storeName, setStoreName] = useState(cfg?.storeName ?? 'TechStock');
  const [currency, setCurrency] = useState(cfg?.currency ?? 'USD');
  const [currencySymbol, setCurrencySymbol] = useState(cfg?.currencySymbol ?? '$');
  const [defaultMinStock, setDefaultMinStock] = useState(String(cfg?.defaultMinStock ?? 5));
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateConfig({
        storeName,
        currency,
        currencySymbol,
        defaultMinStock: Number(defaultMinStock),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Telemetría en vivo + Config Singleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Configuración Global (Singleton: DatabaseConfig)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Instancia única compartida por Builder, Reportes y Dashboard
              </p>
            </div>
            {role === 'SELLER' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-800">
                <Lock className="w-3 h-3" /> Solo Admin
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre Tienda</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Stock Mínimo Default
                </label>
                <input
                  type="number"
                  min="1"
                  value={defaultMinStock}
                  onChange={(e) => setDefaultMinStock(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Moneda</label>
                <select
                  value={currency}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCurrency(val);
                    if (val === 'USD') setCurrencySymbol('$');
                    if (val === 'PEN') setCurrencySymbol('S/');
                    if (val === 'EUR') setCurrencySymbol('€');
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="USD">USD — Dólar ($)</option>
                  <option value="PEN">PEN — Sol Peruano (S/)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Símbolo</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
              <button
                type="button"
                onClick={onResetSeed}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Datos Semilla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Guardando...' : 'Guardar Singleton'}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl bg-slate-900 text-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base">Telemetría en Vivo de los 15 Patrones GoF</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Indicadores reales provenientes del runtime del Backend
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Prototipos Reg.', value: metrics?.registeredPrototypes ?? 0 },
              { label: 'Prod. Decorados', value: metrics?.decoratedProductsCount ?? 0 },
              { label: 'Kits Composite', value: metrics?.compositeKitsCount ?? 0 },
              { label: 'Comandos Invoker', value: metrics?.commandsExecuted ?? 0 },
              { label: 'Mementos Undo', value: metrics?.mementoSnapshotsStored ?? 0 },
              { label: 'Eventos Observer', value: metrics?.auditLogsRecorded ?? 0 },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-[11px] text-slate-400">{m.label}</p>
                <p className="text-xl font-extrabold text-indigo-300 mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mapa completo de los 15 Patrones */}
      <div className="space-y-4">
        {PATTERN_GROUPS.map((section) => (
          <div
            key={section.group}
            className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"
          >
            <h3 className="text-base font-extrabold text-slate-900 mb-3">{section.group}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {section.items.map((pat) => (
                <div
                  key={pat.name}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{pat.name}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="font-mono text-[11px] text-indigo-700 font-semibold mt-1">
                    {pat.classes}
                  </p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{pat.usage}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
