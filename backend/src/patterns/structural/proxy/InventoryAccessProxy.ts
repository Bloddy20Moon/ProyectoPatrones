import {
  ActorContext,
  AlertItem,
  AuditLogEntry,
  CloneProductInput,
  CommandRecord,
  CreateKitInput,
  CreateProductInput,
  DashboardSummary,
  ExtraServiceType,
  GlobalConfigData,
  KitDTO,
  ProductCategory,
  ProductDTO,
  ReportFormatType,
  ReportType,
  StockMovementInput,
  UpdateProductInput,
} from '../../../models/types';
import { ExportedFile } from '../adapter/IReportExporter';
import { InventorySubject } from '../../behavioral/observer/InventoryObserver';

export class AccessDeniedError extends Error {
  public readonly statusCode = 403;
  public readonly pattern = 'Proxy (InventoryAccessProxy)';

  constructor(message: string) {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

/**
 * Interfaz común (Subject) implementada por InventoryFacade (RealSubject)
 * y por InventoryAccessProxy (Proxy de control de acceso por rol).
 */
export interface IInventoryService {
  getDashboardSummary(actor: ActorContext): DashboardSummary;
  listProducts(actor: ActorContext): ProductDTO[];
  getProductById(actor: ActorContext, id: string): ProductDTO;
  suggestNextCode(actor: ActorContext, category: ProductCategory): string;
  registerProduct(actor: ActorContext, input: CreateProductInput): ProductDTO;
  updateProduct(actor: ActorContext, id: string, input: UpdateProductInput): ProductDTO;
  deleteProduct(actor: ActorContext, id: string): { deletedCode: string };
  updateStock(actor: ActorContext, id: string, input: StockMovementInput): ProductDTO;
  toggleDiscontinued(actor: ActorContext, id: string, discontinued: boolean): ProductDTO;
  cloneProduct(actor: ActorContext, id: string, overrides?: CloneProductInput): ProductDTO;
  undoProductEdit(actor: ActorContext, id: string): ProductDTO;
  getProductUndoHistory(actor: ActorContext, id: string): Array<{
    id: string;
    savedAt: string;
    reason: string;
    name: string;
    price: number;
  }>;
  addServiceToProduct(actor: ActorContext, id: string, service: ExtraServiceType): ProductDTO;
  removeServiceFromProduct(actor: ActorContext, id: string, service: ExtraServiceType): ProductDTO;
  listKits(actor: ActorContext): KitDTO[];
  createKit(actor: ActorContext, input: CreateKitInput): KitDTO;
  deleteKit(actor: ActorContext, id: string): { deletedCode: string };
  listAlerts(actor: ActorContext, includeResolved?: boolean): AlertItem[];
  listAuditLogs(actor: ActorContext): AuditLogEntry[];
  listCommandHistory(actor: ActorContext): CommandRecord[];
  exportInventory(
    actor: ActorContext,
    reportType: ReportType,
    formatType: ReportFormatType
  ): Promise<ExportedFile>;
  getConfig(actor: ActorContext): GlobalConfigData;
  updateConfig(actor: ActorContext, updates: Partial<GlobalConfigData>): GlobalConfigData;
  resetSeedData(actor: ActorContext): DashboardSummary;
}

/**
 * PATRÓN ESTRUCTURAL: PROXY (Protection Proxy)
 * Controla los permisos según rol (ADMIN vs SELLER) antes de delegar cualquier
 * operación sensible (crear, editar, clonar, deshacer, descontinuar, eliminar,
 * gestionar combos o cambiar configuración global) al InventoryFacade.
 */
export class InventoryAccessProxy implements IInventoryService {
  private readonly realService: IInventoryService;
  private readonly subject: InventorySubject;

  constructor(realService: IInventoryService, subject: InventorySubject) {
    this.realService = realService;
    this.subject = subject;
  }

  private assertAdmin(actor: ActorContext, actionDescription: string, targetCode?: string): void {
    if (actor.role !== 'ADMIN') {
      const errorMsg = `[InventoryAccessProxy] Acceso denegado: El rol VENDEDOR no tiene permiso para ${actionDescription}. Cambia a rol ADMINISTRADOR.`;
      this.subject.notify({
        type: 'ACCESS_DENIED',
        pattern: 'Proxy (InventoryAccessProxy)',
        actor,
        targetCode,
        message: errorMsg,
        details: { attemptedAction: actionDescription },
      });
      throw new AccessDeniedError(errorMsg);
    }
  }

  public getDashboardSummary(actor: ActorContext): DashboardSummary {
    return this.realService.getDashboardSummary(actor);
  }

  public listProducts(actor: ActorContext): ProductDTO[] {
    return this.realService.listProducts(actor);
  }

  public getProductById(actor: ActorContext, id: string): ProductDTO {
    return this.realService.getProductById(actor, id);
  }

  public suggestNextCode(actor: ActorContext, category: ProductCategory): string {
    return this.realService.suggestNextCode(actor, category);
  }

  public registerProduct(actor: ActorContext, input: CreateProductInput): ProductDTO {
    this.assertAdmin(actor, 'registrar nuevos productos en el inventario', input.code);
    return this.realService.registerProduct(actor, input);
  }

  public updateProduct(actor: ActorContext, id: string, input: UpdateProductInput): ProductDTO {
    this.assertAdmin(actor, 'editar datos de productos');
    return this.realService.updateProduct(actor, id, input);
  }

  public deleteProduct(actor: ActorContext, id: string): { deletedCode: string } {
    this.assertAdmin(actor, 'eliminar productos del inventario');
    return this.realService.deleteProduct(actor, id);
  }

  public updateStock(actor: ActorContext, id: string, input: StockMovementInput): ProductDTO {
    // Vendedor puede registrar salidas por venta (OUT), pero solo Admin registra ingresos/compras (IN)
    if (input.type === 'IN') {
      this.assertAdmin(actor, 'registrar entradas/reposiciones de almacén');
    }
    return this.realService.updateStock(actor, id, input);
  }

  public toggleDiscontinued(actor: ActorContext, id: string, discontinued: boolean): ProductDTO {
    this.assertAdmin(
      actor,
      discontinued ? 'descontinuar productos' : 'reactivar productos descontinuados'
    );
    return this.realService.toggleDiscontinued(actor, id, discontinued);
  }

  public cloneProduct(actor: ActorContext, id: string, overrides?: CloneProductInput): ProductDTO {
    this.assertAdmin(actor, 'clonar productos y crear variantes');
    return this.realService.cloneProduct(actor, id, overrides);
  }

  public undoProductEdit(actor: ActorContext, id: string): ProductDTO {
    this.assertAdmin(actor, 'deshacer cambios de edición (Undo)');
    return this.realService.undoProductEdit(actor, id);
  }

  public getProductUndoHistory(actor: ActorContext, id: string) {
    return this.realService.getProductUndoHistory(actor, id);
  }

  public addServiceToProduct(
    actor: ActorContext,
    id: string,
    service: ExtraServiceType
  ): ProductDTO {
    return this.realService.addServiceToProduct(actor, id, service);
  }

  public removeServiceFromProduct(
    actor: ActorContext,
    id: string,
    service: ExtraServiceType
  ): ProductDTO {
    this.assertAdmin(actor, 'retirar servicios extra de un producto');
    return this.realService.removeServiceFromProduct(actor, id, service);
  }

  public listKits(actor: ActorContext): KitDTO[] {
    return this.realService.listKits(actor);
  }

  public createKit(actor: ActorContext, input: CreateKitInput): KitDTO {
    this.assertAdmin(actor, 'armar nuevos combos o kits tecnológicos', input.code);
    return this.realService.createKit(actor, input);
  }

  public deleteKit(actor: ActorContext, id: string): { deletedCode: string } {
    this.assertAdmin(actor, 'eliminar combos o kits tecnológicos');
    return this.realService.deleteKit(actor, id);
  }

  public listAlerts(actor: ActorContext, includeResolved?: boolean): AlertItem[] {
    return this.realService.listAlerts(actor, includeResolved);
  }

  public listAuditLogs(actor: ActorContext): AuditLogEntry[] {
    return this.realService.listAuditLogs(actor);
  }

  public listCommandHistory(actor: ActorContext): CommandRecord[] {
    return this.realService.listCommandHistory(actor);
  }

  public async exportInventory(
    actor: ActorContext,
    reportType: ReportType,
    formatType: ReportFormatType
  ): Promise<ExportedFile> {
    return this.realService.exportInventory(actor, reportType, formatType);
  }

  public getConfig(actor: ActorContext): GlobalConfigData {
    return this.realService.getConfig(actor);
  }

  public updateConfig(actor: ActorContext, updates: Partial<GlobalConfigData>): GlobalConfigData {
    this.assertAdmin(actor, 'modificar la configuración global del sistema');
    return this.realService.updateConfig(actor, updates);
  }

  public resetSeedData(actor: ActorContext): DashboardSummary {
    this.assertAdmin(actor, 'restaurar los datos semilla del sistema');
    return this.realService.resetSeedData(actor);
  }
}
