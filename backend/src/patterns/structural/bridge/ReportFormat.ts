import { CsvExporterAdapter } from '../adapter/CsvExporterAdapter';
import { ExcelExporterAdapter } from '../adapter/ExcelExporterAdapter';
import { ExportedFile, IReportExporter, ReportDocument } from '../adapter/IReportExporter';

/**
 * PATRÓN ESTRUCTURAL: BRIDGE (Implementor)
 * Separa el formato de salida del reporte (Excel vs CSV) de la lógica de negocio
 * que construye el contenido de cada tipo de reporte (InventoryReport).
 */
export interface IReportFormat {
  readonly formatName: string;
  format(document: ReportDocument): Promise<ExportedFile>;
}

export class ExcelFormat implements IReportFormat {
  public readonly formatName = 'EXCEL';
  private readonly exporter: IReportExporter;

  constructor(exporter: IReportExporter = new ExcelExporterAdapter()) {
    this.exporter = exporter;
  }

  public async format(document: ReportDocument): Promise<ExportedFile> {
    return this.exporter.export(document);
  }
}

export class CsvFormat implements IReportFormat {
  public readonly formatName = 'CSV';
  private readonly exporter: IReportExporter;

  constructor(exporter: IReportExporter = new CsvExporterAdapter()) {
    this.exporter = exporter;
  }

  public async format(document: ReportDocument): Promise<ExportedFile> {
    return this.exporter.export(document);
  }
}
