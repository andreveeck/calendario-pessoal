import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Database, QueryExecResult, SqlValue } from 'sql.js'

import { createEvent, deleteEvent, getAllEvents, updateEvent } from '../utils/eventService'
import { expandRecurringEvent } from '../utils/recurrenceService'
import type { IEvent } from '../types/event'

type ExecuteQuery = (sql: string, params?: SqlValue[]) => Promise<QueryExecResult[]>

export function useEventsManager(db: Database | null, executeQuery: ExecuteQuery) {
  const [eventRecords, setEventRecords] = useState<IEvent[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadEvents = useCallback(async () => {
    if (!db) return

    setIsRefreshing(true)

    try {
      const loadedEvents = await getAllEvents(executeQuery)
      setEventRecords(loadedEvents)
    } finally {
      setIsRefreshing(false)
    }
  }, [db, executeQuery])

  useEffect(() => {
    queueMicrotask(() => void loadEvents())
  }, [loadEvents])

  // Expansão com useMemo — evita recálculo em toda renderização
  const expandedEventRecords = useMemo(
    () => eventRecords.flatMap(expandRecurringEvent),
    [eventRecords],
  )

  const handleCreateEvent = useCallback(
    async (eventData: Omit<IEvent, 'id' | 'created_at' | 'updated_at'>) => {
      await createEvent(executeQuery, eventData)
      await loadEvents()
    },
    [executeQuery, loadEvents],
  )

  const handleUpdateEvent = useCallback(
    async (id: string, eventData: Partial<IEvent>) => {
      await updateEvent(executeQuery, id, eventData)
      await loadEvents()
    },
    [executeQuery, loadEvents],
  )

  const handleDeleteEvent = useCallback(
    async (id: string) => {
      await deleteEvent(executeQuery, id)
      await loadEvents()
    },
    [executeQuery, loadEvents],
  )

  return {
    eventRecords,
    expandedEventRecords,
    isRefreshing,
    loadEvents,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
  }
}
