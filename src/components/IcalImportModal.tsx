import { parseIcalContent } from '../utils/icalService'

type ImportedEvent = ReturnType<typeof parseIcalContent>[number]

interface IcalImportModalProps {
  data: ImportedEvent[]
  isImporting: boolean
  onClose: () => void
  onConfirm: (events: ImportedEvent[]) => void
}

export function IcalImportModal({ data, isImporting, onClose, onConfirm }: IcalImportModalProps) {
  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-4"
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget && !isImporting) {
          onClose()
        }
      }}
    >
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-600">
              Importar calendário
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {data.length} evento{data.length !== 1 ? 's' : ''} encontrado
              {data.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
        <div className="max-h-60 space-y-2 overflow-y-auto">
          {data.slice(0, 50).map((event, index) => (
            <div key={index} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-medium text-slate-900">{event.title}</span>
              <span className="ml-2 text-xs text-slate-400">
                {new Date(event.start_date).toLocaleDateString('pt-BR')}
              </span>
              {event.recurrence_rule && (
                <span className="ml-2 text-xs text-purple-500">Recorrente</span>
              )}
            </div>
          ))}
          {data.length > 50 && (
            <p className="text-center text-xs text-slate-400">
              ...e mais {data.length - 50} evento{data.length - 50 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onConfirm(data)}
            disabled={isImporting}
          >
            {isImporting ? 'Importando...' : `Importar ${data.length} evento${data.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
