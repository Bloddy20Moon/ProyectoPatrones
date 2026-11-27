import ExcelJS from 'exceljs';
import { ExportedFile, IReportExporter, ReportDocument } from './IReportExporter';

/**
 * PATRÓN ESTRUCTURAL: ADAPTER (Adaptador Concreto para ExcelJS)
 * Adapta la API externa de la librería `exceljs` a la interfaz interna IReportExporter
 * de TechStock para generar archivos .xlsx reales con estilos, formatos numéricos
 * y filas de resumen.
 */
export class ExcelExporterAdapter implements IReportExporter {
  public async export(document: ReportDocument): Promise<ExportedFile> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TechStock Inventory System';
    workbook.created = new Date();

    const safeSheetName = document.sheetName.slice(0, 31).replace(/[\\/*?:[\]]/g, '');
    const worksheet = workbook.addWorksheet(safeSheetName || 'Inventario', {
      views: [{ state: 'frozen', ySplit: 4 }],
    });

    const totalColumns = Math.max(1, document.columns.length);

    // Fila 1: Título del reporte
    worksheet.mergeCells(1, 1, 1, totalColumns);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = document.title;
    titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E1B4B' },
    };
    worksheet.getRow(1).height = 30;

    // Fila 2: Subtítulo + fecha de generación
    worksheet.mergeCells(2, 1, 2, totalColumns);
    const subtitleCell = worksheet.getCell(2, 1);
    subtitleCell.value = `${document.subtitle}  |  Generado: ${new Date(document.generatedAt).toLocaleString('es-PE')}`;
    subtitleCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FFCBD5E1' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    subtitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF312E81' },
    };
    worksheet.getRow(2).height = 20;

    // Fila 3: Espaciador
    worksheet.getRow(3).height = 8;

    // Configurar columnas y anchos
    document.columns.forEach((col, index) => {
      const column = worksheet.getColumn(index + 1);
      column.width = col.width ?? 18;
    });

    // Fila 4: Cabeceras de tabla
    const headerRow = worksheet.getRow(4);
    headerRow.height = 24;
    document.columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.header;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: col.format === 'currency' || col.format === 'number' || col.format === 'percent' ? 'right' : 'left',
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
      };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF312E81' } },
      };
    });

    // Filas de datos
    const currencyFmt = `"${document.currencySymbol}"#,##0.00`;
    document.rows.forEach((rowData, rowIndex) => {
      const excelRow = worksheet.getRow(5 + rowIndex);
      excelRow.height = 20;
      const isEven = rowIndex % 2 === 1;

      document.columns.forEach((col, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        const val = rowData[col.key];
        cell.value = val ?? '';
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };

        if (col.format === 'currency' && typeof val === 'number') {
          cell.numFmt = currencyFmt;
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (col.format === 'number' && typeof val === 'number') {
          cell.numFmt = '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (col.format === 'percent' && typeof val === 'number') {
          cell.numFmt = '0.0%';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }

        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // AutoFilter sobre la tabla
    if (document.rows.length > 0) {
      worksheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4 + document.rows.length, column: totalColumns },
      };
    }

    // Sección de resumen al pie
    if (document.summary.length > 0) {
      let currentRow = 6 + document.rows.length;
      const summaryHeader = worksheet.getRow(currentRow);
      summaryHeader.getCell(1).value = 'RESUMEN DEL REPORTE';
      summaryHeader.getCell(1).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E1B4B' } };
      currentRow++;

      for (const item of document.summary) {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = item.label;
        row.getCell(1).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
        row.getCell(2).value = item.value;
        row.getCell(2).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF4F46E5' } };
        currentRow++;
      }
    }

    const rawBuffer = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(rawBuffer as ArrayBuffer);

    return {
      buffer,
      filename: `${document.fileBaseName}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
    };
  }
}
