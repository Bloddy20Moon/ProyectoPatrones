import {
  IProductCodeLabel,
  ITechSpecSheet,
  ProductCategory,
  ProductCodeLabelDTO,
  ProductLine,
  ProductSpecs,
  TechSpecSheetDTO,
} from '../../../models/types';

/**
 * PRODUCTOS CONCRETOS — FAMILIA GAMER
 */
export class GamerSpecSheet implements ITechSpecSheet {
  public readonly line: ProductLine = 'GAMER';
  public readonly tierTitle = 'Serie Gamer Pro Performance';
  public readonly badgeLabel = 'GAMER EDITION';
  public readonly accentColor = 'violet';
  public readonly warrantyTier = 'Cobertura Gaming Performance 12m + Diagnóstico Térmico';
  public readonly recommendedUse = 'Esports, Gaming AAA, Streaming y Renderizado 3D';
  public readonly highlights: string[];
  private readonly summary: string;

  constructor(productName: string, category: ProductCategory, specs: ProductSpecs) {
    this.highlights = this.buildHighlights(category, specs);
    this.summary = this.formatSummary(specs, productName);
  }

  private buildHighlights(category: ProductCategory, specs: ProductSpecs): string[] {
    const baseHighlights: Record<ProductCategory, string[]> = {
      LAPTOP: ['Refrigeración de alto flujo', 'Alta tasa de refresco', 'Perfil Overclock / Turbo'],
      PERIPHERAL: ['Baja latencia competitiva', 'Iluminación RGB personalizable', 'Polling rate optimizado'],
      COMPONENT: ['Arquitectura de alto rendimiento', 'Estabilidad bajo carga intensa', 'Preparado para Ray Tracing'],
      ACCESSORY: ['Ergonomía para sesiones largas', 'Audio espacial / precisión', 'Acabado esports'],
    };
    const specEntries = Object.entries(specs)
      .slice(0, 2)
      .map(([k, v]) => `${k}: ${v}`);
    return [...specEntries, ...baseHighlights[category].slice(0, 2)];
  }

  public formatSummary(specs: ProductSpecs, productName?: string): string {
    const pairs = Object.entries(specs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' • ');
    const prefix = productName ? `[GAMER] ${productName}` : '[GAMER]';
    return pairs ? `${prefix} — ${pairs}` : `${prefix} — Configuración de alto rendimiento`;
  }

  public toJSON(): TechSpecSheetDTO {
    return {
      line: this.line,
      tierTitle: this.tierTitle,
      badgeLabel: this.badgeLabel,
      accentColor: this.accentColor,
      warrantyTier: this.warrantyTier,
      recommendedUse: this.recommendedUse,
      highlights: this.highlights,
      summary: this.summary,
    };
  }
}

export class GamerCodeLabel implements IProductCodeLabel {
  public readonly line: ProductLine = 'GAMER';
  public readonly prefixBadge = 'GMR-PRO';
  public readonly formattedTag: string;
  public readonly shortTag: string;
  public readonly barcodePayload: string;
  public readonly styleTheme = 'neon-violet';

