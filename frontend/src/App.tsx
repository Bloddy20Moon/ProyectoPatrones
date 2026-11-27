import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Cpu,
  FileSpreadsheet,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  List,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { ApiError, createInventoryApi } from './api/client';
import { AlertsPanel } from './components/AlertsPanel';
import { AuditSection } from './components/AuditSection';
import { CloneModal } from './components/CloneModal';
import { ExportModal } from './components/ExportModal';
import { KitsSection } from './components/KitsSection';
import { KpiCards } from './components/KpiCards';
import { PatternsAndConfigSection } from './components/PatternsAndConfigSection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductFormModal } from './components/ProductFormModal';
import { ProductTable } from './components/ProductTable';
import { ServicesModal } from './components/ServicesModal';
import { StockModal } from './components/StockModal';
import { ToastBanner } from './components/ToastBanner';
import {
  AlertItem,
  AuditLogEntry,
  CommandRecord,
  DashboardSummary,
  ExtraServiceCatalogItem,
  ExtraServiceType,
  GlobalConfigData,
  KitDTO,
  ProductCategory,
  ProductDTO,
  ProductLine,
  ReportFormatType,
  ReportType,
  StockStatus,
  ToastMessage,
  UserRole,
} from './types/inventory';

type ActiveView = 'dashboard' | 'kits' | 'audit' | 'patterns';

