import fs from 'fs';
import path from 'path';
import { Product, SerializedProductRecord } from '../../../models/Product';
import {
  AlertItem,
  AuditLogEntry,
  CommandRecord,
  GlobalConfigData,
  KitItemInput,
  ProductLine,
} from '../../../models/types';
import { ProductDirector } from '../builder/ProductBuilder';
import { ProductPrototypeRegistry } from '../prototype/IPrototype';
import { ProductKit, SingleProduct } from '../../structural/composite/InventoryItem';
import { DatabaseConfig } from './DatabaseConfig';

export interface StoredKitRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  line: ProductLine;
  discountPercent: number;
  imageUrl: string;
  items: KitItemInput[];
  createdAt: string;
}

interface PersistedDatabase {
  version: number;
  savedAt: string;
  config: GlobalConfigData;
  products: SerializedProductRecord[];
  kits: StoredKitRecord[];
  alerts: AlertItem[];
  auditLogs: AuditLogEntry[];
  commandHistory: CommandRecord[];
}

/**
 * PATRÓN CREACIONAL: SINGLETON (Almacén Centralizado / Repositorio)
 * Única instancia que administra el acceso centralizado a productos, kits,
 * alertas, logs de auditoría e historial de comandos con persistencia en JSON.
 */
export class InventoryStore {
  private static instance: InventoryStore | null = null;

