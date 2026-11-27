import React, { useMemo, useState } from 'react';
import { Layers, Lock, Package, Plus, Trash2, X } from 'lucide-react';
import { KitDTO, ProductDTO, ProductLine, UserRole } from '../types/inventory';

interface KitsSectionProps {
  kits: KitDTO[];
  products: ProductDTO[];
  currencySymbol: string;
  role: UserRole;
  onCreateKit: (payload: {
    code?: string;
    name: string;
    description: string;
    line: ProductLine;
    discountPercent: number;
    items: Array<{ productId: string; quantity: number }>;
  }) => Promise<void>;
  onDeleteKit: (kit: KitDTO) => Promise<void>;
}

export function KitsSection({
  kits,
  products,
  currencySymbol,
  role,
  onCreateKit,
  onDeleteKit,
}: KitsSectionProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [line, setLine] = useState<ProductLine>('GAMER');
  const [discountPercent, setDiscountPercent] = useState('10');
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmt = (n: number) =>
    `${currencySymbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const preview = useMemo(() => {
    const entries = Object.entries(selectedMap)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({
        product: products.find((p) => p.id === productId),
        qty,
      }))
      .filter((e): e is { product: ProductDTO; qty: number } => Boolean(e.product));

    const regularPrice = entries.reduce((sum, e) => sum + e.product.finalPrice * e.qty, 0);
    const discount = Math.min(50, Math.max(0, Number(discountPercent) || 0));
    const finalPrice = regularPrice * (1 - discount / 100);
    const maxKits =
      entries.length === 0
        ? 0
        : Math.min(
            ...entries.map((e) =>
              e.product.canBeSold ? Math.floor(e.product.stock / e.qty) : 0
            )
          );

    return { entries, regularPrice, finalPrice, discount, maxKits };
  }, [selectedMap, products, discountPercent]);

  const setProductQty = (productId: string, qty: number) => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[productId];
      } else {
        next[productId] = qty;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const items = Object.entries(selectedMap)
        .filter(([, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({ productId, quantity }));

      await onCreateKit({
        name: name.trim(),
        description: description.trim() || 'Combo tecnológico armado con patrón Composite',
        line,
        discountPercent: Number(discountPercent) || 0,
        items,
      });
      setShowCreate(false);
      setName('');
      setDescription('');
      setSelectedMap({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el combo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-violet-950 to-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/30">
            <Layers className="w-3.5 h-3.5" />
            Patrón Estructural: Composite (InventoryItem → SingleProduct & ProductKit)
          </span>
          <h2 className="text-2xl font-extrabold mt-2">Combos y Kits Tecnológicos</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Agrupa productos individuales en kits compuestos. Tanto el precio (con descuento) como el
            stock armable se calculan dinámicamente desde el inventario real de cada componente.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-indigo-50 transition shadow-md shrink-0"
        >
          {role === 'SELLER' && <Lock className="w-4 h-4 text-amber-600" />}
          <Plus className="w-4 h-4" />
          Armar Nuevo Combo
        </button>
      </div>

      {/* Lista de Combos */}
      {kits.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-600 font-semibold">No hay combos registrados todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {kits.map((kit) => (
            <div
              key={kit.id}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="relative h-44 bg-slate-900">
                <img
                  src={kit.imageUrl}
                  alt={kit.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-950/85 text-white border border-white/15">
                    {kit.code}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg text-white ${
                      kit.line === 'GAMER' ? 'bg-violet-600' : 'bg-sky-600'
                    }`}
                  >
                    {kit.line === 'GAMER' ? 'COMBO GAMER' : 'COMBO OFICINA'}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      kit.isAvailable
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {kit.isAvailable
                      ? `${kit.availableStock} combos armables`
                      : 'Sin stock para armar'}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{kit.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{kit.description}</p>
                  </div>
                  <button
                    onClick={() => onDeleteKit(kit)}
                    className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition shrink-0"
                    title="Eliminar combo (Proxy Admin)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Desglose de Precio Composite */}
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-[11px] uppercase font-bold text-slate-500">
                      Precio del Combo (-{kit.discountPercent}%)
                    </p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-extrabold text-indigo-700">
                        {fmt(kit.finalPrice)}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        {fmt(kit.regularPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                      Ahorras {fmt(kit.savings)}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {kit.totalUnitsPerKit} artículos por combo
                    </p>
                  </div>
                </div>

                {/* Componentes (SingleProduct) */}
                <div className="mt-4 space-y-2 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Componentes del Composite ({kit.items.length})
                  </p>
                  {kit.items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-9 h-7 rounded object-cover bg-slate-900 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {item.quantity}x {item.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {item.code} · Stock actual: {item.productStock} u.
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-700 shrink-0">
                        {fmt(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Combo */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Armar Nuevo Combo / Kit Tecnológico</h3>
                <p className="text-xs text-slate-300">
                  Patrón Composite: selecciona al menos 2 productos para agruparlos
                </p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Nombre del Combo *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Kit Home Office Ejecutivo 4K"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe la propuesta de valor del combo..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Línea
                  </label>
                  <select
                    value={line}
                    onChange={(e) => setLine(e.target.value as ProductLine)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="GAMER">Gamer</option>
                    <option value="OFFICE">Oficina</option>
                  </select>
                </div>
              </div>

              {/* Selector de productos */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-600 mb-2">
                  Selecciona Productos Componentes ({preview.entries.length} elegidos)
                </p>
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {products.map((p) => {
                    const qty = selectedMap[p.id] ?? 0;
                    return (
                      <div
                        key={p.id}
                        className={`px-3.5 py-2.5 flex items-center justify-between gap-3 ${
                          qty > 0 ? 'bg-indigo-50/70' : 'bg-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            <span className="font-mono text-indigo-700 mr-1.5">{p.code}</span>
                            {p.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {fmt(p.finalPrice)} · Stock: {p.stock} u. ({p.statusLabel})
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setProductQty(p.id, Math.max(0, qty - 1))}
                            className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-mono text-xs font-bold">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setProductQty(p.id, qty + 1)}
                            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cálculo Composite en tiempo real */}
              <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-bold text-indigo-900">
                    Cálculo Composite en Tiempo Real
                  </p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Regular: {fmt(preview.regularPrice)} · Descuento: {preview.discount}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-indigo-900">
                    {fmt(preview.finalPrice)}
                  </p>
                  <p className="text-xs font-semibold text-slate-600">
                    Stock armable máximo: <strong>{preview.maxKits} combos</strong>
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || preview.entries.length < 2}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Guardando Combo...' : 'Crear ProductKit (Composite)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
