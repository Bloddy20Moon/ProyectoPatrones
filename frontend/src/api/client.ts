import {
  AlertItem,
  AuditLogEntry,
  CommandRecord,
  DashboardSummary,
  ExtraServiceCatalogItem,
  ExtraServiceType,
  GlobalConfigData,
  KitDTO,
  ProductCategory,
  ProductCodeLabelDTO,
  ProductDTO,
  ProductLine,
  ReportFormatType,
  ReportType,
  TechSpecSheetDTO,
  UndoHistoryItem,
  UserRole,
} from '../types/inventory';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly pattern?: string;

  constructor(message: string, status: number, code?: string, pattern?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.pattern = pattern;
  }
}

export function createInventoryApi(role: UserRole) {
  const actorName = role === 'ADMIN' ? 'Admin TechStock' : 'Vendedor Tienda';

  const baseHeaders = (extra?: Record<string, string>): Record<string, string> => ({
    'X-User-Role': role,
    'X-User-Name': actorName,
    ...extra,
  });

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const isFormData = init.body instanceof FormData;
    const headers = baseHeaders(
      isFormData ? undefined : { 'Content-Type': 'application/json' }
    );

    const response = await fetch(`/api${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers as Record<string, string> | undefined),
      },
    });

    if (!response.ok) {
      let body: { error?: string; code?: string; pattern?: string } = {};
      try {
        body = await response.json();
      } catch {
        // fallback
      }
      throw new ApiError(
        body.error || `Error HTTP ${response.status}`,
        response.status,
        body.code,
        body.pattern
      );
    }

    return response.json() as Promise<T>;
  }

  return {
    getDashboard: () => request<DashboardSummary>('/dashboard'),
    getProducts: () => request<{ products: ProductDTO[] }>('/products'),
    getKits: () => request<{ kits: KitDTO[] }>('/kits'),
    getAlerts: (includeResolved = false) =>
      request<{ alerts: AlertItem[] }>(`/alerts?includeResolved=${includeResolved}`),
    getAuditLogs: () => request<{ logs: AuditLogEntry[] }>('/audit/logs'),
    getCommandHistory: () => request<{ commands: CommandRecord[] }>('/audit/commands'),
    getServiceCatalog: () => request<{ services: ExtraServiceCatalogItem[] }>('/meta/services'),
    getNextCode: (category: ProductCategory) =>
      request<{ category: ProductCategory; prefix: string; suggestedCode: string }>(
        `/meta/next-code?category=${category}`
      ),
    getLinePreview: (line: ProductLine, category: ProductCategory, code: string, name: string) =>
      request<{ specSheet: TechSpecSheetDTO; codeLabel: ProductCodeLabelDTO }>(
        `/meta/line-preview?line=${encodeURIComponent(line)}&category=${encodeURIComponent(category)}&code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`
      ),

    uploadImage: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return request<{ imageUrl: string; filename: string }>('/uploads', {
        method: 'POST',
        body: formData,
      });
    },

    createProduct: (payload: {
      code?: string;
      name: string;
      brand: string;
      category: ProductCategory;
      line: ProductLine;
      price: number;
      stock: number;
      minStock: number;
      supplier: string;
      imageUrl?: string;
      specifications: Record<string, string>;
      services: ExtraServiceType[];
    }) =>
      request<{ product: ProductDTO }>('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    updateProduct: (
      id: string,
      payload: {
        name?: string;
        brand?: string;
        line?: ProductLine;
        price?: number;
        minStock?: number;
        supplier?: string;
        imageUrl?: string;
        specifications?: Record<string, string>;
      }
    ) =>
      request<{ product: ProductDTO }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    deleteProduct: (id: string) =>
      request<{ deletedCode: string }>(`/products/${id}`, {
        method: 'DELETE',
      }),

    moveStock: (id: string, type: 'IN' | 'OUT', quantity: number, reason: string) =>
      request<{ product: ProductDTO }>(`/products/${id}/stock`, {
        method: 'POST',
        body: JSON.stringify({ type, quantity, reason }),
      }),

    toggleDiscontinued: (id: string, discontinued: boolean) =>
      request<{ product: ProductDTO }>(`/products/${id}/discontinue`, {
        method: 'PATCH',
        body: JSON.stringify({ discontinued }),
      }),

    cloneProduct: (
      id: string,
      overrides: { code?: string; name?: string; price?: number; stock?: number; line?: ProductLine }
    ) =>
      request<{ product: ProductDTO }>(`/products/${id}/clone`, {
        method: 'POST',
        body: JSON.stringify(overrides),
      }),

    undoProduct: (id: string) =>
      request<{ product: ProductDTO }>(`/products/${id}/undo`, {
        method: 'POST',
      }),

    getUndoHistory: (id: string) =>
      request<{ history: UndoHistoryItem[] }>(`/products/${id}/history`),

    addService: (id: string, service: ExtraServiceType) =>
      request<{ product: ProductDTO }>(`/products/${id}/services`, {
        method: 'POST',
        body: JSON.stringify({ service }),
      }),

    removeService: (id: string, service: ExtraServiceType) =>
      request<{ product: ProductDTO }>(`/products/${id}/services/${service}`, {
        method: 'DELETE',
      }),

    createKit: (payload: {
      code?: string;
      name: string;
      description: string;
      line: ProductLine;
      discountPercent: number;
      items: Array<{ productId: string; quantity: number }>;
    }) =>
      request<{ kit: KitDTO }>('/kits', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    deleteKit: (id: string) =>
      request<{ deletedCode: string }>(`/kits/${id}`, {
        method: 'DELETE',
      }),

    updateConfig: (payload: Partial<GlobalConfigData>) =>
      request<{ config: GlobalConfigData }>('/config', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    resetSeed: () =>
      request<{ message: string; summary: DashboardSummary }>('/admin/reset-seed', {
        method: 'POST',
      }),

    exportReport: async (type: ReportType, format: ReportFormatType): Promise<string> => {
      const response = await fetch(`/api/reports/export?type=${type}&format=${format}`, {
        method: 'GET',
        headers: baseHeaders(),
      });

      if (!response.ok) {
        let errText = `Error HTTP ${response.status}`;
        try {
          const parsed = await response.json();
          errText = parsed.error || errText;
        } catch {
          // ignore
        }
        throw new ApiError(errText, response.status);
      }

      const disposition = response.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] ?? `techstock-${type}.${format === 'csv' ? 'csv' : 'xlsx'}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return filename;
    },
  };
}
