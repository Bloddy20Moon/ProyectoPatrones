import { StockStatus } from '../../../models/types';

export interface IStockStateContext {
  readonly code: string;
  readonly name: string;
  readonly stock: number;
  readonly minStock: number;
  readonly isDiscontinued: boolean;
}

export interface StockOperationCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * PATRÓN DE COMPORTAMIENTO: STATE
 * Interfaz base que define el comportamiento y las transiciones automáticas
 * según el nivel de stock o estado comercial del producto.
 */
export interface IStockState {
  readonly status: StockStatus;
  readonly label: string;
  canAddStock(): StockOperationCheck;
  canRemoveStock(currentStock: number, quantity: number): StockOperationCheck;
  canBeSold(): boolean;
  evaluateTransition(context: IStockStateContext): IStockState;
}

export class AvailableState implements IStockState {
  public readonly status: StockStatus = 'AVAILABLE';
  public readonly label = 'Disponible';

  public canAddStock(): StockOperationCheck {
    return { allowed: true };
  }

  public canRemoveStock(currentStock: number, quantity: number): StockOperationCheck {
    if (quantity <= 0) {
      return { allowed: false, reason: 'La cantidad de salida debe ser mayor a cero.' };
    }
    if (quantity > currentStock) {
      return {
        allowed: false,
        reason: `[AvailableState] Stock insuficiente: disponibles ${currentStock} unidades, solicitadas ${quantity}.`,
      };
    }
    return { allowed: true };
  }

  public canBeSold(): boolean {
    return true;
  }

  public evaluateTransition(context: IStockStateContext): IStockState {
    return StockStateResolver.resolve(context);
  }
}

export class LowStockState implements IStockState {
  public readonly status: StockStatus = 'LOW_STOCK';
  public readonly label = 'Stock Bajo';

  public canAddStock(): StockOperationCheck {
    return { allowed: true };
  }

  public canRemoveStock(currentStock: number, quantity: number): StockOperationCheck {
    if (quantity <= 0) {
      return { allowed: false, reason: 'La cantidad de salida debe ser mayor a cero.' };
    }
    if (quantity > currentStock) {
      return {
        allowed: false,
        reason: `[LowStockState] Stock insuficiente en nivel crítico: solo quedan ${currentStock} unidades.`,
      };
    }
    return { allowed: true };
  }

  public canBeSold(): boolean {
    return true;
  }

  public evaluateTransition(context: IStockStateContext): IStockState {
    return StockStateResolver.resolve(context);
  }
}

export class OutOfStockState implements IStockState {
  public readonly status: StockStatus = 'OUT_OF_STOCK';
  public readonly label = 'Agotado';

  public canAddStock(): StockOperationCheck {
    return { allowed: true };
  }

  public canRemoveStock(_currentStock: number, _quantity: number): StockOperationCheck {
    return {
      allowed: false,
      reason: '[OutOfStockState] Operación bloqueada: el producto está Agotado (stock = 0). Registra una entrada primero.',
    };
  }

  public canBeSold(): boolean {
    return false;
  }

  public evaluateTransition(context: IStockStateContext): IStockState {
    return StockStateResolver.resolve(context);
  }
}

export class DiscontinuedState implements IStockState {
  public readonly status: StockStatus = 'DISCONTINUED';
  public readonly label = 'Descontinuado';

  public canAddStock(): StockOperationCheck {
    return {
      allowed: false,
      reason: '[DiscontinuedState] Producto descontinuado: reactívalo antes de registrar entradas de inventario.',
    };
  }

  public canRemoveStock(_currentStock: number, _quantity: number): StockOperationCheck {
    return {
      allowed: false,
      reason: '[DiscontinuedState] Producto descontinuado: no se permiten salidas ni ventas.',
    };
  }

  public canBeSold(): boolean {
    return false;
  }

  public evaluateTransition(context: IStockStateContext): IStockState {
    return StockStateResolver.resolve(context);
  }
}

export class StockStateResolver {
  public static resolve(context: IStockStateContext): IStockState {
    if (context.isDiscontinued) {
      return new DiscontinuedState();
    }
    if (context.stock <= 0) {
      return new OutOfStockState();
    }
    if (context.stock <= context.minStock) {
      return new LowStockState();
    }
    return new AvailableState();
  }
}
