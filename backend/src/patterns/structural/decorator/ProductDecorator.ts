import { Product } from '../../../models/Product';
import { ExtraServiceType, ServicePriceBreakdown } from '../../../models/types';

export interface ExtraServiceCatalogItem {
  type: ExtraServiceType;
  name: string;
  description: string;
  pricingRule: string;
}

export const EXTRA_SERVICE_CATALOG: ExtraServiceCatalogItem[] = [
  {
    type: 'EXTENDED_WARRANTY',
    name: 'Garantía Extendida (24 meses)',
    description: 'Cobertura ampliada contra fallas de hardware y reemplazo prioritario por 2 años.',
    pricingRule: '+12% del precio base (mín. $29.99)',
  },
  {
    type: 'SOFTWARE_SETUP',
    name: 'Instalación y Configuración de Software',
    description: 'Instalación de SO, drivers optimizados, suite de oficina y diagnóstico inicial.',
    pricingRule: '+$35.00 tarifa plana',
  },
  {
    type: 'PRIORITY_SUPPORT',
    name: 'Soporte Técnico VIP 24/7',
    description: 'Asistencia remota prioritaria y mantenimiento preventivo semestral.',
    pricingRule: '+$24.99 tarifa plana',
  },
];

/**
 * PATRÓN ESTRUCTURAL: DECORATOR
 * Interfaz componente que permite añadir dinámicamente servicios extra y costos
 * adicionales sobre el precio base de cualquier producto sin modificar su clase.
 */
export interface IProductPricingComponent {
  getBasePrice(): number;
  getPrice(): number;
  getDescription(): string;
  getServicesBreakdown(): ServicePriceBreakdown[];
}

export class BaseProductPricing implements IProductPricingComponent {
  private readonly product: Product;

  constructor(product: Product) {
    this.product = product;
  }

  public getBasePrice(): number {
    return Number(this.product.price.toFixed(2));
  }

  public getPrice(): number {
    return Number(this.product.price.toFixed(2));
  }

  public getDescription(): string {
    return `${this.product.name} (${this.product.code})`;
  }

  public getServicesBreakdown(): ServicePriceBreakdown[] {
    return [];
  }
}

export abstract class ProductDecorator implements IProductPricingComponent {
  protected readonly wrapped: IProductPricingComponent;

  constructor(wrapped: IProductPricingComponent) {
    this.wrapped = wrapped;
  }

  public getBasePrice(): number {
    return this.wrapped.getBasePrice();
  }

  public abstract getPrice(): number;
  public abstract getDescription(): string;
  public abstract getServicesBreakdown(): ServicePriceBreakdown[];
}

export class ExtendedWarrantyDecorator extends ProductDecorator {
  private computeCost(): number {
    const percentage = this.getBasePrice() * 0.12;
    return Number(Math.max(29.99, percentage).toFixed(2));
  }

  public getPrice(): number {
    return Number((this.wrapped.getPrice() + this.computeCost()).toFixed(2));
  }

  public getDescription(): string {
    return `${this.wrapped.getDescription()} + Garantía Extendida 24m`;
  }

  public getServicesBreakdown(): ServicePriceBreakdown[] {
    return [
      ...this.wrapped.getServicesBreakdown(),
      {
        type: 'EXTENDED_WARRANTY',
        name: 'Garantía Extendida (24 meses)',
        description: 'Cobertura ampliada 12% (mín. $29.99)',
        cost: this.computeCost(),
      },
    ];
  }
}

export class SoftwareSetupDecorator extends ProductDecorator {
  private readonly flatFee = 35.0;

  public getPrice(): number {
    return Number((this.wrapped.getPrice() + this.flatFee).toFixed(2));
  }

  public getDescription(): string {
    return `${this.wrapped.getDescription()} + Instalación de Software`;
  }

  public getServicesBreakdown(): ServicePriceBreakdown[] {
    return [
      ...this.wrapped.getServicesBreakdown(),
      {
        type: 'SOFTWARE_SETUP',
        name: 'Instalación y Configuración de Software',
        description: 'Drivers, SO optimizado y puesta a punto',
        cost: this.flatFee,
      },
    ];
  }
}

export class PrioritySupportDecorator extends ProductDecorator {
  private readonly flatFee = 24.99;

  public getPrice(): number {
    return Number((this.wrapped.getPrice() + this.flatFee).toFixed(2));
  }

  public getDescription(): string {
    return `${this.wrapped.getDescription()} + Soporte Técnico VIP`;
  }

  public getServicesBreakdown(): ServicePriceBreakdown[] {
    return [
      ...this.wrapped.getServicesBreakdown(),
      {
        type: 'PRIORITY_SUPPORT',
        name: 'Soporte Técnico VIP 24/7',
        description: 'Asistencia prioritaria y mantenimiento preventivo',
        cost: this.flatFee,
      },
    ];
  }
}

export class ProductDecoratorChain {
  public static apply(product: Product): IProductPricingComponent {
    let component: IProductPricingComponent = new BaseProductPricing(product);

    for (const service of product.services) {
      switch (service) {
        case 'EXTENDED_WARRANTY':
          component = new ExtendedWarrantyDecorator(component);
          break;
        case 'SOFTWARE_SETUP':
          component = new SoftwareSetupDecorator(component);
          break;
        case 'PRIORITY_SUPPORT':
          component = new PrioritySupportDecorator(component);
          break;
      }
    }

    return component;
  }
}
