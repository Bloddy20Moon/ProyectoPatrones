import {
  ArrowDownUp,
  Ban,
  Copy,
  Edit3,
  Eye,
  Lock,
  RotateCcw,
  ShieldPlus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ProductDTO, StockStatus, UserRole } from '../types/inventory';

interface ProductCardProps {
  product: ProductDTO;
  currencySymbol: string;
  role: UserRole;
  onInspect: (product: ProductDTO) => void;
  onStock: (product: ProductDTO) => void;
  onEdit: (product: ProductDTO) => void;
  onUndo: (product: ProductDTO) => void;
  onClone: (product: ProductDTO) => void;
  onServices: (product: ProductDTO) => void;
  onToggleDiscontinue: (product: ProductDTO) => void;
  onDelete: (product: ProductDTO) => void;
}

export function getStatusBadgeStyle(status: StockStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'LOW_STOCK':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'OUT_OF_STOCK':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'DISCONTINUED':
      return 'bg-slate-200 text-slate-700 border-slate-300';
  }
}

export function ProductCard({
  product,
  currencySymbol,
  role,
  onInspect,
  onStock,
  onEdit,
  onUndo,
  onClone,
  onServices,
  onToggleDiscontinue,
  onDelete,
}: ProductCardProps) {
  const isSeller = role === 'SELLER';
  const stockRatio = Math.min(100, Math.round((product.stock / Math.max(product.minStock * 2, 1)) * 100));
  const barColor =
    product.status === 'AVAILABLE'
      ? 'bg-emerald-500'
      : product.status === 'LOW_STOCK'
        ? 'bg-amber-500'
        : product.status === 'OUT_OF_STOCK'
          ? 'bg-rose-500'
          : 'bg-slate-400';

  const fmt = (n: number) =>
    `${currencySymbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      className={`group rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition flex flex-col overflow-hidden ${
        product.isDiscontinued ? 'opacity-80' : ''
      }`}
    >
      {/* Imagen + Badges */}
      <div className="relative h-44 bg-slate-900 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/images/laptop-gamer.svg';
          }}
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-950/85 text-white backdrop-blur-sm border border-white/15">
            {product.code}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm ${
              product.line === 'GAMER'
                ? 'bg-violet-600/90 text-white'
                : 'bg-sky-600/90 text-white'
            }`}
            title={`Abstract Factory: ${product.codeLabel.formattedTag}`}
          >
            {product.codeLabel.prefixBadge}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${getStatusBadgeStyle(
              product.status
            )}`}
          >
            {product.statusLabel}
          </span>
        </div>

        <button
          onClick={() => onInspect(product)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-950/80 text-white hover:bg-indigo-600 transition backdrop-blur-sm"
        >
          <Eye className="w-3.5 h-3.5" />
          Ficha Técnica
        </button>
      </div>

      {/* Cuerpo */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <span>{product.categoryLabel}</span>
          <span className="text-slate-700">{product.brand}</span>
        </div>

        <h3 className="font-bold text-slate-900 text-base mt-1 leading-snug line-clamp-2">
          {product.name}
        </h3>

        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1" title={product.specSheet.summary}>
          {product.specSheet.highlights.slice(0, 2).join(' · ')}
        </p>

        {/* Precio + Servicios Decorator */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-xl font-extrabold text-slate-900">{fmt(product.finalPrice)}</span>
              {product.servicesCost > 0 && (
                <span className="ml-2 text-xs text-slate-400 line-through">
                  {fmt(product.basePrice)}
                </span>
              )}
            </div>
            {product.servicesBreakdown.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3 h-3" />+{product.servicesBreakdown.length} extra
              </span>
            )}
          </div>

          {product.servicesBreakdown.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {product.servicesBreakdown.map((srv) => (
                <span
                  key={srv.type}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                >
                  {srv.type === 'EXTENDED_WARRANTY'
                    ? 'Garantía 24m'
                    : srv.type === 'SOFTWARE_SETUP'
                      ? 'Inst. Software'
                      : 'Soporte VIP'}{' '}
                  (+{fmt(srv.cost)})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Barra de Stock */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium">
              Stock: <strong className="text-slate-900">{product.stock} u.</strong>
            </span>
            <span className="text-slate-400">Mín: {product.minStock} u.</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${stockRatio}%` }} />
          </div>
        </div>

        {/* Botones de Patrones */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onStock(product)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
            title="Patrones Command + State + Observer"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            Stock +/-
          </button>

          <button
            onClick={() => onServices(product)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition"
            title="Patrón Decorator: añadir garantía o instalación de software"
          >
            <ShieldPlus className="w-3.5 h-3.5" />
            Servicios
          </button>

          <button
            onClick={() => onClone(product)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            title="Patrón Prototype: clonar variante con nuevo código"
          >
            {isSeller && <Lock className="w-3 h-3 text-amber-600" />}
            <Copy className="w-3.5 h-3.5" />
            Clonar
          </button>

          <button
            onClick={() => onEdit(product)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            title="Patrones Memento + Command + Proxy"
          >
            {isSeller && <Lock className="w-3 h-3 text-amber-600" />}
            <Edit3 className="w-3.5 h-3.5" />
            Editar
          </button>
        </div>

        {/* Barra inferior: Undo (Memento), Descontinuar (State), Eliminar (Proxy) */}
        <div className="mt-2 flex items-center justify-between gap-1.5">
          <button
            onClick={() => onUndo(product)}
            disabled={product.undoCount === 0}
            className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
              product.undoCount > 0
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
            }`}
            title="Patrón Memento: deshacer última edición"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Deshacer {product.undoCount > 0 ? `(${product.undoCount})` : ''}
          </button>

          <button
            onClick={() => onToggleDiscontinue(product)}
            className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 hover:bg-slate-200 text-slate-600 border border-slate-200 transition"
            title={
              product.isDiscontinued
                ? 'Patrón State: reactivar producto'
                : 'Patrón State: cambiar a DiscontinuedState'
            }
          >
            <Ban className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(product)}
            className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
            title="Patrón Proxy: eliminar producto (solo Admin)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
