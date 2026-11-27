import { randomUUID } from 'crypto';
import { Product } from '../../../models/Product';
import { ActorContext } from '../../../models/types';
import { InventoryStore } from '../../creational/singleton/InventoryStore';

export type InventoryEventType =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_CLONED'
  | 'PRODUCT_UNDONE'
  | 'PRODUCT_DELETED'
  | 'STOCK_ADDED'
  | 'STOCK_REMOVED'
  | 'PRODUCT_DISCONTINUED'
  | 'PRODUCT_REACTIVATED'
  | 'SERVICE_UPDATED'
  | 'KIT_CREATED'
  | 'KIT_DELETED'
  | 'REPORT_EXPORTED'
  | 'CONFIG_UPDATED'
  | 'ACCESS_DENIED';

export interface InventoryEvent {
  type: InventoryEventType;
  pattern: string;
  actor: ActorContext;
  message: string;
  product?: Product;
  targetCode?: string;
  details?: Record<string, unknown>;
}

/**
 * PATRÓN DE COMPORTAMIENTO: OBSERVER
 * Define la interfaz observadora y el sujeto observable (InventorySubject) que
 * notifica automáticamente cambios de stock, alertas de umbral y auditoría.
 */
export interface IInventoryObserver {
  readonly observerName: string;
  update(event: InventoryEvent): void;
}

export class InventorySubject {
  private readonly observers: IInventoryObserver[] = [];

  public subscribe(observer: IInventoryObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  public unsubscribe(observer: IInventoryObserver): void {
    const idx = this.observers.indexOf(observer);
    if (idx !== -1) {
      this.observers.splice(idx, 1);
    }
  }

  public notify(event: InventoryEvent): void {
    for (const observer of this.observers) {
      observer.update(event);
    }
  }
}

/**
 * Observador concreto 1: Evalúa el estado de stock en cada evento de producto
 * para generar o resolver alertas automáticas en el Dashboard.
 */
export class DashboardAlertObserver implements IInventoryObserver {
  public readonly observerName = 'DashboardAlertObserver';

  public update(event: InventoryEvent): void {
    const store = InventoryStore.getInstance();

    if (event.type === 'PRODUCT_DELETED' && event.product) {
      store.resolveAlertsForProduct(event.product.id);
      return;
    }

    const product = event.product;
    if (!product) {
      return;
    }

    const status = product.getStatus();
    if (status === 'OUT_OF_STOCK') {
      store.upsertAlert({
        id: randomUUID(),
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        severity: 'CRITICAL',
        status,
        currentStock: product.stock,
        minStock: product.minStock,
        message: `¡Agotado! ${product.name} (${product.code}) llegó a 0 unidades. Se requiere reposición urgente.`,
        createdAt: new Date().toISOString(),
        resolved: false,
      });
    } else if (status === 'LOW_STOCK') {
      store.upsertAlert({
        id: randomUUID(),
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        severity: 'WARNING',
        status,
        currentStock: product.stock,
        minStock: product.minStock,
        message: `Stock bajo en ${product.name} (${product.code}): ${product.stock} u. disponibles (mínimo: ${product.minStock}).`,
        createdAt: new Date().toISOString(),
        resolved: false,
      });
    } else {
      store.resolveAlertsForProduct(product.id);
    }
  }
}

/**
 * Observador concreto 2: Registra cada evento del dominio en la bitácora
 * de auditoría (incluyendo operaciones exitosas y rechazos de seguridad Proxy).
 */
export class AuditLogObserver implements IInventoryObserver {
  public readonly observerName = 'AuditLogObserver';

  public update(event: InventoryEvent): void {
    const store = InventoryStore.getInstance();
    store.addAuditLog({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: event.type,
      pattern: event.pattern,
      actor: event.actor.actorName,
      role: event.actor.role,
      targetCode: event.targetCode ?? event.product?.code,
      message: event.message,
      details: event.details,
    });
  }
}
