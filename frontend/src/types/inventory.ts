export type ProductCategory = 'LAPTOP' | 'PERIPHERAL' | 'COMPONENT' | 'ACCESSORY';
export type ProductLine = 'GAMER' | 'OFFICE';
export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
export type UserRole = 'ADMIN' | 'SELLER';
export type ExtraServiceType = 'EXTENDED_WARRANTY' | 'SOFTWARE_SETUP' | 'PRIORITY_SUPPORT';
export type ReportType = 'general' | 'low-stock' | 'valued';
export type ReportFormatType = 'excel' | 'csv';

export interface TechSpecSheetDTO {
  line: ProductLine;
  tierTitle: string;
  badgeLabel: string;
  accentColor: string;
  warrantyTier: string;
  recommendedUse: string;
  highlights: string[];
  summary: string;
}

export interface ProductCodeLabelDTO {
  line: ProductLine;
  prefixBadge: string;
  formattedTag: string;
  shortTag: string;
  barcodePayload: string;
  styleTheme: string;
}

export interface ServicePriceBreakdown {
  type: ExtraServiceType;
  name: string;
  description: string;
  cost: number;
}

export interface ExtraServiceCatalogItem {
  type: ExtraServiceType;
  name: string;
  description: string;
  pricingRule: string;
}

export interface ProductDTO {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: ProductCategory;
  categoryLabel: string;
  line: ProductLine;
  basePrice: number;
  finalPrice: number;
  servicesCost: number;
  services: ExtraServiceType[];
  servicesBreakdown: ServicePriceBreakdown[];
  decoratedDescription: string;
  stock: number;
  minStock: number;
  status: StockStatus;
  statusLabel: string;
  canAddStock: boolean;
  canRemoveStock: boolean;
  canBeSold: boolean;
  isDiscontinued: boolean;
  specifications: Record<string, string>;
  imageUrl: string;
  supplier: string;
  specSheet: TechSpecSheetDTO;
  codeLabel: ProductCodeLabelDTO;
  undoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KitComponentDTO {
  productId: string;
  code: string;
  name: string;
  category: ProductCategory;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productStock: number;
}

export interface KitDTO {
  id: string;
  code: string;
  name: string;
  description: string;
  line: ProductLine;
  type: 'KIT';
  discountPercent: number;
  regularPrice: number;
  finalPrice: number;
  savings: number;
  availableStock: number;
  isAvailable: boolean;
  totalUnitsPerKit: number;
  imageUrl: string;
  items: KitComponentDTO[];
  createdAt: string;
}

export interface AlertItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  severity: 'WARNING' | 'CRITICAL';
  status: StockStatus;
  currentStock: number;
  minStock: number;
  message: string;
  createdAt: string;
  resolved: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  pattern: string;
  actor: string;
  role: UserRole;
  targetCode?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CommandRecord {
  id: string;
  commandType: 'ADD_STOCK' | 'REMOVE_STOCK' | 'UPDATE_PRODUCT';
  productId: string;
  productCode: string;
  productName: string;
  actor: string;
  description: string;
  executedAt: string;
  metadata: Record<string, unknown>;
}

export interface GlobalConfigData {
  storeName: string;
  currency: string;
  currencySymbol: string;
  defaultMinStock: number;
  taxRate: number;
}

export interface DashboardSummary {
  kpis: {
    totalProducts: number;
    totalUnits: number;
    totalInventoryValue: number;
    totalBaseInventoryValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    discontinuedCount: number;
    availableCount: number;
    totalKits: number;
    activeAlertsCount: number;
  };
  byCategory: Array<{
    category: ProductCategory;
    label: string;
    count: number;
    units: number;
    value: number;
  }>;
  config: GlobalConfigData;
  patternMetrics: {
    singletonConfigActive: boolean;
    commandsExecuted: number;
    auditLogsRecorded: number;
    activeAlerts: number;
    mementoSnapshotsStored: number;
    decoratedProductsCount: number;
    compositeKitsCount: number;
    registeredPrototypes: number;
  };
}

export interface UndoHistoryItem {
  id: string;
  savedAt: string;
  reason: string;
  name: string;
  price: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'proxy';
  title: string;
  message: string;
  pattern?: string;
}
