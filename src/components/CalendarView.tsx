import type { DateSelectArg, EventChangeArg, EventClickArg, EventInput } from '@fullcalendar/core'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import useSQLite from '../hooks/useSQLite'
import { createEvent, deleteEvent, getAllEvents, updateEvent } from '../utils/eventService'
import { expandRecurringEvent } from '../utils/recurrenceService'
import { parseIcalContent } from '../utils/icalService'
import { AffiliateFooter } from './AffiliateBanner'
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
const NOTIFICATION_CACHE_KEY = 'webcal-fired-reminders'

const getRemindersCache = (): Set<string> => {
  if (typeof window === 'undefined') {
    return new Set()
  }

  try {
    const stored = window.localStorage.getItem(NOTIFICATION_CACHE_KEY)
    const parsed = stored ? (JSON.parse(stored) as string[]) : []

    return new Set(parsed)
  } catch {
    return new Set()
  }
}

const saveRemindersCache = (reminders: Set<string>) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(NOTIFICATION_CACHE_KEY, JSON.stringify([...reminders]))
  } catch {
    // Ignore storage quota issues while the app is still usable.
  }
}

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
  const [icalImportData, setIcalImportData] = useState<ReturnType<typeof parseIcalContent> | null>(null)
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLabel, setFilterLabel] = useState<string | null>(null)
  const firedRemindersRef = useRef<Set<string>>(getRemindersCache())

  const allLabels = [...new Set(eventRecords.map((e) => e.label ?? 'Agenda').filter(Boolean))]

  const expandedEventRecords = eventRecords.flatMap(expandRecurringEvent)

  const filteredEventRecords = expandedEventRecords.filter((event) => {
    if (filterLabel && (event.label ?? 'Agenda') !== filterLabel) {
      return false
    }

    if (!searchQuery.trim()) {
      return true
    }

    const query = searchQuery.toLowerCase()

    return (
      event.title.toLowerCase().includes(query) ||
      (event.description ?? '').toLowerCase().includes(query) ||
      (event.location ?? '').toLowerCase().includes(query)
    )
  })

  const filteredEvents = events.filter((event) => filteredEventRecords.some((er) => er.id === event.id))

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
        loadedEvents.flatMap(expandRecurringEvent).map((event) => ({
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

  const playAlertSound = () => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return
    }

    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.3)
    gainNode.gain.setValueAtTime(0.08, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  const triggerHapticFeedback = () => {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
      return
    }

    try {
      navigator.vibrate([200, 100, 200])
    } catch {
      // Vibration may be blocked by the browser or absent.
    }
  }

  const showReminderNotification = useCallback((event: IEvent) => {
    const reminderMinutes = event.reminder_minutes ?? 0
    const reminderText = reminderMinutes > 0 ? `Lembrete ${reminderMinutes} min antes` : 'Lembrete do evento'
    const scheduledAt = new Date(event.start_date)
    const timeLabel = scheduledAt.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

    playAlertSound()
    triggerHapticFeedback()
    setNotificationMessage(`Lembrete: ${event.title} — ${timeLabel} (${reminderText})`)
  }, [])

  const triggerTestNotification = useCallback(() => {
    const testEvent: IEvent = {
      id: 'demo-reminder',
      title: 'Teste de lembrete',
      description: 'Aviso interno do app',
      location: '',
      all_day: false,
      start_date: new Date(Date.now() + 60_000).toISOString(),
      end_date: new Date(Date.now() + 120_000).toISOString(),
      color: '#2563eb',
      reminder_minutes: 1,
    }

    showReminderNotification(testEvent)
    setNotificationMessage('Teste de lembrete interno enviado. O banner do app apareceu para simular o aviso.')
  }, [showReminderNotification])

  useEffect(() => {
    const syncCache = () => saveRemindersCache(firedRemindersRef.current)

    window.addEventListener('beforeunload', syncCache)

    return () => {
      window.removeEventListener('beforeunload', syncCache)
      syncCache()
    }
  }, [])

  useEffect(() => {
    if (!reminderEnabled || !eventRecords.length) {
      return
    }

    // Grace window covers reminders due while the tab was closed, reloaded or backgrounded.
    const GRACE_WINDOW_MS = 5 * 60 * 1000

    const checkReminders = () => {
      const now = Date.now()
      const nextReminders = new Set(firedRemindersRef.current)
      let hasNewReminder = false

      eventRecords.forEach((event) => {
        const reminderMinutes = event.reminder_minutes ?? 0
        const reminderAt = new Date(event.start_date).getTime() - reminderMinutes * 60 * 1000
        const reminderKey = `${event.id}-${reminderMinutes}-${event.start_date}`

        if (!Number.isFinite(reminderAt) || nextReminders.has(reminderKey)) {
          return
        }

        if (now >= reminderAt && now <= reminderAt + GRACE_WINDOW_MS) {
          nextReminders.add(reminderKey)
          hasNewReminder = true
          showReminderNotification(event)
        }
      })

      if (hasNewReminder) {
        firedRemindersRef.current = nextReminders
        saveRemindersCache(nextReminders)
      }
    }

    checkReminders()
    const intervalId = window.setInterval(checkReminders, 10_000)
    document.addEventListener('visibilitychange', checkReminders)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', checkReminders)
    }
  }, [eventRecords, reminderEnabled, showReminderNotification])

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id
    const selectedEvent = eventRecords.find(
      (event) => event.id === eventId || event.id === clickInfo.event.extendedProps.original_event_id,
    )

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

    const reminderMinutes = Number(editingEvent.reminder_minutes ?? 0)
    const startDate = new Date(editingEvent.start_date)
    const endDate = new Date(editingEvent.end_date)
    const isSameDayAllDayEvent = editingEvent.all_day && endDate.getTime() >= startDate.getTime()

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      (!editingEvent.all_day && endDate <= startDate) ||
      (editingEvent.all_day && !isSameDayAllDayEvent && endDate < startDate)
    ) {
      setFormError(
        editingEvent.all_day
          ? 'Informe datas válidas. Para evento do dia inteiro, a data final pode ser igual à inicial.'
          : 'Informe datas válidas. O fim precisa ser depois do início.',
      )
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
        reminder_minutes: reminderMinutes,
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

  const handleIcalImport = async (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const file = changeEvent.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const parsed = parseIcalContent(text)

      setIcalImportData(parsed)
    } catch (importFailure) {
      const message = importFailure instanceof Error ? importFailure.message : 'Falha ao importar o arquivo ICS.'
      setImportError(message)
    } finally {
      changeEvent.target.value = ''
    }
  }

  const handleConfirmIcalImport = async () => {
    if (!icalImportData || !db) {
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      for (const event of icalImportData) {
        await createEvent(executeQuery, {
          title: event.title,
          description: event.description,
          location: event.location,
          all_day: event.all_day,
          start_date: event.start_date,
          end_date: event.end_date,
          color: event.recurrence_rule ? '#8b5cf6' : '#2563eb',
          label: 'Importado',
          reminder_minutes: 10,
          recurrence_rule: event.recurrence_rule,
        })
      }

      setIcalImportData(null)
      await loadEvents()
    } catch (importFailure) {
      const message = importFailure instanceof Error ? importFailure.message : 'Falha ao importar eventos do calendário.'
      setImportError(message)
    } finally {
      setIsImporting(false)
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
        <div className="mobile-actions grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
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
          <label className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-2 text-center text-[11px] font-semibold leading-tight text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:px-4 sm:text-sm">
            <span>Importar ICS</span>
            <input
              className="sr-only"
              type="file"
              accept=".ics,.ical,text/calendar"
              onChange={(changeEvent) => void handleIcalImport(changeEvent)}
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
          <button
            type="button"
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-[11px] font-semibold leading-tight text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:px-4 sm:text-sm"
            onClick={() => {
              setReminderEnabled((previous) => !previous)
              setNotificationMessage(
                reminderEnabled
                  ? 'Lembretes internos desativados.'
                  : 'Lembretes internos ativados. O app vai avisar quando o compromisso estiver próximo.',
              )
            }}
          >
            {reminderEnabled ? 'Lembretes ativos' : 'Ativar lembretes'}
          </button>
          <button
            type="button"
            className="w-full rounded-md border border-blue-200 bg-blue-50 px-2 py-2 text-[11px] font-semibold leading-tight text-blue-700 shadow-sm transition hover:bg-blue-100 sm:w-auto sm:px-4 sm:text-sm"
            onClick={() => void triggerTestNotification()}
          >
            Testar aviso
          </button>
        </div>
      </div>

      {notificationMessage && (
        <div className="fixed left-4 right-4 top-4 z-50 mx-auto flex max-w-2xl animate-reminder-pulse items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 shadow-lg">
          <span aria-hidden="true" className="mt-0.5 text-lg">
            🔔
          </span>
          <p className="flex-1" role="status">
            {notificationMessage}
          </p>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            onClick={() => setNotificationMessage(null)}
          >
            Fechar
          </button>
        </div>
      )}

      {importError && (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          Não foi possível importar o backup: {importError}
        </p>
      )}

      {/* Busca e filtros */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative flex-1">
          <input
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="search"
            placeholder="Buscar eventos por título, descrição ou local..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto"
          value={filterLabel ?? ''}
          onChange={(e) => setFilterLabel(e.target.value || null)}
        >
          <option value="">Todas as categorias</option>
          {allLabels.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
        {(searchQuery || filterLabel) && (
          <button
            type="button"
            className="whitespace-nowrap text-sm font-medium text-slate-500 hover:text-slate-800"
            onClick={() => {
              setSearchQuery('')
              setFilterLabel(null)
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="calendar-shell overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={ptBrLocale}
          initialView="dayGridMonth"
          selectable
          editable
          selectMirror
          events={filteredEvents}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            omitZeroMinute: false,
          }}
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

      <AffiliateFooter />

      {icalImportData && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/40 p-4"
          role="presentation"
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.target === mouseEvent.currentTarget && !isSaving) {
              setIcalImportData(null)
            }
          }}
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-600">Importar calendário</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {icalImportData.length} evento{icalImportData.length !== 1 ? 's' : ''} encontrado{icalImportData.length !== 1 ? 's' : ''}
                </h2>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
                onClick={() => setIcalImportData(null)}
              >
                Cancelar
              </button>
            </div>
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {icalImportData.slice(0, 50).map((event, index) => (
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
              {icalImportData.length > 50 && (
                <p className="text-center text-xs text-slate-400">
                  ...e mais {icalImportData.length - 50} evento{icalImportData.length - 50 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setIcalImportData(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleConfirmIcalImport()}
                disabled={isImporting}
              >
                {isImporting ? 'Importando...' : `Importar ${icalImportData.length} evento${icalImportData.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

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
                Lembrete
                <select
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={editingEvent.reminder_minutes ?? 0}
                  onChange={(changeEvent) =>
                    setEditingEvent({
                      ...editingEvent,
                      reminder_minutes: Number(changeEvent.target.value),
                    })
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
                  onChange={(changeEvent) =>
                    setEditingEvent({
                      ...editingEvent,
                      recurrence_rule: changeEvent.target.value,
                    })
                  }
                >
                  <option value="">Não repetir</option>
                  <option value="FREQ=DAILY;INTERVAL=1">Diariamente</option>
                  <option value="FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR">Dias úteis</option>
                  <option value="FREQ=WEEKLY;INTERVAL=1">Semanalmente</option>
                  <option value="FREQ=MONTHLY;INTERVAL=1">Mensalmente</option>
                </select>
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
              <div className="flex items-center gap-3">
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
                {editingEvent.id && (
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                    onClick={() => void handleEventDelete()}
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
