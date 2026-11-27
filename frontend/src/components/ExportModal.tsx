import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import { ReportFormatType, ReportType } from '../types/inventory';

interface ExportModalProps {
  onExport: (type: ReportType, format: ReportFormatType) => Promise<void>;
  onClose: () => void;
}

const REPORT_TYPES: Array<{
  type: ReportType;
  className: string;
  title: string;
  desc: string;
}> = [
  {
    type: 'general',
    className: 'GeneralStockReport',
    title: 'Inventario General',
    desc: 'Listado completo con códigos, etiquetas de línea, stock, estados, servicios y precios.',
  },
  {
    type: 'low-stock',
    className: 'LowStockReport',
    title: 'Stock Bajo y Agotados',
    desc: 'Productos en estado crítico con cálculo de déficit y reposición sugerida.',
  },
  {
    type: 'valued',
    className: 'ValuedReport',
    title: 'Inventario Valorizado',
    desc: 'Valoración financiera por artículo (base + extras Decorator) y % de participación.',
  },
];

export function ExportModal({ onExport, onClose }: ExportModalProps) {
  const [reportType, setReportType] = useState<ReportType>('general');
  const [format, setFormat] = useState<ReportFormatType>('excel');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onExport(reportType, format);
      onClose();
    } finally {
      setDownloading(false);
    }
  };

  const selectedReport = REPORT_TYPES.find((r) => r.type === reportType)!;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Exportar Reportes de Inventario
            </h3>
            <p className="text-xs text-slate-300">
              Patrones <strong>Bridge</strong> (Tipo × Formato) + <strong>Adapter</strong> (ExcelJS / CSV)
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Abstracción Bridge */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. Tipo de Reporte (Abstracción: InventoryReport)
            </p>
            <div className="space-y-2">
              {REPORT_TYPES.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setReportType(item.type)}
                  className={`w-full text-left p-3.5 rounded-xl border transition ${
                    reportType === item.type
                      ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{item.title}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 text-white">
                      {item.className}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Implementación Bridge + Adapter */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              2. Formato de Salida (Implementación: IReportFormat + Adapter)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  format === 'excel'
                    ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-1" />
                <p className="text-sm font-bold text-slate-900">Excel (.xlsx)</p>
                <p className="text-[11px] text-slate-500">ExcelFormat → ExcelExporterAdapter</p>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  format === 'csv'
                    ? 'bg-sky-50 border-sky-500 ring-1 ring-sky-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-5 h-5 text-sky-600 mb-1" />
                <p className="text-sm font-bold text-slate-900">CSV (.csv)</p>
                <p className="text-[11px] text-slate-500">CsvFormat → CsvExporterAdapter</p>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 text-slate-100 p-3 font-mono text-xs">
            new {selectedReport.className}(new {format === 'excel' ? 'ExcelFormat()' : 'CsvFormat()'}).generate()
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              {downloading
                ? 'Generando archivo...'
                : `Descargar ${format === 'excel' ? '.xlsx' : '.csv'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
