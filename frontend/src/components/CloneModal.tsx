import React, { useEffect, useState } from 'react';
import { Copy, X } from 'lucide-react';
import { ProductCategory, ProductDTO, ProductLine } from '../types/inventory';

interface CloneModalProps {
  product: ProductDTO;
  onFetchNextCode: (category: ProductCategory) => Promise<{ suggestedCode: string }>;
  onSubmit: (overrides: {
    code: string;
    name: string;
    price: number;
    stock: number;
    line: ProductLine;
  }) => Promise<void>;
  onClose: () => void;
}

export function CloneModal({ product, onFetchNextCode, onSubmit, onClose }: CloneModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState(`${product.name} (Variante)`);
  const [price, setPrice] = useState(String(product.basePrice));
  const [stock, setStock] = useState(String(Math.max(product.stock, 5)));
  const [line, setLine] = useState<ProductLine>(product.line);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onFetchNextCode(product.category)
      .then((res) => setCode(res.suggestedCode))
      .catch(() => setCode(`${product.code}-V2`));
  }, [product, onFetchNextCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        line,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo clonar el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Copy className="w-4 h-4 text-indigo-400" />
              Clonar Producto (Patrón Prototype)
            </h3>
            <p className="text-xs text-slate-300">
              Duplica especificaciones, foto y servicios de {product.code}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nuevo Código Único
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full font-mono rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Nombre de la Variante
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Precio ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Stock Inicial
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Gama
              </label>
              <select
                value={line}
                onChange={(e) => setLine(e.target.value as ProductLine)}
                className="w-full rounded-xl border border-slate-300 px-2.5 py-2 text-sm bg-white"
              >
                <option value="GAMER">Gamer</option>
                <option value="OFFICE">Oficina</option>
              </select>
            </div>
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
              {submitting ? 'Clonando...' : 'Ejecutar clone()'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
