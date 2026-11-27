import { randomUUID } from 'crypto';
import {
  CloneProductInput,
  ExtraServiceType,
  IProductCodeLabel,
  ITechSpecSheet,
  ProductCategory,
  ProductLine,
  ProductSnapshot,
  ProductSpecs,
  StockStatus,
} from './types';
import { IStockState, StockStateResolver } from '../patterns/behavioral/state/StockState';
import { IPrototype } from '../patterns/creational/prototype/IPrototype';
import { ProductMemento } from '../patterns/behavioral/memento/ProductMemento';
import { ProductLineFactoryProvider } from '../patterns/creational/abstract-factory/ProductLineFactory';

export interface ProductInitProps {
  id?: string;
  code: string;
  name: string;
  brand: string;
  category: ProductCategory;
  line: ProductLine;
  price: number;
  stock: number;
  minStock: number;
  specifications: ProductSpecs;
  imageUrl: string;
  supplier: string;
  services?: ExtraServiceType[];
  isDiscontinued?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SerializedProductRecord {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: ProductCategory;
  line: ProductLine;
  price: number;
  stock: number;
  minStock: number;
  specifications: ProductSpecs;
  imageUrl: string;
  supplier: string;
  services: ExtraServiceType[];
  isDiscontinued: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entidad base Orientada a Objetos del dominio TechStock.
 * Integra:
 *  - Prototype (clone)
 *  - State (IStockState y transiciones automáticas)
 *  - Memento (createMemento / restoreFromMemento)
 *  - Abstract Factory (specSheet + codeLabel por línea Gamer/Oficina)
 */
export abstract class Product implements IPrototype<Product> {
  public readonly id: string;
  public code: string;
  public name: string;
  public brand: string;
  public readonly category: ProductCategory;
  public line: ProductLine;
  public price: number;
  public stock: number;
  public minStock: number;
  public specifications: ProductSpecs;
  public imageUrl: string;
  public supplier: string;
  public services: ExtraServiceType[];
  public isDiscontinued: boolean;
  public readonly createdAt: string;
  public updatedAt: string;

  protected state: IStockState;
  public specSheet!: ITechSpecSheet;
  public codeLabel!: IProductCodeLabel;

  constructor(props: ProductInitProps) {
    this.id = props.id ?? randomUUID();
    this.code = props.code.trim().toUpperCase();
    this.name = props.name.trim();
    this.brand = props.brand.trim();
    this.category = props.category;
    this.line = props.line;
    this.price = Number(props.price);
    this.stock = Math.max(0, Math.floor(props.stock));
    this.minStock = Math.max(1, Math.floor(props.minStock));
    this.specifications = { ...props.specifications };
    this.imageUrl = Product.sanitizeImageUrl(props.imageUrl);
    this.supplier = props.supplier.trim() || 'TechStock Direct';
    this.services = Array.from(new Set(props.services ?? []));
    this.isDiscontinued = Boolean(props.isDiscontinued);
    const now = new Date().toISOString();
    this.createdAt = props.createdAt ?? now;
    this.updatedAt = props.updatedAt ?? now;

    this.state = StockStateResolver.resolve(this);
    this.refreshLineArtifacts();
  }

  public static sanitizeImageUrl(url?: string): string {
    const trimmed = (url ?? '').trim();
    if (!trimmed) {
      return '/images/laptop-gamer.svg';
    }
    if (trimmed.startsWith('/images/') || trimmed.startsWith('/uploads/')) {
      return trimmed.includes('..') ? '/images/laptop-gamer.svg' : trimmed;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.toString();
      }
    } catch {
      // URL inválida
    }
    throw new Error('URL de imagen inválida. Solo se permiten rutas /images, /uploads o URLs http/https.');
  }

  public abstract getCategoryLabel(): string;
  public abstract getDefaultSpecKeys(): string[];
  public abstract clone(overrides?: CloneProductInput): Product;

  public getState(): IStockState {
    return this.state;
  }

  public getStatus(): StockStatus {
    return this.state.status;
  }

  public syncState(): IStockState {
    this.state = this.state.evaluateTransition(this);
    return this.state;
  }

  public refreshLineArtifacts(): void {
    const lineFactory = ProductLineFactoryProvider.getFactory(this.line);
    this.specSheet = lineFactory.createTechSpecSheet(this.name, this.category, this.specifications);
    this.codeLabel = lineFactory.createCodeLabel(this.code, this.name, this.category);
  }

  public addStock(quantity: number): void {
    const check = this.state.canAddStock();
    if (!check.allowed) {
      throw new Error(check.reason ?? 'No se puede agregar stock en el estado actual.');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('La cantidad de entrada debe ser un entero positivo.');
    }
    this.stock += quantity;
    this.updatedAt = new Date().toISOString();
    this.syncState();
  }

  public removeStock(quantity: number): void {
    const check = this.state.canRemoveStock(this.stock, quantity);
    if (!check.allowed) {
      throw new Error(check.reason ?? 'No se puede retirar stock en el estado actual.');
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('La cantidad de salida debe ser un entero positivo.');
    }
    this.stock -= quantity;
    this.updatedAt = new Date().toISOString();
    this.syncState();
  }

  public setDiscontinued(discontinued: boolean): void {
    this.isDiscontinued = discontinued;
    this.updatedAt = new Date().toISOString();
    this.syncState();
  }

  public addService(service: ExtraServiceType): void {
    if (!this.services.includes(service)) {
      this.services.push(service);
      this.updatedAt = new Date().toISOString();
    }
  }

  public removeService(service: ExtraServiceType): void {
    this.services = this.services.filter((s) => s !== service);
    this.updatedAt = new Date().toISOString();
  }

  public createMemento(reason = 'Edición de producto'): ProductMemento {
    const snapshot: ProductSnapshot = {
      code: this.code,
      name: this.name,
      brand: this.brand,
      category: this.category,
      line: this.line,
      price: this.price,
      stock: this.stock,
      minStock: this.minStock,
      specifications: { ...this.specifications },
      imageUrl: this.imageUrl,
      supplier: this.supplier,
      services: [...this.services],
      isDiscontinued: this.isDiscontinued,
    };
    return new ProductMemento(this.id, snapshot, reason);
  }

  public restoreFromMemento(memento: ProductMemento): void {
    const snap = memento.getSnapshot();
    this.code = snap.code;
    this.name = snap.name;
    this.brand = snap.brand;
    this.line = snap.line;
    this.price = snap.price;
    this.stock = snap.stock;
    this.minStock = snap.minStock;
    this.specifications = { ...snap.specifications };
    this.imageUrl = snap.imageUrl;
    this.supplier = snap.supplier;
    this.services = [...snap.services];
    this.isDiscontinued = snap.isDiscontinued;
    this.updatedAt = new Date().toISOString();
    this.syncState();
    this.refreshLineArtifacts();
  }

  protected buildClonedProps(overrides?: CloneProductInput): ProductInitProps {
    return {
      code: overrides?.code?.trim().toUpperCase() ?? `${this.code}-VAR`,
      name: overrides?.name?.trim() ?? `${this.name} (Variante)`,
      brand: this.brand,
      category: this.category,
      line: overrides?.line ?? this.line,
      price: overrides?.price !== undefined ? Number(overrides.price) : this.price,
      stock: overrides?.stock !== undefined ? Math.max(0, Math.floor(overrides.stock)) : this.stock,
      minStock: this.minStock,
      specifications: { ...this.specifications },
      imageUrl: this.imageUrl,
      supplier: this.supplier,
      services: [...this.services],
      isDiscontinued: false,
    };
  }

  public toSerializedRecord(): SerializedProductRecord {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      brand: this.brand,
      category: this.category,
      line: this.line,
      price: this.price,
      stock: this.stock,
      minStock: this.minStock,
      specifications: { ...this.specifications },
      imageUrl: this.imageUrl,
      supplier: this.supplier,
      services: [...this.services],
      isDiscontinued: this.isDiscontinued,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class Laptop extends Product {
  constructor(props: Omit<ProductInitProps, 'category'>) {
    super({ ...props, category: 'LAPTOP' });
  }

  public getCategoryLabel(): string {
    return 'Laptop';
  }

  public getDefaultSpecKeys(): string[] {
    return ['Procesador', 'RAM', 'Almacenamiento', 'Pantalla', 'GPU'];
  }

  public clone(overrides?: CloneProductInput): Laptop {
    return new Laptop(this.buildClonedProps(overrides));
  }
}

export class Peripheral extends Product {
  constructor(props: Omit<ProductInitProps, 'category'>) {
    super({ ...props, category: 'PERIPHERAL' });
  }

  public getCategoryLabel(): string {
    return 'Periférico';
  }

  public getDefaultSpecKeys(): string[] {
    return ['Conectividad', 'Interfaz', 'Sensor / Panel', 'Peso / Formato'];
  }

  public clone(overrides?: CloneProductInput): Peripheral {
    return new Peripheral(this.buildClonedProps(overrides));
  }
}

export class Component extends Product {
  constructor(props: Omit<ProductInitProps, 'category'>) {
    super({ ...props, category: 'COMPONENT' });
  }

  public getCategoryLabel(): string {
    return 'Componente';
  }

  public getDefaultSpecKeys(): string[] {
    return ['Interfaz', 'Capacidad / Memoria', 'Velocidad', 'Consumo / TDP'];
  }

  public clone(overrides?: CloneProductInput): Component {
    return new Component(this.buildClonedProps(overrides));
  }
}

export class Accessory extends Product {
  constructor(props: Omit<ProductInitProps, 'category'>) {
    super({ ...props, category: 'ACCESSORY' });
  }

  public getCategoryLabel(): string {
    return 'Accesorio';
  }

  public getDefaultSpecKeys(): string[] {
    return ['Compatibilidad', 'Conectividad', 'Autonomía / Material'];
  }

  public clone(overrides?: CloneProductInput): Accessory {
    return new Accessory(this.buildClonedProps(overrides));
  }
}
