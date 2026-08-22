import type { DateSelectArg, EventChangeArg, EventClickArg, EventInput } from '@fullcalendar/core'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

import useSQLite from '../hooks/useSQLite'
import { createEvent, deleteEvent, getAllEvents, updateEvent } from '../utils/eventService'
import type { IEvent } from '../types/event'

const toDateTimeInput = (dateValue: string) => {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

const fromDateTimeInput = (dateValue: string) => (dateValue ? new Date(dateValue).toISOString() : '')
const toDateInput = (dateValue: string) => toDateTimeInput(dateValue).slice(0, 10)
const fromDateInput = (dateValue: string) => (dateValue ? new Date(`${dateValue}T00:00:00`).toISOString() : '')

export default function CalendarView() {
  const { loading, error, db, executeQuery, exportDatabase, importDatabase } = useSQLite()
  const [events, setEvents] = useState<EventInput[]>([])
  const [eventRecords, setEventRecords] = useState<IEvent[]>([])
  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleViewportChange = () => setIsMobile(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleViewportChange)

    return () => mediaQuery.removeEventListener('change', handleViewportChange)
  }, [])

  useEffect(() => {
    if (!editingEvent) {
      return
    }

    const handleEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape' && !isSaving) {
        setEditingEvent(null)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => window.removeEventListener('keydown', handleEscape)
  }, [editingEvent, isSaving])

  const loadEvents = useCallback(async () => {
    if (!db) {
      return
    }

    setIsRefreshing(true)

    try {
      const loadedEvents = await getAllEvents(executeQuery)

      setEventRecords(loadedEvents)
      setEvents(
        loadedEvents.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start_date,
          end: event.end_date,
          allDay: event.all_day,
          extendedProps: {
            description: event.description,
            location: event.location,
          },
          backgroundColor: event.color ?? '#3b82f6',
          borderColor: event.color ?? '#2563eb',
          textColor: '#ffffff',
        })),
      )
    } finally {
      setIsRefreshing(false)
    }
  }, [db, executeQuery])

  useEffect(() => {
    queueMicrotask(() => void loadEvents())
  }, [loadEvents])

  const handleDateSelect = async (selectionInfo: DateSelectArg) => {
    if (!db) {
      return
    }

    setFormError(null)
    setEditingEvent({
      id: '',
      title: 'Novo evento',
      description: 'Evento criado no calendário',
      location: '',
      all_day: selectionInfo.allDay,
      start_date: selectionInfo.start.toISOString(),
      end_date: selectionInfo.end.toISOString(),
      color: '#2563eb',
      label: 'Agenda',
      reminder_minutes: 10,
      recurrence_rule: '',
    })
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const selectedEvent = eventRecords.find((event) => event.id === clickInfo.event.id)

    if (selectedEvent) {
      setFormError(null)
      setEditingEvent(selectedEvent)
    }
  }

  const handleEventChange = async ({ event }: EventChangeArg) => {
    if (!event.start || !event.end) {
      return
    }

    await updateEvent(executeQuery, event.id, {
      all_day: event.allDay,
      start_date: event.start.toISOString(),
      end_date: event.end.toISOString(),
    })
    await loadEvents()
  }

  const handleEventSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()

    if (!editingEvent) {
      return
    }

    if (!editingEvent.title.trim()) {
      setFormError('Informe um título para o evento.')
      return
    }

    const startDate = new Date(editingEvent.start_date)
    const endDate = new Date(editingEvent.end_date)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setFormError('Informe datas válidas. O fim precisa ser depois do início.')
      return
    }

    setFormError(null)
    setIsSaving(true)

    try {
      const eventData = {
        title: editingEvent.title.trim(),
        description: editingEvent.description?.trim() ?? '',
        location: editingEvent.location?.trim() ?? '',
        all_day: editingEvent.all_day,
        start_date: editingEvent.start_date,
        end_date: editingEvent.end_date,
        color: editingEvent.color ?? '#2563eb',
        label: editingEvent.label ?? 'Agenda',
        reminder_minutes: editingEvent.reminder_minutes ?? 10,
        recurrence_rule: editingEvent.recurrence_rule ?? '',
      }

      if (editingEvent.id) {
        await updateEvent(executeQuery, editingEvent.id, eventData)
      } else {
        await createEvent(executeQuery, eventData)
      }
      setEditingEvent(null)
      await loadEvents()
    } finally {
      setIsSaving(false)
    }
  }

  const handleEventDelete = async () => {
    if (!editingEvent || !window.confirm(`Excluir o evento "${editingEvent.title}"?`)) {
      return
    }

    setIsSaving(true)

    try {
      await deleteEvent(executeQuery, editingEvent.id)
      setEditingEvent(null)
      await loadEvents()
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportDatabase = () => {
    const databaseBytes = exportDatabase()

    if (!databaseBytes) {
      return
    }

    const databaseBuffer = databaseBytes.buffer.slice(
      databaseBytes.byteOffset,
      databaseBytes.byteOffset + databaseBytes.byteLength,
    ) as ArrayBuffer
    const blob = new Blob([databaseBuffer], { type: 'application/vnd.sqlite3' })
    const downloadUrl = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    downloadLink.href = downloadUrl
    downloadLink.download = `webcal-backup-${timestamp}.sqlite`
    downloadLink.click()
    URL.revokeObjectURL(downloadUrl)
  }

  const handleImportDatabase = async (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const backupFile = changeEvent.target.files?.[0]

    if (!backupFile) {
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      await importDatabase(await backupFile.arrayBuffer())
    } catch (importFailure) {
      const message = importFailure instanceof Error ? importFailure.message : 'Falha ao importar o backup.'
      setImportError(message)
    } finally {
      setIsImporting(false)
      changeEvent.target.value = ''
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-700">Carregando banco local...</div>
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center text-red-600">Erro: {error}</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
      <div className="mb-4 flex flex-col items-start gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">WebCal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-3xl">Calendário Offline</h1>
        </div>
        <div className="mobile-actions grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
          <label className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-2 text-center text-[11px] font-semibold leading-tight text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:px-4 sm:text-sm">
            <span>{isImporting ? 'Importando...' : 'Importar backup'}</span>
            <input
              className="sr-only"
              type="file"
              accept=".sqlite,.db,application/vnd.sqlite3"
              onChange={(changeEvent) => void handleImportDatabase(changeEvent)}
              disabled={isImporting || !db}
            />
          </label>
          <button
            type="button"
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-[11px] font-semibold leading-tight text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:px-4 sm:text-sm"
            onClick={handleExportDatabase}
            disabled={!db || isImporting}
          >
            Exportar backup
          </button>
          <button
            type="button"
            className="w-full rounded-md bg-blue-600 px-2 py-2 text-[11px] font-semibold leading-tight text-white shadow-sm transition hover:bg-blue-500 sm:w-auto sm:px-4 sm:text-sm"
            onClick={() => void loadEvents()}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
          >
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {importError && (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          Não foi possível importar o backup: {importError}
        </p>
      )}

      <div className="calendar-shell overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={ptBrLocale}
          initialView="dayGridMonth"
          selectable
          editable
          selectMirror
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDidMount={({ event, el }) => {
            const details = [event.extendedProps.description, event.extendedProps.location]
              .filter(Boolean)
              .join(' | ')

            if (details) {
              el.title = details
            }
          }}
          eventChange={(changeInfo) => void handleEventChange(changeInfo)}
          contentHeight={isMobile ? 'auto' : undefined}
          expandRows={!isMobile}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: isMobile ? 'dayGridMonth,dayGridWeek' : 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          height={isMobile ? 'auto' : '72vh'}
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
          }}
        />
      </div>

      {editingEvent && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.target === mouseEvent.currentTarget && !isSaving) {
              setEditingEvent(null)
            }
          }}
        >
          <form
            className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6"
            onSubmit={(submitEvent) => void handleEventSubmit(submitEvent)}
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
                onClick={() => setEditingEvent(null)}
              >
                Fechar
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Início
                  <input
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type={editingEvent.all_day ? 'date' : 'datetime-local'}
                    value={editingEvent.all_day ? toDateInput(editingEvent.start_date) : toDateTimeInput(editingEvent.start_date)}
                    onChange={(changeEvent) =>
                      setEditingEvent({
                        ...editingEvent,
                        start_date: editingEvent.all_day
                          ? fromDateInput(changeEvent.target.value)
                          : fromDateTimeInput(changeEvent.target.value),
                      })
                    }
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Fim
                  <input
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    type={editingEvent.all_day ? 'date' : 'datetime-local'}
                    value={editingEvent.all_day ? toDateInput(editingEvent.end_date) : toDateTimeInput(editingEvent.end_date)}
                    onChange={(changeEvent) =>
                      setEditingEvent({
                        ...editingEvent,
                        end_date: editingEvent.all_day
                          ? fromDateInput(changeEvent.target.value)
                          : fromDateTimeInput(changeEvent.target.value),
                      })
                    }
                    required
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Título
                <input
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={editingEvent.title}
                  onChange={(changeEvent) => setEditingEvent({ ...editingEvent, title: changeEvent.target.value })}
                  autoFocus
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Descrição
                <textarea
                  className="mt-1 block min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={editingEvent.description ?? ''}
                  onChange={(changeEvent) => setEditingEvent({ ...editingEvent, description: changeEvent.target.value })}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Local
                <input
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={editingEvent.location ?? ''}
                  onChange={(changeEvent) => setEditingEvent({ ...editingEvent, location: changeEvent.target.value })}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Cor
                <input
                  className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-1 py-1"
                  type="color"
                  value={editingEvent.color ?? '#2563eb'}
                  onChange={(changeEvent) => setEditingEvent({ ...editingEvent, color: changeEvent.target.value })}
                />
              </label>
            </div>

            {formError && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {formError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {editingEvent.id && (
                <button
                  type="button"
                  className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  onClick={() => void handleEventDelete()}
                  disabled={isSaving}
                >
                  Excluir evento
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  type="checkbox"
                  checked={editingEvent.all_day}
                  onChange={(changeEvent) =>
                    setEditingEvent({ ...editingEvent, all_day: changeEvent.target.checked })
                  }
                />
                Dia inteiro
              </label>
                </button>
              )}
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setEditingEvent(null)}
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
      )}
    </div>
  )
}
