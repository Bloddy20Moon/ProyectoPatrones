import { CloneProductInput } from '../../../models/types';

/**
 * PATRÓN CREACIONAL: PROTOTYPE
 * Interfaz que habilita la clonación profunda de productos existentes para crear
 * variantes rápidamente asignando un nuevo código único.
 */
export interface IPrototype<T> {
  clone(overrides?: CloneProductInput): T;
}

export class ProductPrototypeRegistry<T extends IPrototype<T> & { code: string }> {
  private readonly prototypes = new Map<string, T>();

  public register(prototype: T): void {
    this.prototypes.set(prototype.code.toUpperCase(), prototype);
  }

  public unregister(code: string): void {
    this.prototypes.delete(code.toUpperCase());
  }

  public get(code: string): T | undefined {
    return this.prototypes.get(code.toUpperCase());
  }

  public cloneByCode(code: string, overrides?: CloneProductInput): T {
    const prototype = this.get(code);
    if (!prototype) {
      throw new Error(`[Prototype] No existe un prototipo registrado con código ${code}.`);
    }
    return prototype.clone(overrides);
  }

  public count(): number {
    return this.prototypes.size;
  }

  public clear(): void {
    this.prototypes.clear();
  }
}
