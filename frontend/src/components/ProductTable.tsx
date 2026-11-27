import {
  ArrowDownUp,
  Copy,
  Edit3,
  Eye,
  RotateCcw,
  ShieldPlus,
  Trash2,
} from 'lucide-react';
import { ProductDTO, UserRole } from '../types/inventory';
import { getStatusBadgeStyle } from './ProductCard';

interface ProductTableProps {
  products: ProductDTO[];
  currencySymbol: string;
  role: UserRole;
  onInspect: (product: ProductDTO) => void;
  onStock: (product: ProductDTO) => void;
  onEdit: (product: ProductDTO) => void;
  onUndo: (product: ProductDTO) => void;
  onClone: (product: ProductDTO) => void;
  onServices: (product: ProductDTO) => void;
  onDelete: (product: ProductDTO) => void;
}

export function ProductTable({
  products,
  currencySymbol,
  onInspect,
  onStock,
  onEdit,
  onUndo,
  onClone,
  onServices,
  onDelete,
}: ProductTableProps) {
  const fmt = (n: number) =>
    `${currencySymbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Producto</th>
              <th className="py-3.5 px-3">Código / Línea</th>
              <th className="py-3.5 px-3">Categoría</th>
              <th className="py-3.5 px-3">Estado (State)</th>
              <th className="py-3.5 px-3 text-right">Stock / Mín</th>
              <th className="py-3.5 px-3 text-right">Precio Final</th>
              <th className="py-3.5 px-4 text-right">Acciones (Patrones)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-12 h-10 rounded-lg object-cover bg-slate-900 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate max-w-[220px]">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-500">{p.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="font-mono text-xs font-bold text-slate-800">{p.code}</div>
                  <span
                    className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      p.line === 'GAMER'
                        ? 'bg-violet-100 text-violet-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {p.codeLabel.shortTag}
                  </span>
                </td>
                <td className="py-3 px-3 text-xs font-medium text-slate-600">{p.categoryLabel}</td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                      p.status
                    )}`}
                  >
                    {p.statusLabel}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono text-xs">
                  <span className="font-bold text-slate-900">{p.stock}</span>
                  <span className="text-slate-400"> / {p.minStock}</span>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="font-bold text-slate-900">{fmt(p.finalPrice)}</div>
                  {p.servicesCost > 0 && (
                    <div className="text-[10px] text-indigo-600 font-semibold">
                      +{fmt(p.servicesCost)} extras
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onInspect(p)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                      title="Ver ficha técnica"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onStock(p)}
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                      title="Stock +/- (Command + State)"
                    >
                      <ArrowDownUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onServices(p)}
                      className="p-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700"
                      title="Servicios extra (Decorator)"
                    >
                      <ShieldPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onClone(p)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                      title="Clonar (Prototype)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                      title="Editar (Memento + Command)"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUndo(p)}
                      disabled={p.undoCount === 0}
                      className={`p-1.5 rounded-lg ${
                        p.undoCount > 0
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                      title={`Deshacer cambios (${p.undoCount})`}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(p)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                      title="Eliminar (Proxy)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
