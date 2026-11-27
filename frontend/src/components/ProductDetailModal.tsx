import { useEffect, useState } from 'react';
import { Barcode, CheckCircle2, History, RotateCcw, Tag, X } from 'lucide-react';
import { ProductDTO, UndoHistoryItem } from '../types/inventory';
import { getStatusBadgeStyle } from './ProductCard';

interface ProductDetailModalProps {
  product: ProductDTO;
  currencySymbol: string;
  onFetchHistory: (id: string) => Promise<UndoHistoryItem[]>;
  onUndo: (product: ProductDTO) => Promise<void>;
  onClose: () => void;
}

export function ProductDetailModal({
  product,
  currencySymbol,
  onFetchHistory,
  onUndo,
  onClose,
}: ProductDetailModalProps) {
  const [history, setHistory] = useState<UndoHistoryItem[]>([]);

  useEffect(() => {
    onFetchHistory(product.id)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [product, onFetchHistory]);

  const fmt = (n: number) =>
    `${currencySymbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/30 border border-indigo-400/40">
              {product.code}
            </span>
            <div>
              <h3 className="font-bold text-base">{product.name}</h3>
              <p className="text-xs text-slate-300">
                {product.brand} · {product.categoryLabel} · Proveedor: {product.supplier}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Imagen + Abstract Factory Label */}
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-40 object-cover rounded-xl bg-slate-900 border border-slate-200"
            />
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                    product.status
                  )}`}
                >
                  {product.statusLabel}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full text-white ${
                    product.line === 'GAMER' ? 'bg-violet-600' : 'bg-sky-600'
                  }`}
                >
                  {product.specSheet.badgeLabel}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                <p className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Etiqueta de Código (Abstract Factory)
                </p>
                <p className="font-mono text-xs font-bold text-slate-900">
                  {product.codeLabel.formattedTag}
                </p>
                <p className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5" />
                  {product.codeLabel.barcodePayload}
                </p>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-extrabold text-slate-900">
                  {fmt(product.finalPrice)}
                </span>
                <span className="text-xs text-slate-500">
                  Stock: <strong>{product.stock}</strong> (mín. {product.minStock})
                </span>
              </div>
            </div>
          </div>

          {/* Ficha Técnica (Abstract Factory) */}
          <div className="rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
              Ficha Técnica de Línea — {product.specSheet.tierTitle}
            </h4>
            <p className="text-xs text-slate-600 mb-1">
              <strong>Uso recomendado:</strong> {product.specSheet.recommendedUse}
            </p>
            <p className="text-xs text-slate-600 mb-3">
              <strong>Garantía base de línea:</strong> {product.specSheet.warrantyTier}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {product.specSheet.highlights.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {h}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              {Object.entries(product.specifications).map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between gap-2 text-xs bg-slate-50 px-3 py-2 rounded-lg"
                >
                  <span className="font-semibold text-slate-600">{key}</span>
                  <span className="text-slate-900 text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Historial Memento (Undo) */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <History className="w-4 h-4" />
                Instantáneas Guardadas — Patrón Memento ({history.length})
              </h4>
              {history.length > 0 && (
                <button
                  onClick={async () => {
                    await onUndo(product);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Deshacer última edición
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500">
                Aún no hay instantáneas Memento para este producto. Edita algún campo para crear una.
              </p>
            ) : (
              <div className="space-y-1.5">
                {history.map((snap, idx) => (
                  <div
                    key={snap.id}
                    className="flex items-center justify-between text-xs bg-amber-50/60 border border-amber-200/70 px-3 py-2 rounded-lg"
                  >
                    <div>
                      <span className="font-bold text-amber-900">#{history.length - idx}</span>{' '}
                      <span className="text-slate-800 font-medium">{snap.name}</span>{' '}
                      <span className="text-slate-500">({fmt(snap.price)})</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(snap.savedAt).toLocaleTimeString('es-PE')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