  constructor(code: string, productName: string, category: ProductCategory) {
    const cleanCode = code.toUpperCase();
    this.shortTag = `GMR::${cleanCode}`;
    this.formattedTag = `[GAMER-PRO] ${cleanCode} // ${category}`;
    this.barcodePayload = `TS-GMR-${cleanCode}-${productName.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
  }

  public toJSON(): ProductCodeLabelDTO {
    return {
      line: this.line,
      prefixBadge: this.prefixBadge,
      formattedTag: this.formattedTag,
      shortTag: this.shortTag,
      barcodePayload: this.barcodePayload,
      styleTheme: this.styleTheme,
    };
  }
}

/**
 * PRODUCTOS CONCRETOS — FAMILIA OFICINA
 */
export class OfficeSpecSheet implements ITechSpecSheet {
  public readonly line: ProductLine = 'OFFICE';
  public readonly tierTitle = 'Serie Corporativa & Productividad';
  public readonly badgeLabel = 'OFFICE PRO';
  public readonly accentColor = 'sky';
  public readonly warrantyTier = 'Garantía Empresarial 12m + Soporte Continuidad';
  public readonly recommendedUse = 'Productividad ejecutiva, Desarrollo, Teletrabajo y Corporativo';
  public readonly highlights: string[];
  private readonly summary: string;

  constructor(productName: string, category: ProductCategory, specs: ProductSpecs) {
    this.highlights = this.buildHighlights(category, specs);
    this.summary = this.formatSummary(specs, productName);
  }

  private buildHighlights(category: ProductCategory, specs: ProductSpecs): string[] {
    const baseHighlights: Record<ProductCategory, string[]> = {
      LAPTOP: ['Autonomía extendida', 'Chasis ultraligero empresarial', 'Seguridad TPM / biométrica'],
      PERIPHERAL: ['Ergonomía certificada', 'Operación silenciosa', 'Conectividad multipunto USB-C'],
      COMPONENT: ['Eficiencia energética', 'Alta durabilidad MTBF', 'Estabilidad 24/7'],
      ACCESSORY: ['Diseño minimalista ejecutivo', 'Portabilidad diaria', 'Compatibilidad universal'],
    };
    const specEntries = Object.entries(specs)
      .slice(0, 2)
      .map(([k, v]) => `${k}: ${v}`);
    return [...specEntries, ...baseHighlights[category].slice(0, 2)];
  }

  public formatSummary(specs: ProductSpecs, productName?: string): string {
    const pairs = Object.entries(specs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
    const prefix = productName ? `[OFFICE] ${productName}` : '[OFFICE]';
    return pairs ? `${prefix} — ${pairs}` : `${prefix} — Estándar corporativo eficiente`;
  }

  public toJSON(): TechSpecSheetDTO {
    return {
      line: this.line,
      tierTitle: this.tierTitle,
      badgeLabel: this.badgeLabel,
      accentColor: this.accentColor,
      warrantyTier: this.warrantyTier,
      recommendedUse: this.recommendedUse,
      highlights: this.highlights,
      summary: this.summary,
    };
  }
}

export class OfficeCodeLabel implements IProductCodeLabel {
  public readonly line: ProductLine = 'OFFICE';
  public readonly prefixBadge = 'OFC-CORP';
  public readonly formattedTag: string;
  public readonly shortTag: string;
  public readonly barcodePayload: string;
  public readonly styleTheme = 'corporate-slate';

  constructor(code: string, productName: string, category: ProductCategory) {
    const cleanCode = code.toUpperCase();
    this.shortTag = `OFC::${cleanCode}`;
    this.formattedTag = `[OFFICE-CORP] ${cleanCode} | ${category}`;
    this.barcodePayload = `TS-OFC-${cleanCode}-${productName.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
  }

  public toJSON(): ProductCodeLabelDTO {
    return {
      line: this.line,
      prefixBadge: this.prefixBadge,
      formattedTag: this.formattedTag,
      shortTag: this.shortTag,
      barcodePayload: this.barcodePayload,
      styleTheme: this.styleTheme,
    };
  }
}

/**
 * PATRÓN CREACIONAL: ABSTRACT FACTORY
 * Interfaz abstracta que produce familias coherentes de artefactos por línea
 * comercial: Ficha Técnica (ITechSpecSheet) + Etiqueta de Código (IProductCodeLabel).
 */
export interface IProductLineFactory {
  getLine(): ProductLine;
  createTechSpecSheet(
    productName: string,
    category: ProductCategory,
    specs: ProductSpecs
  ): ITechSpecSheet;
  createCodeLabel(
    code: string,
    productName: string,
    category: ProductCategory
  ): IProductCodeLabel;
}

export class GamerLineFactory implements IProductLineFactory {
  public getLine(): ProductLine {
    return 'GAMER';
  }

  public createTechSpecSheet(
    productName: string,
    category: ProductCategory,
    specs: ProductSpecs
  ): ITechSpecSheet {
    return new GamerSpecSheet(productName, category, specs);
  }

  public createCodeLabel(
    code: string,
    productName: string,
    category: ProductCategory
  ): IProductCodeLabel {
    return new GamerCodeLabel(code, productName, category);
  }
}

export class OfficeLineFactory implements IProductLineFactory {
  public getLine(): ProductLine {
    return 'OFFICE';
  }

  public createTechSpecSheet(
    productName: string,
    category: ProductCategory,
    specs: ProductSpecs
  ): ITechSpecSheet {
    return new OfficeSpecSheet(productName, category, specs);
  }

  public createCodeLabel(
    code: string,
    productName: string,
    category: ProductCategory
  ): IProductCodeLabel {
    return new OfficeCodeLabel(code, productName, category);
  }
}

export class ProductLineFactoryProvider {
  private static readonly factories: Record<ProductLine, IProductLineFactory> = {
    GAMER: new GamerLineFactory(),
    OFFICE: new OfficeLineFactory(),
  };

  public static getFactory(line: ProductLine): IProductLineFactory {
    const factory = this.factories[line];
    if (!factory) {
      throw new Error(`Línea de producto no soportada: ${line}`);
    }
    return factory;
  }
}
