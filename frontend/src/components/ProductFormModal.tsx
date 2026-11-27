import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import {
  ExtraServiceCatalogItem,
  ExtraServiceType,
  ProductCategory,
  ProductCodeLabelDTO,
  ProductDTO,
  ProductLine,
  TechSpecSheetDTO,
} from '../types/inventory';

interface ProductFormModalProps {
  mode: 'create' | 'edit';
  initialProduct?: ProductDTO | null;
  serviceCatalog: ExtraServiceCatalogItem[];
  defaultMinStock: number;
  onFetchNextCode: (category: ProductCategory) => Promise<{ prefix: string; suggestedCode: string }>;
  onFetchLinePreview: (
    line: ProductLine,
    category: ProductCategory,
    code: string,
    name: string
  ) => Promise<{ specSheet: TechSpecSheetDTO; codeLabel: ProductCodeLabelDTO }>;
  onUploadImage: (file: File) => Promise<string>;
  onSubmit: (payload: {
    code?: string;
    name: string;
    brand: string;
    category: ProductCategory;
    line: ProductLine;
    price: number;
    stock: number;
    minStock: number;
    supplier: string;
    imageUrl?: string;
    specifications: Record<string, string>;
    services: ExtraServiceType[];
  }) => Promise<void>;
  onClose: () => void;
}

const DEFAULT_SPECS_BY_CATEGORY: Record<ProductCategory, Array<{ key: string; value: string }>> = {
  LAPTOP: [
    { key: 'Procesador', value: 'Intel Core i7 / Ryzen 7' },
    { key: 'RAM', value: '16GB DDR5' },
    { key: 'Almacenamiento', value: '1TB NVMe SSD' },
    { key: 'Pantalla', value: '15.6" FHD 144Hz' },
  ],
  PERIPHERAL: [
    { key: 'Conectividad', value: 'USB-C / Wireless 2.4GHz' },
    { key: 'Sensor / Switches', value: 'Óptico de alta precisión' },
    { key: 'Ergonomía', value: 'Diseño profesional' },
  ],
  COMPONENT: [
    { key: 'Interfaz', value: 'PCIe 4.0' },
    { key: 'Capacidad / Memoria', value: '16GB / 2TB' },
    { key: 'TDP / Consumo', value: 'Eficiente' },
  ],
  ACCESSORY: [
    { key: 'Compatibilidad', value: 'PC / Mac / Consolas' },
    { key: 'Material', value: 'Aluminio / Polímero reforzado' },
    { key: 'Conectividad', value: 'USB-C / Bluetooth' },
  ],
};

const PRESET_IMAGES = [
  { label: 'Laptop Gamer', url: '/images/laptop-gamer.svg' },
  { label: 'Laptop Oficina', url: '/images/laptop-office.svg' },
  { label: 'Mouse Gamer', url: '/images/mouse-gamer.svg' },
  { label: 'Teclado Mecánico', url: '/images/keyboard-gamer.svg' },
  { label: 'Monitor 4K', url: '/images/monitor-office.svg' },
  { label: 'Tarjeta Gráfica', url: '/images/gpu-gamer.svg' },
  { label: 'SSD NVMe', url: '/images/ssd-office.svg' },
  { label: 'Headset Wireless', url: '/images/headset-gamer.svg' },
];

