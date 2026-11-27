import path from 'path';
import { GlobalConfigData } from '../../../models/types';

/**
 * PATRÓN CREACIONAL: SINGLETON
 * Única instancia global para la configuración del sistema (nombre de tienda,
 * moneda, umbral mínimo de stock por defecto, impuesto y ruta de persistencia).
 */
export class DatabaseConfig {
  private static instance: DatabaseConfig | null = null;

  private storeName: string;
  private currency: string;
  private currencySymbol: string;
  private defaultMinStock: number;
  private taxRate: number;
  private readonly persistenceFilePath: string;

  private constructor() {
    this.storeName = 'TechStock';
    this.currency = 'USD';
    this.currencySymbol = '$';
    this.defaultMinStock = 5;
    this.taxRate = 0.18;
    this.persistenceFilePath = path.resolve(process.cwd(), 'data', 'inventory.json');
  }

  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  public getStoreName(): string {
    return this.storeName;
  }

  public getCurrency(): string {
    return this.currency;
  }

  public getCurrencySymbol(): string {
    return this.currencySymbol;
  }

  public getDefaultMinStock(): number {
    return this.defaultMinStock;
  }

  public getTaxRate(): number {
    return this.taxRate;
  }

  public getPersistenceFilePath(): string {
    return this.persistenceFilePath;
  }

  public getConfig(): GlobalConfigData {
    return {
      storeName: this.storeName,
      currency: this.currency,
      currencySymbol: this.currencySymbol,
      defaultMinStock: this.defaultMinStock,
      taxRate: this.taxRate,
    };
  }

  public updateConfig(updates: Partial<GlobalConfigData>): GlobalConfigData {
    if (updates.storeName !== undefined && updates.storeName.trim().length > 0) {
      this.storeName = updates.storeName.trim();
    }
    if (updates.currency !== undefined && updates.currency.trim().length > 0) {
      this.currency = updates.currency.trim().toUpperCase();
    }
    if (updates.currencySymbol !== undefined && updates.currencySymbol.trim().length > 0) {
      this.currencySymbol = updates.currencySymbol.trim();
    }
    if (updates.defaultMinStock !== undefined && Number.isFinite(updates.defaultMinStock) && updates.defaultMinStock >= 1) {
      this.defaultMinStock = Math.floor(updates.defaultMinStock);
    }
    if (updates.taxRate !== undefined && Number.isFinite(updates.taxRate) && updates.taxRate >= 0 && updates.taxRate <= 1) {
      this.taxRate = updates.taxRate;
    }
    return this.getConfig();
  }

  public formatMoney(amount: number): string {
    return `${this.currencySymbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