export default function App() {
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [kits, setKits] = useState<KitDTO[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [commands, setCommands] = useState<CommandRecord[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ExtraServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'ALL'>('ALL');
  const [lineFilter, setLineFilter] = useState<ProductLine | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'ALL'>('ALL');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null);
  const [stockProduct, setStockProduct] = useState<ProductDTO | null>(null);
  const [cloneProduct, setCloneProduct] = useState<ProductDTO | null>(null);
  const [servicesProductId, setServicesProductId] = useState<string | null>(null);
  const [inspectProduct, setInspectProduct] = useState<ProductDTO | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const api = useMemo(() => createInventoryApi(role), [role]);

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5200);
  }, []);

  const handleApiError = useCallback(
    (err: unknown, fallbackTitle = 'Operación no permitida') => {
      if (err instanceof ApiError && err.status === 403) {
        pushToast({
          type: 'proxy',
          title: 'Bloqueado por Control de Roles',
          message: err.message,
          pattern: 'Proxy (InventoryAccessProxy)',
        });
        return;
      }
      const message = err instanceof Error ? err.message : 'Error inesperado';
      pushToast({
        type: 'error',
        title: fallbackTitle,
        message,
      });
    },
    [pushToast]
  );

  const loadAll = useCallback(async () => {
    try {
      const [dash, prodRes, kitRes, alertRes, logRes, cmdRes, srvRes] = await Promise.all([
        api.getDashboard(),
        api.getProducts(),
        api.getKits(),
        api.getAlerts(false),
        api.getAuditLogs(),
        api.getCommandHistory(),
        api.getServiceCatalog(),
      ]);
      setSummary(dash);
      setProducts(prodRes.products);
      setKits(kitRes.kits);
      setAlerts(alertRes.alerts);
      setAuditLogs(logRes.logs);
      setCommands(cmdRes.commands);
      setServiceCatalog(srvRes.services);
    } catch (err) {
      handleApiError(err, 'Error de conexión con el Backend');
    } finally {
      setLoading(false);
    }
  }, [api, handleApiError]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (lineFilter !== 'ALL' && p.line !== lineFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.codeLabel.shortTag.toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryFilter, lineFilter, statusFilter]);

  const activeServicesProduct = useMemo(
    () => products.find((p) => p.id === servicesProductId) ?? null,
    [products, servicesProductId]
  );

  const currencySymbol = summary?.config.currencySymbol ?? '$';

  // --- Handlers conectados a los 15 Patrones ---
  const handleCreateProduct = async (payload: Parameters<typeof api.createProduct>[0]) => {
    try {
      const { product } = await api.createProduct(payload);
      await loadAll();
      pushToast({
        type: 'success',
        title: `Producto ${product.code} registrado`,
        message: `${product.name} creado con etiqueta ${product.codeLabel.shortTag}.`,
        pattern: 'Builder + Factory Method + Abstract Factory',
      });
    } catch (err) {
      handleApiError(err, 'Error al registrar producto');
      throw err;
    }
  };

  const handleEditProduct = async (payload: Parameters<typeof api.createProduct>[0]) => {
    if (!editingProduct) return;
    try {
      const { product } = await api.updateProduct(editingProduct.id, {
        name: payload.name,
        brand: payload.brand,
        line: payload.line,
        price: payload.price,
        minStock: payload.minStock,
        supplier: payload.supplier,
        imageUrl: payload.imageUrl,
        specifications: payload.specifications,
      });
      await loadAll();
      pushToast({
        type: 'success',
        title: `${product.code} actualizado`,
        message: `Instantánea Memento guardada (${product.undoCount} disponibles para Deshacer).`,
        pattern: 'Memento + Command',
      });
    } catch (err) {
      handleApiError(err, 'Error al editar producto');
      throw err;
    }
  };

  const handleStockMove = async (
    product: ProductDTO,
    type: 'IN' | 'OUT',
    quantity: number,
    reason: string
  ) => {
    try {
      const { product: updated } = await api.moveStock(product.id, type, quantity, reason);
      await loadAll();
      pushToast({
        type: 'success',
        title: type === 'IN' ? `Entrada +${quantity} u.` : `Salida -${quantity} u.`,
        message: `${updated.code}: stock ahora ${updated.stock} u. — Estado: ${updated.statusLabel}.`,
        pattern: 'Command + State + Observer',
      });
    } catch (err) {
      handleApiError(err, 'Movimiento bloqueado por State o Proxy');
      throw err;
    }
  };

  const handleQuickRestock = async (productId: string, productCode: string) => {
    try {
      const { product } = await api.moveStock(
        productId,
        'IN',
        5,
        'Reposición rápida desde alerta Observer'
      );
      await loadAll();
      pushToast({
        type: 'success',
        title: `Reposición +5 en ${productCode}`,
        message: `Stock actualizado a ${product.stock} u. (${product.statusLabel}).`,
        pattern: 'Observer + Command + State',
      });
    } catch (err) {
      handleApiError(err, 'No se pudo reabastecer');
    }
  };

  const handleUndo = async (product: ProductDTO) => {
    try {
      const { product: restored } = await api.undoProduct(product.id);
      await loadAll();
      pushToast({
        type: 'success',
        title: `Cambios revertidos en ${restored.code}`,
        message: `Se restauró la instantánea anterior (${restored.name}, ${currencySymbol}${restored.basePrice}).`,
        pattern: 'Memento (Undo)',
      });
    } catch (err) {
      handleApiError(err, 'Error al deshacer');
    }
  };

  const handleClone = async (overrides: {
    code: string;
    name: string;
    price: number;
    stock: number;
    line: ProductLine;
  }) => {
    if (!cloneProduct) return;
    try {
      const { product } = await api.cloneProduct(cloneProduct.id, overrides);
      await loadAll();
      pushToast({
        type: 'success',
        title: `Variante clonada: ${product.code}`,
        message: `Clonado desde ${cloneProduct.code} con especificaciones y foto duplicadas.`,
        pattern: 'Prototype (clone)',
      });
    } catch (err) {
      handleApiError(err, 'Error al clonar');
      throw err;
    }
  };

  const handleToggleDiscontinue = async (product: ProductDTO) => {
    try {
      const { product: updated } = await api.toggleDiscontinued(
        product.id,
        !product.isDiscontinued
      );
      await loadAll();
      pushToast({
        type: 'warning',
        title: updated.isDiscontinued
          ? `${updated.code} descontinuado`
          : `${updated.code} reactivado`,
        message: `Estado actual: ${updated.statusLabel}.`,
        pattern: 'State (DiscontinuedState)',
      });
    } catch (err) {
      handleApiError(err, 'No se pudo cambiar el estado');
    }
  };

  const handleDeleteProduct = async (product: ProductDTO) => {
    try {
      const res = await api.deleteProduct(product.id);
      await loadAll();
      pushToast({
        type: 'success',
        title: `Producto ${res.deletedCode} eliminado`,
        message: 'Operación autorizada por InventoryAccessProxy (Admin).',
        pattern: 'Proxy + Facade',
      });
    } catch (err) {
      handleApiError(err, 'No se pudo eliminar');
    }
  };

  const handleAddService = async (service: ExtraServiceType) => {
    if (!servicesProductId) return;
    try {
      const { product } = await api.addService(servicesProductId, service);
      await loadAll();
      pushToast({
        type: 'success',
        title: `Servicio añadido a ${product.code}`,
        message: `Precio recalculado dinámicamente: ${currencySymbol}${product.finalPrice.toFixed(2)}.`,
        pattern: 'Decorator',
      });
    } catch (err) {
      handleApiError(err, 'No se pudo añadir el servicio');
      throw err;
    }
  };

  const handleRemoveService = async (service: ExtraServiceType) => {
    if (!servicesProductId) return;
    try {
      const { product } = await api.removeService(servicesProductId, service);
      await loadAll();
      pushToast({
        type: 'success',
        title: `Servicio retirado de ${product.code}`,
        message: `Precio actualizado: ${currencySymbol}${product.finalPrice.toFixed(2)}.`,
        pattern: 'Decorator',
      });
    } catch (err) {
      handleApiError(err, 'No se pudo retirar el servicio');
      throw err;
    }
  };

  const handleCreateKit = async (payload: Parameters<typeof api.createKit>[0]) => {
    try {
      const { kit } = await api.createKit(payload);
      await loadAll();
      pushToast({
        type: 'success',
        title: `Combo ${kit.code} armado`,
        message: `${kit.name} — ${currencySymbol}${kit.finalPrice.toFixed(2)} (${kit.availableStock} armables).`,
        pattern: 'Composite (ProductKit)',
      });
    } catch (err) {
      handleApiError(err, 'No se pudo crear el combo');
      throw err;
    }
  };

  const handleDeleteKit = async (kit: KitDTO) => {
    try {
      await api.deleteKit(kit.id);
      await loadAll();
      pushToast({
        type: 'success',
        title: `Combo ${kit.code} eliminado`,
        message: `${kit.name} fue retirado del catálogo de combos.`,
        pattern: 'Composite + Proxy',
      });
    } catch (err) {
      handleApiError(err, 'No se pudo eliminar el combo');
    }
  };

  const handleExport = async (type: ReportType, format: ReportFormatType) => {
    try {
      const filename = await api.exportReport(type, format);
      await loadAll();
      pushToast({
        type: 'success',
        title: 'Reporte exportado correctamente',
        message: `Archivo descargado: ${filename}`,
        pattern: 'Bridge + Adapter',
      });
    } catch (err) {
      handleApiError(err, 'Error al exportar reporte');
    }
  };

  const handleUpdateConfig = async (updates: Partial<GlobalConfigData>) => {
    try {
      await api.updateConfig(updates);
      await loadAll();
      pushToast({
        type: 'success',
        title: 'Configuración Singleton actualizada',
        message: 'Los cambios aplican globalmente a todo TechStock.',
        pattern: 'Singleton (DatabaseConfig)',
      });
    } catch (err) {
      handleApiError(err, 'No se pudo actualizar configuración');
    }
  };

  const handleResetSeed = async () => {
    try {
      await api.resetSeed();
      await loadAll();
      pushToast({
        type: 'success',
        title: 'Catálogo semilla restaurado',
        message: 'Se cargaron los 8 productos tecnológicos y el Combo Pro Gamer Ultimate.',
        pattern: 'Singleton + Builder + Composite',
      });
    } catch (err) {
      handleApiError(err, 'No se pudo restaurar el catálogo');
    }
  };

  const navItems: Array<{ id: ActiveView; label: string; icon: typeof LayoutDashboard; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard & Stock', icon: LayoutDashboard, badge: alerts.length },
    { id: 'kits', label: 'Combos / Kits', icon: Layers, badge: kits.length },
    { id: 'audit', label: 'Auditoría & Comandos', icon: Activity, badge: commands.length },
    { id: 'patterns', label: '15 Patrones & Config', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-slate-950 text-slate-100 flex-col border-r border-slate-800 shrink-0">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight leading-none">
              {summary?.config.storeName ?? 'TechStock'}
            </h1>
            <p className="text-[11px] text-indigo-300 font-semibold mt-0.5">
              15 Patrones GoF · POO
            </p>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      active
                        ? 'bg-white/20 text-white'
                        : item.id === 'dashboard'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tarjeta de Rol Activo (Proxy) */}
        <div className="p-4 m-3 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Control de Acceso (Proxy)
          </p>
          <div className="mt-2 flex items-center gap-2">
            {role === 'ADMIN' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold text-white">
                {role === 'ADMIN' ? 'Administrador' : 'Vendedor'}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight">
                {role === 'ADMIN'
                  ? 'Acceso total a CRUD, stock, kits y config.'
                  : 'Puede consultar, vender (salida), añadir extras y exportar.'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Navegación móvil + título */}
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  {activeView === 'dashboard'
                    ? 'Dashboard de Inventario Tecnológico'
                    : activeView === 'kits'
                      ? 'Combos y Kits Tecnológicos'
                      : activeView === 'audit'
                        ? 'Auditoría y Comandos'
                        : 'Arquitectura de 15 Patrones GoF'}
                </h2>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Facade · Singleton · Factory · Abstract Factory · Builder · Prototype · Adapter ·
                  Bridge · Decorator · Composite · Proxy · State · Observer · Command · Memento
                </p>
              </div>
            </div>

            {/* Controles derecha: Role Switcher (Proxy) + Export (Bridge) + Nuevo Producto */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Switcher de Rol (Proxy) */}
              <div
                className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200"
                title="Patrón Proxy: cambia entre Administrador y Vendedor para probar permisos"
              >
                <button
                  onClick={() => {
                    setRole('ADMIN');
                    pushToast({
                      type: 'success',
                      title: 'Rol cambiado a Administrador',
                      message: 'InventoryAccessProxy habilita operaciones completas.',
                      pattern: 'Proxy',
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    role === 'ADMIN'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Admin
                </button>
                <button
                  onClick={() => {
                    setRole('SELLER');
                    pushToast({
                      type: 'warning',
                      title: 'Rol cambiado a Vendedor',
                      message:
                        'InventoryAccessProxy bloqueará crear, editar, clonar, eliminar y reabastecer.',
                      pattern: 'Proxy',
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    role === 'SELLER'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Vendedor
                </button>
              </div>

              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
                title="Patrones Bridge + Adapter: exportar Excel (.xlsx) o CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel/CSV
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
                title="Patrones Builder + Factory Method + Abstract Factory"
              >
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </button>
            </div>
          </div>

          {/* Navegación móvil */}
          <div className="flex lg:hidden gap-1.5 mt-3 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${
                    active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
          {loading ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-500 font-medium">
              Cargando inventario TechStock...
            </div>
          ) : activeView === 'dashboard' ? (
            <>
              <KpiCards summary={summary} />

              <AlertsPanel alerts={alerts} onQuickRestock={handleQuickRestock} />

              {/* Barra de filtros */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por código (LAP-001), nombre, marca o etiqueta..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'ALL')}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white"
                  >
                    <option value="ALL">Todas las categorías</option>
                    <option value="LAPTOP">Laptops</option>
                    <option value="PERIPHERAL">Periféricos</option>
                    <option value="COMPONENT">Componentes</option>
                    <option value="ACCESSORY">Accesorios</option>
                  </select>

                  <select
                    value={lineFilter}
                    onChange={(e) => setLineFilter(e.target.value as ProductLine | 'ALL')}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white"
                  >
                    <option value="ALL">Todas las gamas</option>
                    <option value="GAMER">Gama Gamer</option>
                    <option value="OFFICE">Gama Oficina</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StockStatus | 'ALL')}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white"
                  >
                    <option value="ALL">Todos los estados</option>
                    <option value="AVAILABLE">Disponible</option>
                    <option value="LOW_STOCK">Stock Bajo</option>
                    <option value="OUT_OF_STOCK">Agotado</option>
                    <option value="DISCONTINUED">Descontinuado</option>
                  </select>

                  <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg ${
                        viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                      }`}
                      title="Vista Tarjetas"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg ${
                        viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                      }`}
                      title="Vista Tabla"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Catálogo */}
              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-500">
                  No se encontraron productos con los filtros seleccionados.
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currencySymbol={currencySymbol}
                      role={role}
                      onInspect={setInspectProduct}
                      onStock={setStockProduct}
                      onEdit={setEditingProduct}
                      onUndo={handleUndo}
                      onClone={setCloneProduct}
                      onServices={(p) => setServicesProductId(p.id)}
                      onToggleDiscontinue={handleToggleDiscontinue}
                      onDelete={handleDeleteProduct}
                    />
                  ))}
                </div>
              ) : (
                <ProductTable
                  products={filteredProducts}
                  currencySymbol={currencySymbol}
                  role={role}
                  onInspect={setInspectProduct}
                  onStock={setStockProduct}
                  onEdit={setEditingProduct}
                  onUndo={handleUndo}
                  onClone={setCloneProduct}
                  onServices={(p) => setServicesProductId(p.id)}
                  onDelete={handleDeleteProduct}
                />
              )}
            </>
          ) : activeView === 'kits' ? (
            <KitsSection
              kits={kits}
              products={products}
              currencySymbol={currencySymbol}
              role={role}
              onCreateKit={handleCreateKit}
              onDeleteKit={handleDeleteKit}
            />
          ) : activeView === 'audit' ? (
            <AuditSection commands={commands} logs={auditLogs} />
          ) : (
            <PatternsAndConfigSection
              summary={summary}
              role={role}
              onUpdateConfig={handleUpdateConfig}
              onResetSeed={handleResetSeed}
            />
          )}
        </main>
      </div>

      {/* Modales */}
      {showCreateModal && (
        <ProductFormModal
          mode="create"
          serviceCatalog={serviceCatalog}
          defaultMinStock={summary?.config.defaultMinStock ?? 5}
          onFetchNextCode={(cat) => api.getNextCode(cat)}
          onFetchLinePreview={(l, c, cd, nm) => api.getLinePreview(l, c, cd, nm)}
          onUploadImage={async (file) => (await api.uploadImage(file)).imageUrl}
          onSubmit={handleCreateProduct}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingProduct && (
        <ProductFormModal
          mode="edit"
          initialProduct={editingProduct}
          serviceCatalog={serviceCatalog}
          defaultMinStock={summary?.config.defaultMinStock ?? 5}
          onFetchNextCode={(cat) => api.getNextCode(cat)}
          onFetchLinePreview={(l, c, cd, nm) => api.getLinePreview(l, c, cd, nm)}
          onUploadImage={async (file) => (await api.uploadImage(file)).imageUrl}
          onSubmit={handleEditProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {stockProduct && (
        <StockModal
          product={stockProduct}
          onSubmit={(t, q, r) => handleStockMove(stockProduct, t, q, r)}
          onClose={() => setStockProduct(null)}
        />
      )}

      {cloneProduct && (
        <CloneModal
          product={cloneProduct}
          onFetchNextCode={(cat) => api.getNextCode(cat)}
          onSubmit={handleClone}
          onClose={() => setCloneProduct(null)}
        />
      )}

      {activeServicesProduct && (
        <ServicesModal
          product={activeServicesProduct}
          currencySymbol={currencySymbol}
          catalog={serviceCatalog}
          onAddService={handleAddService}
          onRemoveService={handleRemoveService}
          onClose={() => setServicesProductId(null)}
        />
      )}

      {inspectProduct && (
        <ProductDetailModal
          product={inspectProduct}
          currencySymbol={currencySymbol}
          onFetchHistory={async (id) => (await api.getUndoHistory(id)).history}
          onUndo={handleUndo}
          onClose={() => setInspectProduct(null)}
        />
      )}

      {showExportModal && (
        <ExportModal
          onExport={handleExport}
          onClose={() => setShowExportModal(false)}
        />
      )}

      <ToastBanner
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