export function ProductFormModal({
  mode,
  initialProduct,
  serviceCatalog,
  defaultMinStock,
  onFetchNextCode,
  onFetchLinePreview,
  onUploadImage,
  onSubmit,
  onClose,
}: ProductFormModalProps) {
  const [category, setCategory] = useState<ProductCategory>(initialProduct?.category ?? 'LAPTOP');
  const [line, setLine] = useState<ProductLine>(initialProduct?.line ?? 'GAMER');
  const [code, setCode] = useState(initialProduct?.code ?? '');
  const [prefix, setPrefix] = useState('LAP');
  const [name, setName] = useState(initialProduct?.name ?? '');
  const [brand, setBrand] = useState(initialProduct?.brand ?? '');
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.basePrice) : '899');
  const [stock, setStock] = useState(initialProduct ? String(initialProduct.stock) : '10');
  const [minStock, setMinStock] = useState(
    initialProduct ? String(initialProduct.minStock) : String(defaultMinStock)
  );
  const [supplier, setSupplier] = useState(initialProduct?.supplier ?? 'TechStock Distribuidora');
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl ?? '/images/laptop-gamer.svg');
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [services, setServices] = useState<ExtraServiceType[]>(initialProduct?.services ?? []);
  const [specRows, setSpecRows] = useState<Array<{ key: string; value: string }>>(() => {
    if (initialProduct && Object.keys(initialProduct.specifications).length > 0) {
      return Object.entries(initialProduct.specifications).map(([key, value]) => ({ key, value }));
    }
    return DEFAULT_SPECS_BY_CATEGORY.LAPTOP;
  });

  const [linePreview, setLinePreview] = useState<{
    specSheet: TechSpecSheetDTO;
    codeLabel: ProductCodeLabelDTO;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'create') {
      onFetchNextCode(category)
        .then((res) => {
          setPrefix(res.prefix);
          setCode(res.suggestedCode);
        })
        .catch(() => {});
    }
  }, [category, mode, onFetchNextCode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFetchLinePreview(line, category, code || `${prefix}-001`, name || 'Producto TechStock')
        .then(setLinePreview)
        .catch(() => {});
    }, 150);
    return () => clearTimeout(timer);
  }, [line, category, code, name, prefix, onFetchLinePreview]);

  const handleCategoryChange = (newCat: ProductCategory) => {
    setCategory(newCat);
    if (mode === 'create') {
      setSpecRows(DEFAULT_SPECS_BY_CATEGORY[newCat]);
      const defaultImg: Record<ProductCategory, string> = {
        LAPTOP: line === 'GAMER' ? '/images/laptop-gamer.svg' : '/images/laptop-office.svg',
        PERIPHERAL: '/images/mouse-gamer.svg',
        COMPONENT: '/images/gpu-gamer.svg',
        ACCESSORY: '/images/headset-gamer.svg',
      };
      setImageUrl(defaultImg[newCat]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setLocalError(null);
    try {
      const uploadedUrl = await onUploadImage(file);
      setImageUrl(uploadedUrl);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const toggleService = (srv: ExtraServiceType) => {
    setServices((prev) => (prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      const specifications: Record<string, string> = {};
      for (const row of specRows) {
        if (row.key.trim() && row.value.trim()) {
          specifications[row.key.trim()] = row.value.trim();
        }
      }

      await onSubmit({
        code: code.trim() || undefined,
        name: name.trim(),
        brand: brand.trim(),
        category,
        line,
        price: Number(price),
        stock: Number(stock),
        minStock: Number(minStock),
        supplier: supplier.trim(),
        imageUrl: imageUrl.trim() || undefined,
        specifications,
        services,
      });
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'No se pudo guardar el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-400" />
              {mode === 'create'
                ? 'Registrar Nuevo Producto Tecnológico'
                : `Editar Producto (${initialProduct?.code})`}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {mode === 'create'
                ? 'Patrones activos: ProductBuilder + ProductFactory (prefijo/validación) + ProductLineFactory (ficha/etiqueta)'
                : 'Al guardar se crea una instantánea Memento para permitir Deshacer (Undo) y se ejecuta UpdateProductCommand'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {localError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 font-medium">
              {localError}
            </div>
          )}

          {/* Paso 1: Categoría, Gama y Código */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Categoría (Factory Method)
              </label>
              <select
                value={category}
                disabled={mode === 'edit'}
                onChange={(e) => handleCategoryChange(e.target.value as ProductCategory)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LAPTOP">Laptop (Prefijo LAP-)</option>
                <option value="PERIPHERAL">Periférico (Prefijo PER-)</option>
                <option value="COMPONENT">Componente (Prefijo CMP-)</option>
                <option value="ACCESSORY">Accesorio (Prefijo ACC-)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Gama (Abstract Factory)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['GAMER', 'OFFICE'] as ProductLine[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLine(opt)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      line === opt
                        ? opt === 'GAMER'
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {opt === 'GAMER' ? 'Gamer' : 'Oficina'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Código Único ({prefix}-XXX)
              </label>
              <input
                type="text"
                value={code}
                disabled={mode === 'edit'}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={`${prefix}-001`}
                className="w-full font-mono rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Vista Previa Abstract Factory */}
          {linePreview && (
            <div
              className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                line === 'GAMER'
                  ? 'bg-violet-50 border-violet-200'
                  : 'bg-sky-50 border-sky-200'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${
                      line === 'GAMER' ? 'bg-violet-600' : 'bg-sky-600'
                    }`}
                  >
                    Abstract Factory · {linePreview.specSheet.badgeLabel}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {linePreview.codeLabel.formattedTag}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>{linePreview.specSheet.tierTitle}:</strong>{' '}
                  {linePreview.specSheet.warrantyTier}
                </p>
              </div>
              <div className="font-mono text-[10px] px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shrink-0">
                Barcode: {linePreview.codeLabel.barcodePayload}
              </div>
            </div>
          )}

          {/* Datos Básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. MSI Raider GE78 HX 17"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Marca *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej. ASUS, Logitech, Dell, NVIDIA"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Precio, Stock, Mínimo, Proveedor */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Precio Base ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Stock Inicial *
              </label>
              <input
                type="number"
                min="0"
                disabled={mode === 'edit'}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Stock Mínimo *
              </label>
              <input
                type="number"
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Proveedor
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Foto del Producto: Subir archivo o URL */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/70">
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Foto del Producto
              </label>
              <div className="inline-flex rounded-lg bg-slate-200 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-3 py-1 rounded-md transition ${
                    imageMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  URL / Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`px-3 py-1 rounded-md transition ${
                    imageMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Subir Imagen
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-4 items-center">
              <div className="space-y-2.5">
                {imageMode === 'url' ? (
                  <>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... o /images/laptop-gamer.svg"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          className={`text-[11px] px-2 py-1 rounded-lg border transition ${
                            imageUrl === preset.url
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-5 cursor-pointer hover:border-indigo-400 transition">
                    <Upload className="w-6 h-6 text-indigo-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      {uploading
                        ? 'Subiendo archivo al servidor...'
                        : 'Haz clic para seleccionar imagen (PNG, JPG, WEBP, GIF)'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Máximo 5 MB</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              <div className="h-24 w-full sm:w-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                <img
                  src={imageUrl || '/images/laptop-gamer.svg'}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Especificaciones Técnicas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Especificaciones Técnicas (ProductBuilder)
              </label>
              <button
                type="button"
                onClick={() => setSpecRows((prev) => [...prev, { key: '', value: '' }])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir campo
              </button>
            </div>
            <div className="space-y-2">
              {specRows.map((row, index) => (
                <div key={index} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) =>
                      setSpecRows((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, key: e.target.value } : r))
                      )
                    }
                    placeholder="Ej. Procesador"
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) =>
                      setSpecRows((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, value: e.target.value } : r))
                      )
                    }
                    placeholder="Ej. Intel Core i9-14900HX"
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSpecRows((prev) => prev.filter((_, i) => i !== index))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Servicios Extra Iniciales (solo en creación) */}
          {mode === 'create' && serviceCatalog.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                Servicios Extra Iniciales (Decorator — Opcional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {serviceCatalog.map((srv) => {
                  const checked = services.includes(srv.type);
                  return (
                    <button
                      key={srv.type}
                      type="button"
                      onClick={() => toggleService(srv.type)}
                      className={`text-left p-3 rounded-xl border transition ${
                        checked
                          ? 'bg-violet-50 border-violet-400 ring-1 ring-violet-400'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900">{srv.name}</p>
                      <p className="text-[11px] text-violet-700 font-semibold mt-0.5">
                        {srv.pricingRule}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
            >
              {submitting
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Construir y Registrar Producto'
                  : 'Guardar Cambios (Crear Memento)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
