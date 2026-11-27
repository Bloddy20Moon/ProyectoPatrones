import { randomUUID } from 'crypto';
import { ProductSnapshot } from '../../../models/types';

/**
 * PATRÓN DE COMPORTAMIENTO: MEMENTO
 * Encapsula una instantánea inmutable del estado de un producto antes de ser editado.
 */
export class ProductMemento {
  public readonly id: string;
  public readonly productId: string;
  public readonly savedAt: string;
  public readonly reason: string;
  private readonly snapshot: ProductSnapshot;

  constructor(productId: string, snapshot: ProductSnapshot, reason: string) {
    this.id = randomUUID();
    this.productId = productId;
    this.savedAt = new Date().toISOString();
    this.reason = reason;
    this.snapshot = ProductMemento.deepCopy(snapshot);
  }

  public getSnapshot(): ProductSnapshot {
    return ProductMemento.deepCopy(this.snapshot);
  }

  public toMetadata(): { id: string; productId: string; savedAt: string; reason: string; name: string; price: number } {
    return {
      id: this.id,
      productId: this.productId,
      savedAt: this.savedAt,
      reason: this.reason,
      name: this.snapshot.name,
      price: this.snapshot.price,
    };
  }

  private static deepCopy(snapshot: ProductSnapshot): ProductSnapshot {
    return {
      ...snapshot,
      specifications: { ...snapshot.specifications },
      services: [...snapshot.services],
    };
  }
}

/**
 * Caretaker del patrón Memento: administra la pila de instantáneas por producto
 * para permitir la operación Deshacer (Undo) desde el Frontend.
 */
export class ProductHistory {
  private readonly stacks = new Map<string, ProductMemento[]>();
  private readonly maxPerProduct: number;

  constructor(maxPerProduct = 15) {
    this.maxPerProduct = maxPerProduct;
  }

  public push(memento: ProductMemento): void {
    const list = this.stacks.get(memento.productId) ?? [];
    list.push(memento);
    if (list.length > this.maxPerProduct) {
      list.shift();
    }
    this.stacks.set(memento.productId, list);
  }

  public pop(productId: string): ProductMemento | undefined {
    const list = this.stacks.get(productId);
    if (!list || list.length === 0) {
      return undefined;
    }
    const popped = list.pop();
    if (list.length === 0) {
      this.stacks.delete(productId);
    }
    return popped;
  }

  public peek(productId: string): ProductMemento | undefined {
    const list = this.stacks.get(productId);
    if (!list || list.length === 0) {
      return undefined;
    }
    return list[list.length - 1];
  }

  public getCount(productId: string): number {
    return this.stacks.get(productId)?.length ?? 0;
  }

  public getHistory(productId: string): ReturnType<ProductMemento['toMetadata']>[] {
    return (this.stacks.get(productId) ?? []).map((m) => m.toMetadata()).reverse();
  }

  public getTotalSnapshots(): number {
    let total = 0;
    for (const stack of this.stacks.values()) {
      total += stack.length;
    }
    return total;
  }

  public clearForProduct(productId: string): void {
    this.stacks.delete(productId);
  }

  public clearAll(): void {
    this.stacks.clear();
  }
}
