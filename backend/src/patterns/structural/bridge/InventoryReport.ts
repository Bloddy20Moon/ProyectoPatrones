import { Product } from '../../../models/Product';
import { DatabaseConfig } from '../../creational/singleton/DatabaseConfig';
import { ExportedFile, ReportDocument } from '../adapter/IReportExporter';
import { ProductKit } from '../composite/InventoryItem';
import { ProductDecoratorChain } from '../decorator/ProductDecorator';
import { IReportFormat } from './ReportFormat';

/**
 * PATRÓN ESTRUCTURAL: BRIDGE (Abstraction)
 * Separa la jerarquía de tipos de reporte (GeneralStockReport, LowStockReport,
 * ValuedReport) de la jerarquía de formatos de exportación (ExcelFormat, CsvFormat).
 */
export abstract class InventoryReport {
  protected readonly format: IReportFormat;

  constructor(format: IReportFormat) {
    this.format = format;
  }

  public abstract readonly reportType: string;

  protected abstract buildDocument(products: Product[], kits: ProductKit[]): ReportDocument;

  public async generate(products: Product[], kits: ProductKit[] = []): Promise<ExportedFile> {
    const document = this.buildDocument(products, kits);
    return this.format.format(document);
  }
}

export class GeneralStockReport extends InventoryReport {
  public readonly reportType = 'general';

  protected buildDocument(products: Product[], kits: ProductKit[]): ReportDocument {
    const config = DatabaseConfig.getInstance();
    const rows = products.map((product) => {
      const decorated = ProductDecoratorChain.apply(product);
      return {
        code: product.code,
        tag: product.codeLabel.shortTag,
        name: product.name,
        brand: product.brand,
        category: product.getCategoryLabel(),
        line: product.line === 'GAMER' ? 'Gamer' : 'Oficina',
        status: product.getState().label,
        stock: product.stock,
        minStock: product.minStock,
        basePrice: product.price,
        finalPrice: decorated.getPrice(),
        services:
          decorated.getServicesBreakdown().map((s) => s.name).join('; ') || 'Sin servicios extra',
        supplier: product.supplier,
      };
    });

    const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce(
      (sum, p) => sum + ProductDecoratorChain.apply(p).getPrice() * p.stock,
      0
    );

    return {
      title: `${config.getStoreName()} — Reporte General de Inventario`,
      subtitle: `Catálogo completo de productos tecnológicos (${products.length} productos, ${kits.length} combos activos)`,
      sheetName: 'Inventario General',
      fileBaseName: `techstock-inventario-general-${this.dateStamp()}`,
      generatedAt: new Date().toISOString(),
      currencySymbol: config.getCurrencySymbol(),
      columns: [
        { header: 'Código', key: 'code', width: 14, format: 'text' },
        { header: 'Etiqueta Línea', key: 'tag', width: 16, format: 'text' },
        { header: 'Producto', key: 'name', width: 32, format: 'text' },
        { header: 'Marca', key: 'brand', width: 15, format: 'text' },
        { header: 'Categoría', key: 'category', width: 14, format: 'text' },
        { header: 'Gama', key: 'line', width: 12, format: 'text' },
        { header: 'Estado', key: 'status', width: 16, format: 'text' },
        { header: 'Stock Actual', key: 'stock', width: 14, format: 'number' },
        { header: 'Stock Mínimo', key: 'minStock', width: 14, format: 'number' },
        { header: 'Precio Base', key: 'basePrice', width: 15, format: 'currency' },
        { header: 'Precio c/Servicios', key: 'finalPrice', width: 18, format: 'currency' },
        { header: 'Servicios Extra', key: 'services', width: 32, format: 'text' },
        { header: 'Proveedor', key: 'supplier', width: 22, format: 'text' },
      ],
      rows,
      summary: [
        { label: 'Total de Productos', value: products.length },
        { label: 'Total de Unidades en Stock', value: totalUnits },
        { label: 'Combos / Kits Activos', value: kits.length },
        { label: 'Valor Total Estimado', value: config.formatMoney(totalValue) },
      ],
    };
  }

  private dateStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

export class LowStockReport extends InventoryReport {
  public readonly reportType = 'low-stock';

