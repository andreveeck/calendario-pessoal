import type { DateSelectArg, EventChangeArg, EventClickArg } from '@fullcalendar/core'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useCallback, useEffect, useMemo, useState } from 'react'

import useSQLite from '../hooks/useSQLite'
import { useEventsManager } from '../hooks/useEventsManager'
import { useReminders } from '../hooks/useReminders'
import { parseIcalContent } from '../utils/icalService'
import { getCurrentAndNextYearHolidays, holidaysToEventInputs } from '../utils/holidays'
import { toDateInput } from '../utils/dateUtils'
import { AffiliateFooter } from './AffiliateBanner'
import { CalendarToolbar } from './CalendarToolbar'
import { ReminderBanner } from './ReminderBanner'
import { SearchBar } from './SearchBar'
import { EventEditorModal } from './EventEditorModal'
import { IcalImportModal } from './IcalImportModal'
import type { IEvent } from '../types/event'

type ImportedEvent = ReturnType<typeof parseIcalContent>[number]

export default function CalendarView() {
  const { loading, error, db, executeQuery, exportDatabase, importDatabase } = useSQLite()
  const {
    eventRecords,
    expandedEventRecords,
    isRefreshing,
    loadEvents,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
  } = useEventsManager(db, executeQuery)

  const {
    reminderEnabled,
    setReminderEnabled,
    notificationMessage,
    setNotificationMessage,
    triggerTestNotification,
  } = useReminders(eventRecords)

  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [icalImportData, setIcalImportData] = useState<ImportedEvent[] | null>(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLabel, setFilterLabel] = useState<string | null>(null)
  const [showHolidays, setShowHolidays] = useState(true)

  const holidayEvents = useMemo(() => {
    if (!showHolidays) return []
    return holidaysToEventInputs(getCurrentAndNextYearHolidays())
  }, [showHolidays])

  const allLabels = useMemo(
    () => [...new Set(eventRecords.map((e) => e.label ?? 'Agenda').filter(Boolean))],
    [eventRecords],
  )

  const filteredEventRecords = useMemo(() => {
    return expandedEventRecords.filter((event) => {
      if (filterLabel && (event.label ?? 'Agenda') !== filterLabel) return false

      if (!searchQuery.trim()) return true

      const query = searchQuery.toLowerCase()
      return (
        event.title.toLowerCase().includes(query) ||
        (event.description ?? '').toLowerCase().includes(query) ||
        (event.location ?? '').toLowerCase().includes(query)
      )
    })
  }, [expandedEventRecords, filterLabel, searchQuery])

  // Eventos do FullCalendar — derivados dos filtrados
  const filteredEvents = useMemo(() => {
    return filteredEventRecords.map((event) => {
      let start: string = event.start_date
      let end: string | undefined = event.end_date

      if (event.all_day) {
        const startDateStr = toDateInput(event.start_date)
        const endDateStr = toDateInput(event.end_date)
        start = startDateStr

        if (startDateStr === endDateStr || !endDateStr) {
          end = undefined
        } else {
          const nextDay = new Date(`${endDateStr}T00:00:00`)
          nextDay.setDate(nextDay.getDate() + 1)
          end = toDateInput(nextDay.toISOString())
        }
      }

      return {
        id: event.id,
        title: event.title,
        start,
        end,
        allDay: event.all_day,
        extendedProps: {
          description: event.description,
          location: event.location,
          original_event_id: (event as { original_event_id?: string }).original_event_id,
        },
        backgroundColor: event.color ?? '#3b82f6',
        borderColor: event.color ?? '#2563eb',
        textColor: '#ffffff',
      }
    })
  }, [filteredEventRecords])

  // Listener de viewport mobile
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleViewportChange = () => setIsMobile(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleViewportChange)

    return () => mediaQuery.removeEventListener('change', handleViewportChange)
  }, [])

  // Handlers
  const handleDateSelect = useCallback(
    (selectionInfo: DateSelectArg) => {
      if (!db) return

      setFormError(null)

      let startIso: string
      let endIso: string

      if (selectionInfo.allDay) {
        const year = selectionInfo.start.getFullYear()
        const month = selectionInfo.start.getMonth()
        const day = selectionInfo.start.getDate()

        const defaultStart = new Date(year, month, day, 9, 0, 0, 0)
        const defaultEnd = new Date(year, month, day, 10, 0, 0, 0)

        startIso = defaultStart.toISOString()
        endIso = defaultEnd.toISOString()
      } else {
        startIso = selectionInfo.start.toISOString()
        endIso = selectionInfo.end.toISOString()
      }

      setEditingEvent({
        id: '',
        title: 'Novo evento',
        description: '',
        location: '',
        all_day: false,
        start_date: startIso,
        end_date: endIso,
        color: '#2563eb',
        label: 'Agenda',
        reminder_minutes: 10,
        recurrence_rule: '',
      })
    },
    [db],
  )

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const eventId = clickInfo.event.id
      const selectedEvent = eventRecords.find(
        (event) => event.id === eventId || event.id === clickInfo.event.extendedProps.original_event_id,
      )

      if (selectedEvent) {
        setFormError(null)
        setEditingEvent(selectedEvent)
      }
    },
    [eventRecords],
  )

  const handleEventChange = useCallback(
    async ({ event }: EventChangeArg) => {
      if (!event.start || !event.end) return

      const originalId = (event.extendedProps.original_event_id as string | undefined) ?? event.id

      await handleUpdateEvent(originalId, {
        all_day: event.allDay,
        start_date: event.start.toISOString(),
        end_date: event.end.toISOString(),
      })
    },
    [handleUpdateEvent],
  )

  const handleEventSubmit = useCallback(
    async (eventData: IEvent) => {
      setIsSaving(true)
      setFormError(null)

      try {
        if (eventData.id) {
          await handleUpdateEvent(eventData.id, eventData)
        } else {
          await handleCreateEvent(eventData)
        }
        setEditingEvent(null)
      } finally {
        setIsSaving(false)
      }
    },
    [handleCreateEvent, handleUpdateEvent],
  )

  const handleEventDelete = useCallback(async () => {
    if (!editingEvent || !window.confirm(`Excluir o evento "${editingEvent.title}"?`)) return

    setIsSaving(true)

    try {
      await handleDeleteEvent(editingEvent.id)
      setEditingEvent(null)
    } finally {
      setIsSaving(false)
    }
  }, [editingEvent, handleDeleteEvent])

  const handleExportDatabase = useCallback(() => {
    const databaseBytes = exportDatabase()

    if (!databaseBytes) return

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
  }, [exportDatabase])

  const handleImportDatabase = useCallback(
    async (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
      const backupFile = changeEvent.target.files?.[0]

      if (!backupFile) return

      if (
        !window.confirm(
          'Restaurar um backup substituirá todos os dados atuais. Deseja continuar?',
        )
      ) {
        changeEvent.target.value = ''
        return
      }

      setIsImporting(true)
      setImportError(null)

      try {
        await importDatabase(await backupFile.arrayBuffer())
      } catch (importFailure) {
        const message =
          importFailure instanceof Error ? importFailure.message : 'Falha ao importar o backup.'
        setImportError(message)
      } finally {
        setIsImporting(false)
        changeEvent.target.value = ''
      }
    },
    [importDatabase],
  )

  const handleIcalImport = useCallback(async (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
    const file = changeEvent.target.files?.[0]

    if (!file) return

    try {
      const text = await file.text()
      const parsed = parseIcalContent(text)
      setIcalImportData(parsed)
    } catch (importFailure) {
      const message =
        importFailure instanceof Error
          ? importFailure.message
          : 'Falha ao importar o arquivo ICS.'
      setImportError(message)
    } finally {
      changeEvent.target.value = ''
    }
  }, [])

  const handleConfirmIcalImport = useCallback(
    async (events: ImportedEvent[]) => {
      if (!db) return

      setIsImporting(true)
      setImportError(null)

      try {
        for (const event of events) {
          await handleCreateEvent({
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
      } catch (importFailure) {
        const message =
          importFailure instanceof Error
            ? importFailure.message
            : 'Falha ao importar eventos do calendário.'
        setImportError(message)
      } finally {
        setIsImporting(false)
      }
    },
    [db, handleCreateEvent],
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-700">
        Carregando banco local...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-600">
        Erro: {error}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:p-6">
      {/* Header + Toolbar */}
      <div className="mb-4 flex flex-col items-start gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">WebCal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-3xl">
            Calendário Offline
          </h1>
        </div>
        <CalendarToolbar
          db={db}
          isImporting={isImporting}
          isRefreshing={isRefreshing}
          reminderEnabled={reminderEnabled}
          showHolidays={showHolidays}
          onImportBackup={handleImportDatabase}
          onImportIcal={handleIcalImport}
          onExportBackup={handleExportDatabase}
          onRefresh={() => void loadEvents()}
          onToggleReminder={() => {
            const nextEnabled = !reminderEnabled
            setReminderEnabled(nextEnabled)
            setNotificationMessage(
              reminderEnabled
                ? 'Lembretes internos desativados.'
                : 'Lembretes internos ativados. O app vai avisar quando o compromisso estiver próximo.',
            )
          }}
          onToggleHolidays={() => setShowHolidays((p) => !p)}
          onTestNotification={() => void triggerTestNotification()}
        />
      </div>

      {/* Notification Banner */}
      {notificationMessage && (
        <ReminderBanner
          message={notificationMessage}
          onDismiss={() => setNotificationMessage(null)}
        />
      )}

      {/* Import Error */}
      {importError && (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          Não foi possível importar o backup: {importError}
        </p>
      )}

      {/* Search & Filters */}
      <SearchBar
        searchQuery={searchQuery}
        filterLabel={filterLabel}
        allLabels={allLabels}
        onSearchChange={setSearchQuery}
        onFilterChange={setFilterLabel}
        onClearFilters={() => {
          setSearchQuery('')
          setFilterLabel(null)
        }}
      />

      {/* Calendar */}
      <div className="calendar-shell overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={ptBrLocale}
          initialView="dayGridMonth"
          selectable
          editable
          selectMirror
          events={[...filteredEvents, ...holidayEvents]}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            omitZeroMinute: false,
          }}
          select={handleDateSelect}
          dateClick={(arg) => {
            handleDateSelect({
              start: arg.date,
              end: arg.date,
              startStr: arg.dateStr,
              endStr: arg.dateStr,
              allDay: arg.allDay,
              jsEvent: arg.jsEvent,
              view: arg.view,
            })
          }}
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

      {/* ICS Import Modal */}
      {icalImportData && (
        <IcalImportModal
          data={icalImportData}
          isImporting={isImporting}
          onClose={() => setIcalImportData(null)}
          onConfirm={handleConfirmIcalImport}
        />
      )}

      {/* Event Editor Modal */}
      {editingEvent && (
        <EventEditorModal
          editingEvent={editingEvent}
          isSaving={isSaving}
          formError={formError}
          onClose={() => setEditingEvent(null)}
          onSubmit={(e) => void handleEventSubmit(e)}
          onDelete={() => void handleEventDelete()}
          onUpdate={setEditingEvent}
        />
      )}
    </div>
  )
}
