import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, ShieldAlert, X } from 'lucide-react';
import { ProductDTO } from '../types/inventory';
import { getStatusBadgeStyle } from './ProductCard';

interface StockModalProps {
  product: ProductDTO;
  onSubmit: (type: 'IN' | 'OUT', quantity: number, reason: string) => Promise<void>;
  onClose: () => void;
}

export function StockModal({ product, onSubmit, onClose }: StockModalProps) {
  const [type, setType] = useState<'IN' | 'OUT'>(product.stock === 0 ? 'IN' : 'OUT');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState(
    product.stock === 0 ? 'Reposición de proveedor' : 'Venta en tienda'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qtyNum = Math.max(0, Math.floor(Number(quantity) || 0));
  const projectedStock = type === 'IN' ? product.stock + qtyNum : product.stock - qtyNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(type, qtyNum, reason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Movimiento de Stock</h3>
            <p className="text-xs text-slate-300">
              {product.code} · {product.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Estado actual (Patrón State)</p>
              <span
                className={`inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                  product.status
                )}`}
              >
                {product.statusLabel}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Stock actual / Mínimo</p>
              <p className="text-lg font-extrabold text-slate-900">
                {product.stock}{' '}
                <span className="text-xs font-medium text-slate-400">/ mín. {product.minStock}</span>
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-xs text-rose-700 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setType('IN');
                setReason('Reposición de proveedor');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                type === 'IN'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              Entrada (+ Stock)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('OUT');
                setReason('Venta en tienda');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                type === 'OUT'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Salida (- Stock)
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Cantidad de unidades
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Motivo (Auditoría CommandInvoker)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Compra a proveedor, venta boleta #102..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="rounded-xl bg-indigo-50/70 border border-indigo-200 px-3.5 py-2.5 text-xs text-indigo-900">
            Stock proyectado: <strong>{projectedStock} u.</strong>{' '}
            {projectedStock <= 0
              ? '→ Transición automática a OutOfStockState + Alerta Crítica'
              : projectedStock <= product.minStock
                ? '→ Transición automática a LowStockState + Alerta Observer'
                : '→ Estado AvailableState'}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting
                ? 'Ejecutando Command...'
                : type === 'IN'
                  ? 'Ejecutar AddStockCommand'
                  : 'Ejecutar RemoveStockCommand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
