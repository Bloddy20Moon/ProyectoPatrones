import { Product, SerializedProductRecord } from '../../../models/Product';
import {
  CreateProductInput,
  ExtraServiceType,
  ProductCategory,
  ProductLine,
  ProductSpecs,
} from '../../../models/types';
import { ProductFactoryProvider } from '../factory-method/ProductFactory';
import { DatabaseConfig } from '../singleton/DatabaseConfig';

/**
 * PATRÓN CREACIONAL: BUILDER
 * Construye paso a paso un producto tecnológico complejo: código, datos básicos,
 * categoría, línea comercial, precio, stock, especificaciones técnicas, foto,
 * proveedor y servicios extra.
 */
export class ProductBuilder {
  private id?: string;
  private code?: string;
  private name = '';
  private brand = '';
  private category: ProductCategory = 'LAPTOP';
  private line: ProductLine = 'GAMER';
  private price = 0;
  private stock = 0;
  private minStock?: number;
  private specifications: ProductSpecs = {};
  private imageUrl = '';
  private supplier = 'TechStock Distribuidora';
  private services: ExtraServiceType[] = [];
  private isDiscontinued = false;
  private createdAt?: string;
  private updatedAt?: string;

  public setId(id: string): this {
    this.id = id;
    return this;
  }

  public setCode(code?: string): this {
    this.code = code?.trim() ? code.trim().toUpperCase() : undefined;
    return this;
  }

  public setBasicInfo(name: string, brand: string): this {
    this.name = name;
    this.brand = brand;
    return this;
  }

  public setCategory(category: ProductCategory): this {
    this.category = category;
    return this;
  }

  public setLine(line: ProductLine): this {
    this.line = line;
    return this;
  }

  public setPricing(price: number): this {
    this.price = Number(price);
    return this;
  }

  public setStock(stock: number, minStock?: number): this {
    this.stock = Number(stock);
    this.minStock = minStock !== undefined ? Number(minStock) : undefined;
    return this;
  }

  public setSpecifications(specs?: ProductSpecs): this {
    if (specs) {
      const cleaned: ProductSpecs = {};
      for (const [key, value] of Object.entries(specs)) {
        const cleanKey = key.trim();
        const cleanVal = String(value ?? '').trim();
        if (cleanKey && cleanVal) {
          cleaned[cleanKey] = cleanVal;
        }
      }
      this.specifications = cleaned;
    }
    return this;
  }

  public addSpecification(key: string, value: string): this {
    if (key.trim() && value.trim()) {
      this.specifications[key.trim()] = value.trim();
    }
    return this;
  }

  public setPhoto(imageUrl?: string): this {
    this.imageUrl = imageUrl?.trim() ?? '';
    return this;
  }

  public setSupplier(supplier?: string): this {
    if (supplier && supplier.trim()) {
      this.supplier = supplier.trim();
    }
    return this;
  }

  public setServices(services?: ExtraServiceType[]): this {
    this.services = Array.from(new Set(services ?? []));
    return this;
  }

  public setDiscontinued(isDiscontinued: boolean): this {
    this.isDiscontinued = isDiscontinued;
    return this;
  }

  public setTimestamps(createdAt?: string, updatedAt?: string): this {
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    return this;
  }

  public build(existingCodes: string[] = []): Product {
    const config = DatabaseConfig.getInstance();
    const factory = ProductFactoryProvider.getFactory(this.category);
    const resolvedCode = factory.normalizeAndValidateCode(this.code, existingCodes);
    const resolvedMinStock = this.minStock ?? config.getDefaultMinStock();

    return factory.createProduct({
      id: this.id,
      code: resolvedCode,
      name: this.name,
      brand: this.brand,
      line: this.line,
      price: this.price,
      stock: this.stock,
      minStock: resolvedMinStock,
      specifications: this.specifications,
      imageUrl: this.imageUrl,
      supplier: this.supplier,
      services: this.services,
      isDiscontinued: this.isDiscontinued,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }
}

export class ProductDirector {
  public static buildFromInput(input: CreateProductInput, existingCodes: string[]): Product {
    return new ProductBuilder()
      .setCode(input.code)
      .setBasicInfo(input.name, input.brand)
      .setCategory(input.category)
      .setLine(input.line)
      .setPricing(input.price)
      .setStock(input.stock, input.minStock)
      .setSpecifications(input.specifications)
      .setPhoto(input.imageUrl)
      .setSupplier(input.supplier)
      .setServices(input.services)
      .build(existingCodes);
  }

  public static buildFromRecord(record: SerializedProductRecord): Product {
    return new ProductBuilder()
      .setId(record.id)
      .setCode(record.code)
      .setBasicInfo(record.name, record.brand)
      .setCategory(record.category)
      .setLine(record.line)
      .setPricing(record.price)
      .setStock(record.stock, record.minStock)
      .setSpecifications(record.specifications)
      .setPhoto(record.imageUrl)
      .setSupplier(record.supplier)
      .setServices(record.services)
      .setDiscontinued(record.isDiscontinued)
      .setTimestamps(record.createdAt, record.updatedAt)
      .build([]);
  }
}
