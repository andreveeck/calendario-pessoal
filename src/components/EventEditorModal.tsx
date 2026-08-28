import { type FormEvent, useEffect } from 'react'
import { fromIsoStorage, toDateInput, fromDateInput, toIsoStorage } from '../utils/dateUtils'
import type { IEvent } from '../types/event'

interface EventEditorModalProps {
  editingEvent: IEvent
  isSaving: boolean
  formError: string | null
  onClose: () => void
  onSubmit: (eventData: IEvent) => void
  onDelete: () => void
  onUpdate: (event: IEvent) => void
}

export function EventEditorModal({
  editingEvent,
  isSaving,
  formError,
  onClose,
  onSubmit,
  onDelete,
  onUpdate,
}: EventEditorModalProps) {
  // Fechar com Escape
  useEffect(() => {
    const handleEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape' && !isSaving) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => window.removeEventListener('keydown', handleEscape)
  }, [isSaving, onClose])

  const handleSubmit = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()

    if (!editingEvent.title.trim()) {
      return
    }

    const reminderMinutes = Number(editingEvent.reminder_minutes ?? 0)
    const startDate = new Date(editingEvent.start_date)
    const endDate = new Date(editingEvent.end_date)

    if (editingEvent.all_day) {
      const startDateStr = toDateInput(editingEvent.start_date)
      const endDateStr = toDateInput(editingEvent.end_date)

      if (!startDateStr || !endDateStr || endDateStr < startDateStr) {
        return
      }
    } else {
      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        endDate <= startDate
      ) {
        return
      }
    }

    onSubmit({
      ...editingEvent,
      title: editingEvent.title.trim(),
      description: editingEvent.description?.trim() ?? '',
      location: editingEvent.location?.trim() ?? '',
      reminder_minutes: reminderMinutes,
    })
  }

  const handleAllDayToggle = (checked: boolean) => {
    if (checked) {
      const dateStr = toDateInput(editingEvent.start_date) || new Date().toISOString().slice(0, 10)
      onUpdate({
        ...editingEvent,
        all_day: true,
        start_date: fromDateInput(dateStr),
        end_date: fromDateInput(dateStr),
      })
    } else {
      const baseDate = new Date(editingEvent.start_date)
      const year = Number.isNaN(baseDate.getFullYear()) ? new Date().getFullYear() : baseDate.getFullYear()
      const month = Number.isNaN(baseDate.getMonth()) ? new Date().getMonth() : baseDate.getMonth()
      const day = Number.isNaN(baseDate.getDate()) ? new Date().getDate() : baseDate.getDate()

      const newStart = new Date(year, month, day, 9, 0, 0, 0)
      const newEnd = new Date(year, month, day, 10, 0, 0, 0)

      onUpdate({
        ...editingEvent,
        all_day: false,
        start_date: newStart.toISOString(),
        end_date: newEnd.toISOString(),
      })
    }
  }

  const handleStartDateChange = (val: string) => {
    if (editingEvent.all_day) {
      const newStartIso = fromDateInput(val)
      const endDateVal = toDateInput(editingEvent.end_date)
      let newEndIso = editingEvent.end_date

      if (!endDateVal || val > endDateVal) {
        newEndIso = newStartIso
      }

      onUpdate({ ...editingEvent, start_date: newStartIso, end_date: newEndIso })
    } else {
      const newStartIso = toIsoStorage(val)
      const newStartObj = new Date(newStartIso)
      const oldEndObj = new Date(editingEvent.end_date)
      let newEndIso = editingEvent.end_date

      if (Number.isNaN(oldEndObj.getTime()) || oldEndObj <= newStartObj) {
        const autoEnd = new Date(newStartObj.getTime() + 60 * 60 * 1000)
        newEndIso = autoEnd.toISOString()
      }

      onUpdate({ ...editingEvent, start_date: newStartIso, end_date: newEndIso })
    }
  }

  const handleEndDateChange = (val: string) => {
    if (editingEvent.all_day) {
      onUpdate({ ...editingEvent, end_date: fromDateInput(val) })
    } else {
      onUpdate({ ...editingEvent, end_date: toIsoStorage(val) })
    }
  }

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-4"
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <form
        className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6"
        onSubmit={(e) => void handleSubmit(e)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-editor-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Evento</p>
            <h2 id="event-editor-title" className="mt-1 text-xl font-bold text-slate-900">
              {editingEvent.id ? 'Editar evento' : 'Novo evento'}
            </h2>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Título
            <input
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={editingEvent.title}
              onChange={(e) => onUpdate({ ...editingEvent, title: e.target.value })}
              placeholder="Nome do evento ou compromisso"
              autoFocus
              required
            />
          </label>

          {/* Bloco de Data e Horário */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Data e Horário
              </span>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 select-none">
                <input
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  type="checkbox"
                  checked={editingEvent.all_day}
                  onChange={(e) => handleAllDayToggle(e.target.checked)}
                />
                <span>Dia inteiro</span>
              </label>
            </div>

            {editingEvent.all_day ? (
              <div className="space-y-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Data de início
                    <input
                      className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      type="date"
                      value={toDateInput(editingEvent.start_date)}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Data de término
                    <input
                      className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      type="date"
                      value={toDateInput(editingEvent.end_date)}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Para evento de apenas um dia, mantenha as datas de início e término iguais.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Início (data e hora)
                    <input
                      className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      type="datetime-local"
                      value={fromIsoStorage(editingEvent.start_date)}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Término (data e hora)
                    <input
                      className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      type="datetime-local"
                      value={fromIsoStorage(editingEvent.end_date)}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      required
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Defina o horário em que o compromisso começa e termina.
                </p>
              </div>
            )}
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Descrição
            <textarea
              className="mt-1 block min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={editingEvent.description ?? ''}
              placeholder="Detalhes adicionais sobre o evento (opcional)"
              onChange={(e) => onUpdate({ ...editingEvent, description: e.target.value })}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Local
            <input
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={editingEvent.location ?? ''}
              placeholder="Local, link de reunião ou sala (opcional)"
              onChange={(e) => onUpdate({ ...editingEvent, location: e.target.value })}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Lembrete
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={editingEvent.reminder_minutes ?? 0}
                onChange={(e) =>
                  onUpdate({ ...editingEvent, reminder_minutes: Number(e.target.value) })
                }
              >
                <option value={0}>No momento do evento</option>
                <option value={5}>5 minutos antes</option>
                <option value={10}>10 minutos antes</option>
                <option value={15}>15 minutos antes</option>
                <option value={30}>30 minutos antes</option>
                <option value={60}>1 hora antes</option>
                <option value={1440}>1 dia antes</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Repetir
              <select
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={editingEvent.recurrence_rule ?? ''}
                onChange={(e) =>
                  onUpdate({ ...editingEvent, recurrence_rule: e.target.value })
                }
              >
                <option value="">Não repetir</option>
                <option value="FREQ=DAILY;INTERVAL=1">Diariamente</option>
                <option value="FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR">Dias úteis</option>
                <option value="FREQ=WEEKLY;INTERVAL=1">Semanalmente</option>
                <option value="FREQ=MONTHLY;INTERVAL=1">Mensalmente</option>
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Cor
            <input
              className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-1 py-1"
              type="color"
              value={editingEvent.color ?? '#2563eb'}
              onChange={(e) => onUpdate({ ...editingEvent, color: e.target.value })}
            />
          </label>
        </div>

        {formError && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            {editingEvent.id && (
              <button
                type="button"
                className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                onClick={() => void onDelete()}
                disabled={isSaving}
              >
                Excluir evento
              </button>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : editingEvent.id ? 'Salvar alterações' : 'Criar evento'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
