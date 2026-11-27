import { useState } from 'react';
import { Activity, ShieldAlert, Terminal } from 'lucide-react';
import { AuditLogEntry, CommandRecord } from '../types/inventory';

interface AuditSectionProps {
  commands: CommandRecord[];
  logs: AuditLogEntry[];
}

export function AuditSection({ commands, logs }: AuditSectionProps) {
  const [tab, setTab] = useState<'commands' | 'logs'>('logs');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Auditoría e Historial de Operaciones
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trazabilidad impulsada por <strong>CommandInvoker (Command)</strong> y{' '}
            <strong>AuditLogObserver (Observer)</strong>
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-200 p-1 text-xs font-bold">
          <button
            onClick={() => setTab('logs')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
              tab === 'logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Eventos Observer ({logs.length})
          </button>
          <button
            onClick={() => setTab('commands')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition ${
              tab === 'commands' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Comandos Ejecutados ({commands.length})
          </button>
        </div>
      </div>

      {tab === 'commands' ? (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {commands.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Aún no se han ejecutado comandos de movimiento de stock o edición. Prueba registrar una
              entrada/salida de stock o editar un producto.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {commands.map((cmd) => {
                const badge =
                  cmd.commandType === 'ADD_STOCK'
                    ? 'bg-emerald-100 text-emerald-800'
                    : cmd.commandType === 'REMOVE_STOCK'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-indigo-100 text-indigo-800';
                return (
                  <div
                    key={cmd.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap hover:bg-slate-50"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge}`}>
                          {cmd.commandType}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {cmd.productCode}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {cmd.description}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Actor: <strong>{cmd.actor}</strong> · Producto: {cmd.productName}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(cmd.executedAt).toLocaleString('es-PE')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {logs.map((entry) => {
              const isDenied = entry.eventType === 'ACCESS_DENIED';
              return (
                <div
                  key={entry.id}
                  className={`px-5 py-3.5 flex items-start justify-between gap-4 flex-wrap ${
                    isDenied ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isDenied && <ShieldAlert className="w-4 h-4 text-amber-600" />}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          isDenied
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {entry.eventType}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {entry.pattern}
                      </span>
                      {entry.targetCode && (
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {entry.targetCode}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800">{entry.message}</p>
                    <p className="text-[11px] text-slate-500">
                      Usuario: <strong>{entry.actor}</strong> (Rol: {entry.role})
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 shrink-0">
                    {new Date(entry.timestamp).toLocaleString('es-PE')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
