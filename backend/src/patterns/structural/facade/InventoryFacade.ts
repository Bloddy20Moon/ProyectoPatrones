import { randomUUID } from 'crypto';
import { Product } from '../../../models/Product';
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
import {
  AddStockCommand,
  CommandInvoker,
  RemoveStockCommand,
  UpdateProductCommand,
} from '../../behavioral/command/InventoryCommand';
import { ProductHistory } from '../../behavioral/memento/ProductMemento';
import { InventorySubject } from '../../behavioral/observer/InventoryObserver';
import { ProductDirector } from '../../creational/builder/ProductBuilder';
import { ProductFactoryProvider } from '../../creational/factory-method/ProductFactory';
import { DatabaseConfig } from '../../creational/singleton/DatabaseConfig';
import { InventoryStore, StoredKitRecord } from '../../creational/singleton/InventoryStore';
import { ExportedFile } from '../adapter/IReportExporter';
import {
  GeneralStockReport,
  InventoryReport,
  LowStockReport,
  ValuedReport,
} from '../bridge/InventoryReport';
import { CsvFormat, ExcelFormat, IReportFormat } from '../bridge/ReportFormat';
import { ProductDecoratorChain } from '../decorator/ProductDecorator';
import { IInventoryService } from '../proxy/InventoryAccessProxy';

export class DomainError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'DomainError';
    this.statusCode = statusCode;
  }
}

/**
 * PATRÓN ESTRUCTURAL: FACADE
 * Expone una interfaz unificada y simple (registerProduct, updateStock,
 * cloneProduct, undoProductEdit, createKit, exportInventory, etc.) que orquesta
 * los subsistemas de creación, estado, comandos, mementos, decoradores,
 * composites, reportes y notificaciones Observer.
 */
export class InventoryFacade implements IInventoryService {
  private readonly store: InventoryStore;
  private readonly config: DatabaseConfig;
  private readonly subject: InventorySubject;
  private readonly commandInvoker: CommandInvoker;
  private readonly productHistory: ProductHistory;
  private readonly seedCallback?: () => void;

  constructor(
    subject: InventorySubject,
    commandInvoker: CommandInvoker,
    productHistory: ProductHistory,
    seedCallback?: () => void
  ) {
    this.store = InventoryStore.getInstance();
    this.config = DatabaseConfig.getInstance();
    this.subject = subject;
    this.commandInvoker = commandInvoker;
    this.productHistory = productHistory;
    this.seedCallback = seedCallback;
  }