  private readonly products = new Map<string, Product>();
  private readonly kits = new Map<string, StoredKitRecord>();
  private alerts: AlertItem[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private commandHistory: CommandRecord[] = [];
  public readonly prototypeRegistry = new ProductPrototypeRegistry<Product>();
  private persistenceEnabled = true;

  private constructor() {}

  public static getInstance(): InventoryStore {
    if (!InventoryStore.instance) {
      InventoryStore.instance = new InventoryStore();
    }
    return InventoryStore.instance;
  }

  public setPersistenceEnabled(enabled: boolean): void {
    this.persistenceEnabled = enabled;
  }

  // --- Productos ---
  public getAllProducts(): Product[] {
    return Array.from(this.products.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );
  }

  public getProductById(id: string): Product | undefined {
    return this.products.get(id);
  }

  public getProductByCode(code: string): Product | undefined {
    const normalized = code.trim().toUpperCase();
    for (const product of this.products.values()) {
      if (product.code === normalized) {
        return product;
      }
    }
    return undefined;
  }

  public getExistingProductCodes(): string[] {
    return Array.from(this.products.values()).map((p) => p.code);
  }

  public saveProduct(product: Product): void {
    this.products.set(product.id, product);
    this.prototypeRegistry.register(product);
    this.persist();
  }

  public deleteProduct(id: string): Product | undefined {
    const product = this.products.get(id);
    if (!product) {
      return undefined;
    }
    this.products.delete(id);
    this.prototypeRegistry.unregister(product.code);

    // Limpiar referencias del producto en combos existentes
    for (const kit of this.kits.values()) {
      kit.items = kit.items.filter((item) => item.productId !== id);
    }
    this.persist();
    return product;
  }

  // --- Combos / Kits (Composite) ---
  public saveKitRecord(record: StoredKitRecord): void {
    this.kits.set(record.id, record);
    this.persist();
  }

  public deleteKitRecord(id: string): StoredKitRecord | undefined {
    const record = this.kits.get(id);
    if (!record) {
      return undefined;
    }
    this.kits.delete(id);
    this.persist();
    return record;
  }

  public getExistingKitCodes(): string[] {
    return Array.from(this.kits.values()).map((k) => k.code);
  }

  public buildCompositeKit(record: StoredKitRecord): ProductKit {
    const kit = new ProductKit({
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description,
      line: record.line,
      discountPercent: record.discountPercent,
      imageUrl: record.imageUrl,
      createdAt: record.createdAt,
    });

    for (const entry of record.items) {
      const product = this.products.get(entry.productId);
      if (product) {
        kit.add(new SingleProduct(product), entry.quantity);
      }
    }
    return kit;
  }

  public getAllKits(): ProductKit[] {
    return Array.from(this.kits.values())
      .map((record) => this.buildCompositeKit(record))
      .sort((a, b) => a.getCode().localeCompare(b.getCode()));
  }

  public getKitById(id: string): ProductKit | undefined {
    const record = this.kits.get(id);
    return record ? this.buildCompositeKit(record) : undefined;
  }

  // --- Alertas (Observer) ---
  public getAlerts(includeResolved = false): AlertItem[] {
    const filtered = includeResolved
      ? this.alerts
      : this.alerts.filter((alert) => !alert.resolved);
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public upsertAlert(alert: AlertItem): void {
    const existingIndex = this.alerts.findIndex(
      (item) => item.productId === alert.productId && !item.resolved
    );
    if (existingIndex !== -1) {
      this.alerts[existingIndex] = { ...alert, id: this.alerts[existingIndex].id };
    } else {
      this.alerts.unshift(alert);
    }
    this.alerts = this.alerts.slice(0, 100);
    this.persist();
  }

  public resolveAlertsForProduct(productId: string): void {
    let changed = false;
    for (const alert of this.alerts) {
      if (alert.productId === productId && !alert.resolved) {
        alert.resolved = true;
        changed = true;
      }
    }
    if (changed) {
      this.persist();
    }
  }

  // --- Auditoría (Observer) ---
  public addAuditLog(entry: AuditLogEntry): void {
    this.auditLogs.unshift(entry);
    this.auditLogs = this.auditLogs.slice(0, 200);
    this.persist();
  }

  public getAuditLogs(limit = 80): AuditLogEntry[] {
    return this.auditLogs.slice(0, limit);
  }

  // --- Historial de Comandos (Command) ---
  public addCommandRecord(record: CommandRecord): void {
    this.commandHistory.unshift(record);
    this.commandHistory = this.commandHistory.slice(0, 150);
    this.persist();
  }

  public getCommandHistory(limit = 80): CommandRecord[] {
    return this.commandHistory.slice(0, limit);
  }

  // --- Persistencia JSON ---
  public clearAll(): void {
    this.products.clear();
    this.kits.clear();
    this.alerts = [];
    this.auditLogs = [];
    this.commandHistory = [];
    this.prototypeRegistry.clear();
    this.persist();
  }

  public hasData(): boolean {
    return this.products.size > 0;
  }

  public loadFromDisk(): boolean {
    if (!this.persistenceEnabled) {
      return false;
    }
    const filePath = DatabaseConfig.getInstance().getPersistenceFilePath();
    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw) as PersistedDatabase;
      if (!data || !Array.isArray(data.products) || data.products.length === 0) {
        return false;
      }

      if (data.config) {
        DatabaseConfig.getInstance().updateConfig(data.config);
      }

      this.products.clear();
      this.prototypeRegistry.clear();
      for (const record of data.products) {
        const product = ProductDirector.buildFromRecord(record);
        this.products.set(product.id, product);
        this.prototypeRegistry.register(product);
      }

      this.kits.clear();
      for (const kit of data.kits ?? []) {
        this.kits.set(kit.id, kit);
      }

      this.alerts = data.alerts ?? [];
      this.auditLogs = data.auditLogs ?? [];
      this.commandHistory = data.commandHistory ?? [];
      return true;
    } catch (error) {
      console.warn('[InventoryStore] No se pudo leer inventory.json, se regenerará con seed:', error);
      return false;
    }
  }

  public persist(): void {
    if (!this.persistenceEnabled) {
      return;
    }
    try {
      const filePath = DatabaseConfig.getInstance().getPersistenceFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload: PersistedDatabase = {
        version: 1,
        savedAt: new Date().toISOString(),
        config: DatabaseConfig.getInstance().getConfig(),
        products: this.getAllProducts().map((p) => p.toSerializedRecord()),
        kits: Array.from(this.kits.values()),
        alerts: this.alerts,
        auditLogs: this.auditLogs,
        commandHistory: this.commandHistory,
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (error) {
      console.error('[InventoryStore] Error guardando persistencia JSON:', error);
    }
  }
}
