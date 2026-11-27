import { ExportedFile, IReportExporter, ReportDocument } from './IReportExporter';

/**
 * PATRÓN ESTRUCTURAL: ADAPTER (Adaptador Concreto para CSV)
 * Adapta la serialización RFC-4180 CSV con BOM UTF-8 a la interfaz IReportExporter.
 */
export class CsvExporterAdapter implements IReportExporter {
  public async export(document: ReportDocument): Promise<ExportedFile> {
    const lines: string[] = [];

    // Encabezados
    lines.push(document.columns.map((col) => this.escapeCsvCell(col.header)).join(','));

    // Filas de datos
    for (const row of document.rows) {
      const values = document.columns.map((col) => {
        const val = row[col.key];
        if (col.format === 'percent' && typeof val === 'number') {
          return this.escapeCsvCell(`${(val * 100).toFixed(1)}%`);
        }
        return this.escapeCsvCell(val ?? '');
      });
      lines.push(values.join(','));
    }

    // Resumen opcional
    if (document.summary.length > 0) {
      lines.push('');
      lines.push('RESUMEN,VALOR');
      for (const item of document.summary) {
        lines.push(`${this.escapeCsvCell(item.label)},${this.escapeCsvCell(item.value)}`);
      }
    }

    const utf8Bom = '\uFEFF';
    const csvContent = utf8Bom + lines.join('\r\n');
    const buffer = Buffer.from(csvContent, 'utf-8');

    return {
      buffer,
      filename: `${document.fileBaseName}.csv`,
      mimeType: 'text/csv; charset=utf-8',
      extension: 'csv',
    };
  }

  private escapeCsvCell(value: string | number): string {
    let str = String(value);
    // Protección contra CSV / Formula Injection en Excel
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}