  public toProductDTO(product: Product): ProductDTO {
    const decorated = ProductDecoratorChain.apply(product);
    const finalPrice = decorated.getPrice();
    const state = product.getState();

    return {
      id: product.id,
      code: product.code,
      name: product.name,
      brand: product.brand,
      category: product.category,
      categoryLabel: product.getCategoryLabel(),
      line: product.line,
      basePrice: Number(product.price.toFixed(2)),
      finalPrice,
      servicesCost: Number((finalPrice - product.price).toFixed(2)),
      services: [...product.services],
      servicesBreakdown: decorated.getServicesBreakdown(),
      decoratedDescription: decorated.getDescription(),
      stock: product.stock,
      minStock: product.minStock,
      status: state.status,
      statusLabel: state.label,
      canAddStock: state.canAddStock().allowed,
      canRemoveStock: state.canRemoveStock(product.stock, 1).allowed,
      canBeSold: state.canBeSold(),
      isDiscontinued: product.isDiscontinued,
      specifications: { ...product.specifications },
      imageUrl: product.imageUrl,
      supplier: product.supplier,
      specSheet: product.specSheet.toJSON(),
      codeLabel: product.codeLabel.toJSON(),
      undoCount: this.productHistory.getCount(product.id),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private requireProduct(id: string): Product {
    const product = this.store.getProductById(id);
    if (!product) {
      throw new DomainError(`Producto no encontrado (id: ${id}).`, 404);
    }
    return product;
  }

  public getDashboardSummary(_actor: ActorContext): DashboardSummary {
    const products = this.store.getAllProducts();
    const kits = this.store.getAllKits();
    const alerts = this.store.getAlerts(false);

    let totalUnits = 0;
    let totalInventoryValue = 0;
    let totalBaseInventoryValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let discontinuedCount = 0;
    let availableCount = 0;
    let decoratedProductsCount = 0;

    const categoryMap = new Map<
      ProductCategory,
      { category: ProductCategory; label: string; count: number; units: number; value: number }
    >([
      ['LAPTOP', { category: 'LAPTOP', label: 'Laptops', count: 0, units: 0, value: 0 }],
      ['PERIPHERAL', { category: 'PERIPHERAL', label: 'Periféricos', count: 0, units: 0, value: 0 }],
      ['COMPONENT', { category: 'COMPONENT', label: 'Componentes', count: 0, units: 0, value: 0 }],
      ['ACCESSORY', { category: 'ACCESSORY', label: 'Accesorios', count: 0, units: 0, value: 0 }],
    ]);

    for (const product of products) {
      const decoratedPrice = ProductDecoratorChain.apply(product).getPrice();
      const productValue = decoratedPrice * product.stock;
      const baseValue = product.price * product.stock;

      totalUnits += product.stock;
      totalInventoryValue += productValue;
      totalBaseInventoryValue += baseValue;

      if (product.services.length > 0) {
        decoratedProductsCount++;
      }

      const status = product.getStatus();
      if (status === 'AVAILABLE') availableCount++;
      if (status === 'LOW_STOCK') lowStockCount++;
      if (status === 'OUT_OF_STOCK') outOfStockCount++;
      if (status === 'DISCONTINUED') discontinuedCount++;

      const bucket = categoryMap.get(product.category);
      if (bucket) {
        bucket.count++;
        bucket.units += product.stock;
        bucket.value = Number((bucket.value + productValue).toFixed(2));
      }
    }

    return {
      kpis: {
        totalProducts: products.length,
        totalUnits,
        totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
        totalBaseInventoryValue: Number(totalBaseInventoryValue.toFixed(2)),
        lowStockCount,
        outOfStockCount,
        discontinuedCount,
        availableCount,
        totalKits: kits.length,
        activeAlertsCount: alerts.length,
      },
      byCategory: Array.from(categoryMap.values()),
      config: this.config.getConfig(),
      patternMetrics: {
        singletonConfigActive: true,
        commandsExecuted: this.store.getCommandHistory(500).length,
        auditLogsRecorded: this.store.getAuditLogs(500).length,
        activeAlerts: alerts.length,
        mementoSnapshotsStored: this.productHistory.getTotalSnapshots(),
        decoratedProductsCount,
        compositeKitsCount: kits.length,
        registeredPrototypes: this.store.prototypeRegistry.count(),
      },
    };
  }

  public listProducts(_actor: ActorContext): ProductDTO[] {
    return this.store.getAllProducts().map((p) => this.toProductDTO(p));
  }

  public getProductById(_actor: ActorContext, id: string): ProductDTO {
    return this.toProductDTO(this.requireProduct(id));
  }

  public suggestNextCode(_actor: ActorContext, category: ProductCategory): string {
    const factory = ProductFactoryProvider.getFactory(category);
    return factory.generateNextCode(this.store.getExistingProductCodes());
  }

  public registerProduct(actor: ActorContext, input: CreateProductInput): ProductDTO {
    const existingCodes = this.store.getExistingProductCodes();
    const product = ProductDirector.buildFromInput(input, existingCodes);

    if (this.store.getProductByCode(product.code)) {
      throw new DomainError(`Ya existe un producto registrado con el código "${product.code}".`, 409);
    }

    this.store.saveProduct(product);

    this.subject.notify({
      type: 'PRODUCT_CREATED',
      pattern: 'Builder + Factory Method + Abstract Factory + Facade',
      actor,
      product,
      message: `Producto registrado: ${product.name} (${product.code}) [${product.codeLabel.shortTag}] con ${product.stock} u.`,
      details: {
        category: product.category,
        line: product.line,
        price: product.price,
        stock: product.stock,
      },
    });

    return this.toProductDTO(product);
  }

  public updateProduct(actor: ActorContext, id: string, input: UpdateProductInput): ProductDTO {
    const product = this.requireProduct(id);

    // Memento: Guardar snapshot ANTES de modificar el producto
    const memento = product.createMemento(`Antes de editar (${actor.actorName})`);
    this.productHistory.push(memento);

    // Command: Ejecutar actualización encapsulada y auditable
    const command = new UpdateProductCommand(product, input, actor.actorName);
    const result = this.commandInvoker.executeCommand(command);
    this.store.saveProduct(product);

    this.subject.notify({
      type: 'PRODUCT_UPDATED',
      pattern: 'Memento + Command + Observer',
      actor,
      product,
      message: `Producto actualizado: ${product.name} (${product.code}). Instantánea Memento guardada para Undo.`,
      details: { changedFields: result.changedFields, mementoId: memento.id },
    });

    return this.toProductDTO(product);
  }

  public deleteProduct(actor: ActorContext, id: string): { deletedCode: string } {
    const product = this.requireProduct(id);
    this.store.deleteProduct(id);
    this.productHistory.clearForProduct(id);

    this.subject.notify({
      type: 'PRODUCT_DELETED',
      pattern: 'Proxy + Facade + Observer',
      actor,
      product,
      targetCode: product.code,
      message: `Producto eliminado del inventario: ${product.name} (${product.code}).`,
    });

    return { deletedCode: product.code };
  }

  public updateStock(actor: ActorContext, id: string, input: StockMovementInput): ProductDTO {
    const product = this.requireProduct(id);
    const quantity = Math.floor(Number(input.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new DomainError('La cantidad debe ser un número entero mayor a 0.');
    }

    const command =
      input.type === 'IN'
        ? new AddStockCommand(product, quantity, input.reason ?? 'Reposición', actor.actorName)
        : new RemoveStockCommand(product, quantity, input.reason ?? 'Venta / Salida', actor.actorName);

    const result = this.commandInvoker.executeCommand(command);
    this.store.saveProduct(product);

    this.subject.notify({
      type: input.type === 'IN' ? 'STOCK_ADDED' : 'STOCK_REMOVED',
      pattern: 'State + Command + Observer',
      actor,
      product,
      message:
        input.type === 'IN'
          ? `Entrada de +${quantity} u. en ${product.code} (${result.previousStock} → ${result.newStock}, Estado: ${product.getState().label}).`
          : `Salida de -${quantity} u. en ${product.code} (${result.previousStock} → ${result.newStock}, Estado: ${product.getState().label}).`,
      details: { ...result, reason: input.reason },
    });

    return this.toProductDTO(product);
  }

  public toggleDiscontinued(actor: ActorContext, id: string, discontinued: boolean): ProductDTO {
    const product = this.requireProduct(id);
    const memento = product.createMemento(
      discontinued ? 'Antes de descontinuar' : 'Antes de reactivar'
    );
    this.productHistory.push(memento);

    product.setDiscontinued(discontinued);
    this.store.saveProduct(product);

    this.subject.notify({
      type: discontinued ? 'PRODUCT_DISCONTINUED' : 'PRODUCT_REACTIVATED',
      pattern: 'State (DiscontinuedState) + Memento',
      actor,
      product,
      message: discontinued
        ? `Producto ${product.code} marcado como DESCONTINUADO (bloquea movimientos de stock).`
        : `Producto ${product.code} REACTIVADO (Estado actual: ${product.getState().label}).`,
    });

    return this.toProductDTO(product);
  }

  public cloneProduct(actor: ActorContext, id: string, overrides?: CloneProductInput): ProductDTO {
    const original = this.requireProduct(id);
    const factory = ProductFactoryProvider.getFactory(original.category);
    const existingCodes = this.store.getExistingProductCodes();
    const targetCode = factory.normalizeAndValidateCode(overrides?.code, existingCodes);

    if (this.store.getProductByCode(targetCode)) {
      throw new DomainError(`El código "${targetCode}" ya está en uso.`, 409);
    }

    // Prototype: clonar desde la instancia/registro de prototipos
    const cloned = this.store.prototypeRegistry.cloneByCode(original.code, {
      ...overrides,
      code: targetCode,
    });

    this.store.saveProduct(cloned);

    this.subject.notify({
      type: 'PRODUCT_CLONED',
      pattern: 'Prototype (clone) + Factory Method',
      actor,
      product: cloned,
      message: `Variante clonada desde ${original.code} → ${cloned.code} (${cloned.name}).`,
      details: { sourceCode: original.code, clonedCode: cloned.code },
    });

    return this.toProductDTO(cloned);
  }

  public undoProductEdit(actor: ActorContext, id: string): ProductDTO {
    const product = this.requireProduct(id);
    const memento = this.productHistory.pop(id);
    if (!memento) {
      throw new DomainError(
        `[Memento] No hay cambios previos guardados para deshacer en ${product.code}.`,
        400
      );
    }

    product.restoreFromMemento(memento);
    this.store.saveProduct(product);

    this.subject.notify({
      type: 'PRODUCT_UNDONE',
      pattern: 'Memento (ProductHistory Undo)',
      actor,
      product,
      message: `Cambios revertidos (Undo) en ${product.code} usando instantánea del ${new Date(memento.savedAt).toLocaleTimeString('es-PE')}.`,
      details: { restoredMementoId: memento.id, reason: memento.reason },
    });

    return this.toProductDTO(product);
  }

  public getProductUndoHistory(_actor: ActorContext, id: string) {
    this.requireProduct(id);
    return this.productHistory.getHistory(id);
  }

  public addServiceToProduct(
    actor: ActorContext,
    id: string,
    service: ExtraServiceType
  ): ProductDTO {
    const product = this.requireProduct(id);
    product.addService(service);
    this.store.saveProduct(product);

    const decorated = ProductDecoratorChain.apply(product);
    this.subject.notify({
      type: 'SERVICE_UPDATED',
      pattern: 'Decorator (ProductDecorator)',
      actor,
      product,
      message: `Servicio "${service}" añadido a ${product.code}. Nuevo precio decorado: ${this.config.formatMoney(decorated.getPrice())}.`,
      details: { service, finalPrice: decorated.getPrice() },
    });

    return this.toProductDTO(product);
  }

  public removeServiceFromProduct(
    actor: ActorContext,
    id: string,
    service: ExtraServiceType
  ): ProductDTO {
    const product = this.requireProduct(id);
    product.removeService(service);
    this.store.saveProduct(product);

    const decorated = ProductDecoratorChain.apply(product);
    this.subject.notify({
      type: 'SERVICE_UPDATED',
      pattern: 'Decorator (ProductDecorator)',
      actor,
      product,
      message: `Servicio "${service}" removido de ${product.code}. Precio recalculado: ${this.config.formatMoney(decorated.getPrice())}.`,
      details: { service, finalPrice: decorated.getPrice() },
    });

    return this.toProductDTO(product);
  }

  public listKits(_actor: ActorContext): KitDTO[] {
    return this.store.getAllKits().map((kit) => kit.toDTO());
  }

  public createKit(actor: ActorContext, input: CreateKitInput): KitDTO {
    if (!input.name || input.name.trim().length < 3) {
      throw new DomainError('El nombre del combo debe tener al menos 3 caracteres.');
    }
    if (!Array.isArray(input.items) || input.items.length < 2) {
      throw new DomainError('Un Combo / Kit debe agrupar al menos 2 productos.');
    }

    for (const item of input.items) {
      this.requireProduct(item.productId);
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new DomainError('Cada producto del combo debe tener una cantidad >= 1.');
      }
    }

    const existingKitCodes = this.store.getExistingKitCodes();
    const resolvedCode = input.code?.trim()
      ? input.code.trim().toUpperCase()
      : this.generateNextKitCode(existingKitCodes);

    if (existingKitCodes.includes(resolvedCode)) {
      throw new DomainError(`Ya existe un combo con el código "${resolvedCode}".`, 409);
    }

    const record: StoredKitRecord = {
      id: randomUUID(),
      code: resolvedCode,
      name: input.name.trim(),
      description: input.description?.trim() || 'Combo tecnológico armado en TechStock',
      line: input.line ?? 'GAMER',
      discountPercent: Math.min(50, Math.max(0, Number(input.discountPercent) || 0)),
      imageUrl: input.imageUrl?.trim() || '/images/combo-gamer.svg',
      items: input.items.map((i) => ({ productId: i.productId, quantity: Math.floor(i.quantity) })),
      createdAt: new Date().toISOString(),
    };

    this.store.saveKitRecord(record);
    const kit = this.store.buildCompositeKit(record);
    const dto = kit.toDTO();

    this.subject.notify({
      type: 'KIT_CREATED',
      pattern: 'Composite (ProductKit + SingleProduct)',
      actor,
      targetCode: dto.code,
      message: `Combo creado: ${dto.name} (${dto.code}) con ${dto.items.length} productos — Precio: ${this.config.formatMoney(dto.finalPrice)}, Stock armable: ${dto.availableStock}.`,
      details: { kitCode: dto.code, finalPrice: dto.finalPrice, availableStock: dto.availableStock },
    });

    return dto;
  }

  public deleteKit(actor: ActorContext, id: string): { deletedCode: string } {
    const deleted = this.store.deleteKitRecord(id);
    if (!deleted) {
      throw new DomainError(`Combo no encontrado (id: ${id}).`, 404);
    }

    this.subject.notify({
      type: 'KIT_DELETED',
      pattern: 'Composite + Proxy',
      actor,
      targetCode: deleted.code,
      message: `Combo eliminado: ${deleted.name} (${deleted.code}).`,
    });

    return { deletedCode: deleted.code };
  }

  public listAlerts(_actor: ActorContext, includeResolved = false): AlertItem[] {
    return this.store.getAlerts(includeResolved);
  }

  public listAuditLogs(_actor: ActorContext): AuditLogEntry[] {
    return this.store.getAuditLogs(100);
  }

  public listCommandHistory(_actor: ActorContext): CommandRecord[] {
    return this.store.getCommandHistory(100);
  }

  public async exportInventory(
    actor: ActorContext,
    reportType: ReportType,
    formatType: ReportFormatType
  ): Promise<ExportedFile> {
    // Bridge: seleccionar implementación de formato (Excel vs CSV) -> Adapter interno
    const format: IReportFormat = formatType === 'csv' ? new CsvFormat() : new ExcelFormat();

    // Bridge: seleccionar abstracción de reporte
    let report: InventoryReport;
    switch (reportType) {
      case 'low-stock':
        report = new LowStockReport(format);
        break;
      case 'valued':
        report = new ValuedReport(format);
        break;
      case 'general':
      default:
        report = new GeneralStockReport(format);
        break;
    }

    const file = await report.generate(this.store.getAllProducts(), this.store.getAllKits());

    this.subject.notify({
      type: 'REPORT_EXPORTED',
      pattern: 'Bridge (InventoryReport + ReportFormat) + Adapter (ExcelExporterAdapter)',
      actor,
      message: `Reporte "${report.reportType}" exportado en formato ${format.formatName} (${file.filename}).`,
      details: { reportType: report.reportType, format: format.formatName, bytes: file.buffer.length },
    });

    return file;
  }

  public getConfig(_actor: ActorContext): GlobalConfigData {
    return this.config.getConfig();
  }

  public updateConfig(actor: ActorContext, updates: Partial<GlobalConfigData>): GlobalConfigData {
    const updated = this.config.updateConfig(updates);
    this.store.persist();

    this.subject.notify({
      type: 'CONFIG_UPDATED',
      pattern: 'Singleton (DatabaseConfig)',
      actor,
      message: `Configuración global actualizada: ${updated.storeName}, moneda ${updated.currency} (${updated.currencySymbol}), stock mín. por defecto ${updated.defaultMinStock}.`,
      details: { ...updated },
    });

    return updated;
  }

  public resetSeedData(actor: ActorContext): DashboardSummary {
    if (!this.seedCallback) {
      throw new DomainError('Función de reinicio de datos semilla no disponible.', 500);
    }
    this.store.clearAll();
    this.productHistory.clearAll();
    this.seedCallback();
    return this.getDashboardSummary(actor);
  }

  private generateNextKitCode(existingCodes: string[]): string {
    let maxNum = 0;
    for (const code of existingCodes) {
      const match = code.match(/^KIT-(\d+)$/i);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (parsed > maxNum) maxNum = parsed;
      }
    }
    return `KIT-${String(maxNum + 1).padStart(3, '0')}`;
  }
}