  protected buildDocument(products: Product[], _kits: ProductKit[]): ReportDocument {
    const config = DatabaseConfig.getInstance();
    const criticalProducts = products.filter(
      (p) => p.getStatus() === 'LOW_STOCK' || p.getStatus() === 'OUT_OF_STOCK'
    );

    const rows = criticalProducts.map((product) => {
      const recommendedOrder = Math.max(product.minStock * 2 - product.stock, product.minStock);
      const restockCost = Number((recommendedOrder * product.price).toFixed(2));
      return {
        code: product.code,
        name: product.name,
        brand: product.brand,
        category: product.getCategoryLabel(),
        status: product.getState().label,
        stock: product.stock,
        minStock: product.minStock,
        deficit: Math.max(0, product.minStock - product.stock),
        recommendedOrder,
        unitPrice: product.price,
        estimatedRestockCost: restockCost,
        supplier: product.supplier,
      };
    });

    const totalRestockCost = rows.reduce((sum, r) => sum + Number(r.estimatedRestockCost), 0);

    return {
      title: `${config.getStoreName()} — Reporte de Stock Bajo y Agotados`,
      subtitle: 'Productos que requieren reposición inmediata',
      sheetName: 'Stock Bajo y Agotados',
      fileBaseName: `techstock-stock-bajo-${new Date().toISOString().slice(0, 10)}`,
      generatedAt: new Date().toISOString(),
      currencySymbol: config.getCurrencySymbol(),
      columns: [
        { header: 'Código', key: 'code', width: 14, format: 'text' },
        { header: 'Producto', key: 'name', width: 32, format: 'text' },
        { header: 'Marca', key: 'brand', width: 15, format: 'text' },
        { header: 'Categoría', key: 'category', width: 14, format: 'text' },
        { header: 'Estado', key: 'status', width: 16, format: 'text' },
        { header: 'Stock Actual', key: 'stock', width: 14, format: 'number' },
        { header: 'Stock Mínimo', key: 'minStock', width: 14, format: 'number' },
        { header: 'Déficit', key: 'deficit', width: 12, format: 'number' },
        { header: 'Reposición Sugerida', key: 'recommendedOrder', width: 20, format: 'number' },
        { header: 'Precio Unitario', key: 'unitPrice', width: 16, format: 'currency' },
        { header: 'Costo Estimado Reposición', key: 'estimatedRestockCost', width: 24, format: 'currency' },
        { header: 'Proveedor', key: 'supplier', width: 22, format: 'text' },
      ],
      rows,
      summary: [
        { label: 'Productos en Alerta', value: criticalProducts.length },
        {
          label: 'Agotados (Stock 0)',
          value: criticalProducts.filter((p) => p.getStatus() === 'OUT_OF_STOCK').length,
        },
        { label: 'Inversión Sugerida de Reposición', value: config.formatMoney(totalRestockCost) },
      ],
    };
  }
}

export class ValuedReport extends InventoryReport {
  public readonly reportType = 'valued';

  protected buildDocument(products: Product[], kits: ProductKit[]): ReportDocument {
    const config = DatabaseConfig.getInstance();
    const enriched = products.map((product) => {
      const decorated = ProductDecoratorChain.apply(product);
      const baseTotal = Number((product.price * product.stock).toFixed(2));
      const finalUnit = decorated.getPrice();
      const servicesUnit = Number((finalUnit - product.price).toFixed(2));
      const valuedTotal = Number((finalUnit * product.stock).toFixed(2));
      return { product, baseTotal, finalUnit, servicesUnit, valuedTotal };
    });

    const grandTotal = enriched.reduce((sum, item) => sum + item.valuedTotal, 0);
    const grandBaseTotal = enriched.reduce((sum, item) => sum + item.baseTotal, 0);
    const grandUnits = products.reduce((sum, p) => sum + p.stock, 0);

    const rows = enriched
      .sort((a, b) => b.valuedTotal - a.valuedTotal)
      .map((item) => ({
        code: item.product.code,
        name: item.product.name,
        category: item.product.getCategoryLabel(),
        line: item.product.line === 'GAMER' ? 'Gamer' : 'Oficina',
        status: item.product.getState().label,
        stock: item.product.stock,
        basePrice: item.product.price,
        servicesUnit: item.servicesUnit,
        finalPrice: item.finalUnit,
        baseTotal: item.baseTotal,
        valuedTotal: item.valuedTotal,
        share: grandTotal > 0 ? item.valuedTotal / grandTotal : 0,
      }));

    const kitsCatalogValue = kits.reduce((sum, k) => sum + k.getPrice() * k.getAvailableStock(), 0);

    return {
      title: `${config.getStoreName()} — Reporte de Inventario Valorizado`,
      subtitle: `Valoración financiera por producto incluyendo servicios decorados (${config.getCurrency()})`,
      sheetName: 'Inventario Valorizado',
      fileBaseName: `techstock-valorizado-${new Date().toISOString().slice(0, 10)}`,
      generatedAt: new Date().toISOString(),
      currencySymbol: config.getCurrencySymbol(),
      columns: [
        { header: 'Código', key: 'code', width: 14, format: 'text' },
        { header: 'Producto', key: 'name', width: 32, format: 'text' },
        { header: 'Categoría', key: 'category', width: 14, format: 'text' },
        { header: 'Gama', key: 'line', width: 12, format: 'text' },
        { header: 'Estado', key: 'status', width: 15, format: 'text' },
        { header: 'Stock', key: 'stock', width: 10, format: 'number' },
        { header: 'Precio Base', key: 'basePrice', width: 15, format: 'currency' },
        { header: 'Extras Unit.', key: 'servicesUnit', width: 15, format: 'currency' },
        { header: 'Precio Final', key: 'finalPrice', width: 15, format: 'currency' },
        { header: 'Valor Base Total', key: 'baseTotal', width: 18, format: 'currency' },
        { header: 'Valorizado Total', key: 'valuedTotal', width: 18, format: 'currency' },
        { header: '% Participación', key: 'share', width: 16, format: 'percent' },
      ],
      rows,
      summary: [
        { label: 'Unidades Totales Valorizadas', value: grandUnits },
        { label: 'Valor Base del Inventario', value: config.formatMoney(grandBaseTotal) },
        { label: 'Valor Total (incl. Servicios Extra)', value: config.formatMoney(grandTotal) },
        { label: 'Valor Potencial en Combos Armables', value: config.formatMoney(kitsCatalogValue) },
      ],
    };
  }
}
