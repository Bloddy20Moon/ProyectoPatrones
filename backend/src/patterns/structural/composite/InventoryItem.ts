import { Product } from '../../../models/Product';
import { KitComponentDTO, KitDTO, ProductLine } from '../../../models/types';
import { ProductDecoratorChain } from '../decorator/ProductDecorator';

/**
 * PATRÓN ESTRUCTURAL: COMPOSITE
 * Define una abstracción uniforme (InventoryItem) para tratar tanto productos
 * individuales (SingleProduct) como combos/kits (ProductKit) de forma homogénea
 * al calcular precio, stock disponible y disponibilidad comercial.
 */
export abstract class InventoryItem {
  public abstract getId(): string;
  public abstract getCode(): string;
  public abstract getName(): string;
  public abstract getType(): 'SINGLE' | 'KIT';
  public abstract getBasePrice(): number;
  public abstract getPrice(): number;
  public abstract getAvailableStock(): number;
  public abstract getTotalUnits(): number;

  public isAvailable(): boolean {
    return this.getAvailableStock() > 0;
  }
}

/**
 * Hoja (Leaf) del patrón Composite: representa un producto individual.
 */
export class SingleProduct extends InventoryItem {
  private readonly product: Product;

  constructor(product: Product) {
    super();
    this.product = product;
  }

  public getProduct(): Product {
    return this.product;
  }

  public getId(): string {
    return this.product.id;
  }

  public getCode(): string {
    return this.product.code;
  }

  public getName(): string {
    return this.product.name;
  }

  public getType(): 'SINGLE' {
    return 'SINGLE';
  }

  public getBasePrice(): number {
    return Number(this.product.price.toFixed(2));
  }

  public getPrice(): number {
    return ProductDecoratorChain.apply(this.product).getPrice();
  }

  public getAvailableStock(): number {
    if (!this.product.getState().canBeSold()) {
      return 0;
    }
    return this.product.stock;
  }

  public getTotalUnits(): number {
    return 1;
  }
}

export interface KitChildEntry {
  item: InventoryItem;
  quantity: number;
}

export interface ProductKitProps {
  id: string;
  code: string;
  name: string;
  description: string;
  line: ProductLine;
  discountPercent: number;
  imageUrl?: string;
  createdAt?: string;
}

/**
 * Compuesto (Composite): agrupa múltiples InventoryItem (productos individuales
 * o incluso sub-kits) calculando dinámicamente el precio con descuento y el stock
 * máximo armable en tiempo real según sus componentes.
 */
export class ProductKit extends InventoryItem {
  private readonly id: string;
  private readonly code: string;
  private readonly name: string;
  public readonly description: string;
  public readonly line: ProductLine;
  public readonly discountPercent: number;
  public readonly imageUrl: string;
  public readonly createdAt: string;
  private readonly children: KitChildEntry[] = [];

  constructor(props: ProductKitProps) {
    super();
    this.id = props.id;
    this.code = props.code.trim().toUpperCase();
    this.name = props.name.trim();
    this.description = props.description.trim();
    this.line = props.line;
    this.discountPercent = Math.min(60, Math.max(0, Number(props.discountPercent) || 0));
    this.imageUrl = props.imageUrl?.trim() || '/images/combo-gamer.svg';
    this.createdAt = props.createdAt ?? new Date().toISOString();
  }

  public add(item: InventoryItem, quantity = 1): void {
    const qty = Math.max(1, Math.floor(quantity));
    const existing = this.children.find((entry) => entry.item.getId() === item.getId());
    if (existing) {
      existing.quantity += qty;
    } else {
      this.children.push({ item, quantity: qty });
    }
  }

  public remove(itemId: string): void {
    const index = this.children.findIndex((entry) => entry.item.getId() === itemId);
    if (index !== -1) {
      this.children.splice(index, 1);
    }
  }

  public getChildren(): ReadonlyArray<KitChildEntry> {
    return this.children;
  }

  public getId(): string {
    return this.id;
  }

  public getCode(): string {
    return this.code;
  }

  public getName(): string {
    return this.name;
  }

  public getType(): 'KIT' {
    return 'KIT';
  }

  public getBasePrice(): number {
    const sum = this.children.reduce(
      (acc, entry) => acc + entry.item.getPrice() * entry.quantity,
      0
    );
    return Number(sum.toFixed(2));
  }

  public getPrice(): number {
    const regular = this.getBasePrice();
    const discounted = regular * (1 - this.discountPercent / 100);
    return Number(discounted.toFixed(2));
  }

  public getSavings(): number {
    return Number((this.getBasePrice() - this.getPrice()).toFixed(2));
  }

  public getAvailableStock(): number {
    if (this.children.length === 0) {
      return 0;
    }
    const limits = this.children.map((entry) =>
      Math.floor(entry.item.getAvailableStock() / entry.quantity)
    );
    return Math.max(0, Math.min(...limits));
  }

  public getTotalUnits(): number {
    return this.children.reduce(
      (acc, entry) => acc + entry.item.getTotalUnits() * entry.quantity,
      0
    );
  }

  public toDTO(): KitDTO {
    const items: KitComponentDTO[] = this.children.map((entry) => {
      const unitPrice = entry.item.getPrice();
      const single = entry.item instanceof SingleProduct ? entry.item.getProduct() : null;
      return {
        productId: entry.item.getId(),
        code: entry.item.getCode(),
        name: entry.item.getName(),
        category: single ? single.category : 'ACCESSORY',
        imageUrl: single ? single.imageUrl : '/images/combo-gamer.svg',
        quantity: entry.quantity,
        unitPrice,
        subtotal: Number((unitPrice * entry.quantity).toFixed(2)),
        productStock: entry.item.getAvailableStock(),
      };
    });

    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      line: this.line,
      type: 'KIT',
      discountPercent: this.discountPercent,
      regularPrice: this.getBasePrice(),
      finalPrice: this.getPrice(),
      savings: this.getSavings(),
      availableStock: this.getAvailableStock(),
      isAvailable: this.isAvailable(),
      totalUnitsPerKit: this.getTotalUnits(),
      imageUrl: this.imageUrl,
      items,
      createdAt: this.createdAt,
    };
  }
}
