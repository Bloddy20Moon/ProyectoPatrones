export interface ReportColumn {
  header: string;
  key: string;
  width?: number;
  format?: 'currency' | 'number' | 'percent' | 'text';
}

export interface ReportSummaryRow {
  label: string;
  value: string | number;
}

export interface ReportDocument {
  title: string;
  subtitle: string;
  sheetName: string;
  fileBaseName: string;
  generatedAt: string;
  currencySymbol: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  summary: ReportSummaryRow[];
}

export interface ExportedFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  extension: string;
}

/**
 * PATRÓN ESTRUCTURAL: ADAPTER (Interfaz Target)
 * Define el contrato interno de TechStock para exportar documentos de reporte,
 * desacoplando la aplicación de librerías externas concretas como ExcelJS.
 */
export interface IReportExporter {
  export(document: ReportDocument): Promise<ExportedFile>;
}
