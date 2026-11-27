import {
  Accessory,
  Component,
  Laptop,
  Peripheral,
  Product,
  ProductInitProps,
} from '../../../models/Product';
import { ProductCategory } from '../../../models/types';

export type ProductFactoryParams = Omit<ProductInitProps, 'category'>;

/**
 * PATRÓN CREACIONAL: FACTORY METHOD
 * Define el método fábrica abstracto createProduct() junto con reglas
 * de validación y generación automática de prefijos por categoría tecnológica.
 */
export abstract class ProductFactory {
  public abstract readonly category: ProductCategory;
  public abstract getCodePrefix(): string;
  public abstract getDefaultImageUrl(): string;
  protected abstract validateCategoryRules(params: ProductFactoryParams): void;
  protected abstract instantiateProduct(params: ProductFactoryParams): Product;

  public generateNextCode(existingCodes: string[]): string {
    const prefix = this.getCodePrefix();
    const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
    let maxNumber = 0;

    for (const code of existingCodes) {
      const match = code.trim().match(regex);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (parsed > maxNumber) {
          maxNumber = parsed;
        }
      }
    }

    const nextNumber = String(maxNumber + 1).padStart(3, '0');
    return `${prefix}-${nextNumber}`;
  }

  public normalizeAndValidateCode(code: string | undefined, existingCodes: string[]): string {
    const prefix = this.getCodePrefix();
    if (!code || code.trim().length === 0) {
      return this.generateNextCode(existingCodes);
    }
    const normalized = code.trim().toUpperCase();
    if (!normalized.startsWith(`${prefix}-`)) {
      throw new Error(
        `[ProductFactory:${this.category}] El código "${normalized}" debe iniciar con el prefijo "${prefix}-" (ej. ${prefix}-001).`
      );
    }
    if (!/^[A-Z]{3}-[A-Z0-9-]{2,15}$/.test(normalized)) {
      throw new Error(
        `[ProductFactory:${this.category}] Formato de código inválido "${normalized}". Usa el formato ${prefix}-001.`
      );
    }
    return normalized;
  }

  public createProduct(params: ProductFactoryParams): Product {
    this.validateBaseRules(params);
    this.validateCategoryRules(params);
    return this.instantiateProduct({
      ...params,
      imageUrl: params.imageUrl?.trim() || this.getDefaultImageUrl(),
    });
  }

  private validateBaseRules(params: ProductFactoryParams): void {
    if (!params.name || params.name.trim().length < 2) {
      throw new Error('El nombre del producto debe tener al menos 2 caracteres.');
    }
    if (!params.brand || params.brand.trim().length < 2) {
      throw new Error('La marca del producto es obligatoria.');
    }
    if (!Number.isFinite(params.price) || params.price <= 0) {
      throw new Error('El precio debe ser un número mayor a 0.');
    }
    if (!Number.isFinite(params.stock) || params.stock < 0) {
      throw new Error('El stock inicial no puede ser negativo.');
    }
    if (!Number.isFinite(params.minStock) || params.minStock < 1) {
      throw new Error('El stock mínimo debe ser al menos 1.');
    }
  }
}

export class LaptopFactory extends ProductFactory {
  public readonly category: ProductCategory = 'LAPTOP';

  public getCodePrefix(): string {
    return 'LAP';
  }

  public getDefaultImageUrl(): string {
    return '/images/laptop-gamer.svg';
  }

  protected validateCategoryRules(params: ProductFactoryParams): void {
    if (params.price < 150) {
      throw new Error('[LaptopFactory] El precio mínimo válido para una Laptop es $150.');
    }
  }

  protected instantiateProduct(params: ProductFactoryParams): Laptop {
    return new Laptop(params);
  }
}

export class PeripheralFactory extends ProductFactory {
  public readonly category: ProductCategory = 'PERIPHERAL';

  public getCodePrefix(): string {
    return 'PER';
  }

  public getDefaultImageUrl(): string {
    return '/images/mouse-gamer.svg';
  }

  protected validateCategoryRules(params: ProductFactoryParams): void {
    if (params.price < 5) {
      throw new Error('[PeripheralFactory] El precio mínimo válido para un Periférico es $5.');
    }
  }

  protected instantiateProduct(params: ProductFactoryParams): Peripheral {
    return new Peripheral(params);
  }
}

export class ComponentFactory extends ProductFactory {
  public readonly category: ProductCategory = 'COMPONENT';

  public getCodePrefix(): string {
    return 'CMP';
  }

  public getDefaultImageUrl(): string {
    return '/images/gpu-gamer.svg';
  }

  protected validateCategoryRules(params: ProductFactoryParams): void {
    if (params.price < 10) {
      throw new Error('[ComponentFactory] El precio mínimo válido para un Componente es $10.');
    }
  }

  protected instantiateProduct(params: ProductFactoryParams): Component {
    return new Component(params);
  }
}

export class AccessoryFactory extends ProductFactory {
  public readonly category: ProductCategory = 'ACCESSORY';

  public getCodePrefix(): string {
    return 'ACC';
  }

  public getDefaultImageUrl(): string {
    return '/images/headset-gamer.svg';
  }

  protected validateCategoryRules(params: ProductFactoryParams): void {
    if (params.price < 3) {
      throw new Error('[AccessoryFactory] El precio mínimo válido para un Accesorio es $3.');
    }
  }

  protected instantiateProduct(params: ProductFactoryParams): Accessory {
    return new Accessory(params);
  }
}

export class ProductFactoryProvider {
  private static readonly registry: Record<ProductCategory, ProductFactory> = {
    LAPTOP: new LaptopFactory(),
    PERIPHERAL: new PeripheralFactory(),
    COMPONENT: new ComponentFactory(),
    ACCESSORY: new AccessoryFactory(),
  };

  public static getFactory(category: ProductCategory): ProductFactory {
    const factory = this.registry[category];
    if (!factory) {
      throw new Error(`Categoría de producto no soportada: ${category}`);
    }
    return factory;
  }

  public static getPrefixForCategory(category: ProductCategory): string {
    return this.getFactory(category).getCodePrefix();
  }
}
