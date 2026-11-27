import { randomUUID } from 'crypto';
import { Product } from '../../../models/Product';
import { CommandRecord, StockStatus, UpdateProductInput } from '../../../models/types';
import { InventoryStore } from '../../creational/singleton/InventoryStore';

/**
 * PATRÓN DE COMPORTAMIENTO: COMMAND
 * Encapsula operaciones críticas de inventario (entrada, salida, actualización)
 * como objetos ejecutables con registro estructurado para auditoría.
 */
export interface IInventoryCommand<TResult = unknown> {
  readonly id: string;
  readonly commandType: 'ADD_STOCK' | 'REMOVE_STOCK' | 'UPDATE_PRODUCT';
  readonly product: Product;
  readonly actor: string;
  execute(): TResult;
  getDescription(): string;
  getMetadata(): Record<string, unknown>;
}

export interface StockCommandResult {
  previousStock: number;
  newStock: number;
  previousStatus: StockStatus;
  newStatus: StockStatus;
  quantity: number;
}

export class AddStockCommand implements IInventoryCommand<StockCommandResult> {
  public readonly id = randomUUID();
  public readonly commandType = 'ADD_STOCK' as const;
  public readonly product: Product;
  public readonly actor: string;
  private readonly quantity: number;
  private readonly reason: string;
  private result?: StockCommandResult;

  constructor(product: Product, quantity: number, reason: string, actor: string) {
    this.product = product;
    this.quantity = quantity;
    this.reason = reason.trim() || 'Reposición de inventario';
    this.actor = actor;
  }

  public execute(): StockCommandResult {
    const previousStock = this.product.stock;
    const previousStatus = this.product.getStatus();

    this.product.addStock(this.quantity);

    this.result = {
      previousStock,
      newStock: this.product.stock,
      previousStatus,
      newStatus: this.product.getStatus(),
      quantity: this.quantity,
    };
    return this.result;
  }

  public getDescription(): string {
    return `Entrada de +${this.quantity} u. en ${this.product.code} (${this.reason})`;
  }

  public getMetadata(): Record<string, unknown> {
    return {
      quantity: this.quantity,
      reason: this.reason,
      previousStock: this.result?.previousStock,
      newStock: this.result?.newStock,
      previousStatus: this.result?.previousStatus,
      newStatus: this.result?.newStatus,
    };
  }
}

export class RemoveStockCommand implements IInventoryCommand<StockCommandResult> {
  public readonly id = randomUUID();
  public readonly commandType = 'REMOVE_STOCK' as const;
  public readonly product: Product;
  public readonly actor: string;
  private readonly quantity: number;
  private readonly reason: string;
  private result?: StockCommandResult;

  constructor(product: Product, quantity: number, reason: string, actor: string) {
    this.product = product;
    this.quantity = quantity;
    this.reason = reason.trim() || 'Venta / Salida de almacén';
    this.actor = actor;
  }

  public execute(): StockCommandResult {
    const previousStock = this.product.stock;
    const previousStatus = this.product.getStatus();

    this.product.removeStock(this.quantity);

    this.result = {
      previousStock,
      newStock: this.product.stock,
      previousStatus,
      newStatus: this.product.getStatus(),
      quantity: this.quantity,
    };
    return this.result;
  }

  public getDescription(): string {
    return `Salida de -${this.quantity} u. en ${this.product.code} (${this.reason})`;
  }

  public getMetadata(): Record<string, unknown> {
    return {
      quantity: this.quantity,
      reason: this.reason,
      previousStock: this.result?.previousStock,
      newStock: this.result?.newStock,
      previousStatus: this.result?.previousStatus,
      newStatus: this.result?.newStatus,
    };
  }
}

export interface UpdateCommandResult {
  changedFields: string[];
}

export class UpdateProductCommand implements IInventoryCommand<UpdateCommandResult> {
  public readonly id = randomUUID();
  public readonly commandType = 'UPDATE_PRODUCT' as const;
  public readonly product: Product;
  public readonly actor: string;
  private readonly updates: UpdateProductInput;
  private changedFields: string[] = [];

  constructor(product: Product, updates: UpdateProductInput, actor: string) {
    this.product = product;
    this.updates = updates;
    this.actor = actor;
  }

  public execute(): UpdateCommandResult {
    const changed: string[] = [];

    if (this.updates.name !== undefined && this.updates.name.trim().length >= 2) {
      if (this.product.name !== this.updates.name.trim()) {
        this.product.name = this.updates.name.trim();
        changed.push('name');
      }
    }
    if (this.updates.brand !== undefined && this.updates.brand.trim().length >= 2) {
      if (this.product.brand !== this.updates.brand.trim()) {
        this.product.brand = this.updates.brand.trim();
        changed.push('brand');
      }
    }
    if (this.updates.line !== undefined && this.product.line !== this.updates.line) {
      this.product.line = this.updates.line;
      changed.push('line');
    }
    if (this.updates.price !== undefined) {
      const parsedPrice = Number(this.updates.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        throw new Error('El precio debe ser mayor a 0.');
      }
      if (this.product.price !== parsedPrice) {
        this.product.price = parsedPrice;
        changed.push('price');
      }
    }
    if (this.updates.minStock !== undefined) {
      const parsedMin = Math.floor(Number(this.updates.minStock));
      if (!Number.isFinite(parsedMin) || parsedMin < 1) {
        throw new Error('El stock mínimo debe ser al menos 1.');
      }
      if (this.product.minStock !== parsedMin) {
        this.product.minStock = parsedMin;
        changed.push('minStock');
      }
    }
    if (this.updates.specifications !== undefined) {
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(this.updates.specifications)) {
        if (k.trim() && String(v).trim()) {
          cleaned[k.trim()] = String(v).trim();
        }
      }
      this.product.specifications = cleaned;
      changed.push('specifications');
    }
    if (this.updates.imageUrl !== undefined && this.updates.imageUrl.trim()) {
      const safeUrl = Product.sanitizeImageUrl(this.updates.imageUrl);
      if (this.product.imageUrl !== safeUrl) {
        this.product.imageUrl = safeUrl;
        changed.push('imageUrl');
      }
    }
    if (this.updates.supplier !== undefined && this.updates.supplier.trim()) {
      if (this.product.supplier !== this.updates.supplier.trim()) {
        this.product.supplier = this.updates.supplier.trim();
        changed.push('supplier');
      }
    }

    this.product.updatedAt = new Date().toISOString();
    this.product.syncState();
    this.product.refreshLineArtifacts();
    this.changedFields = changed;

    return { changedFields: changed };
  }

  public getDescription(): string {
    const fields = this.changedFields.length > 0 ? this.changedFields.join(', ') : 'sin cambios';
    return `Actualización de ${this.product.code} (campos: ${fields})`;
  }

  public getMetadata(): Record<string, unknown> {
    return {
      changedFields: this.changedFields,
      newPrice: this.product.price,
      newMinStock: this.product.minStock,
      newLine: this.product.line,
    };
  }
}

/**
 * Invoker del patrón Command: ejecuta los comandos y mantiene el historial
 * persistente de operaciones en InventoryStore.
 */
export class CommandInvoker {
  public executeCommand<TResult>(command: IInventoryCommand<TResult>): TResult {
    const result = command.execute();

    const record: CommandRecord = {
      id: command.id,
      commandType: command.commandType,
      productId: command.product.id,
      productCode: command.product.code,
      productName: command.product.name,
      actor: command.actor,
      description: command.getDescription(),
      executedAt: new Date().toISOString(),
      metadata: command.getMetadata(),
    };

    InventoryStore.getInstance().addCommandRecord(record);
    return result;
  }
}
