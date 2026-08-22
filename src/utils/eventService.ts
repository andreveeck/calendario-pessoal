import type { QueryExecResult, SqlValue } from 'sql.js'

import type { IEvent } from '../types/event'

type ExecuteQuery = (sql: string, params?: SqlValue[]) => Promise<QueryExecResult[]>

const resultToRows = (result: QueryExecResult | undefined): Record<string, SqlValue>[] =>
  result?.values.map((values) =>
    Object.fromEntries(result.columns.map((column, index) => [column, values[index]])),
  ) ?? []

const stringValue = (value: SqlValue | undefined): string | undefined =>
  value === null || value === undefined ? undefined : String(value)

const numberValue = (value: SqlValue | undefined): number | undefined => {
  const parsedValue = typeof value === 'number' ? value : Number(value)

  return value === null || value === undefined || Number.isNaN(parsedValue) ? undefined : parsedValue
}

const normalizeEvent = (row: Record<string, SqlValue>): IEvent => ({
  id: String(row.id ?? ''),
  title: String(row.title ?? ''),
  description: stringValue(row.description),
  location: stringValue(row.location),
  all_day: Boolean(row.all_day),
  start_date: String(row.start_date ?? ''),
  end_date: String(row.end_date ?? ''),
  color: stringValue(row.color),
  label: stringValue(row.label),
  reminder_minutes: numberValue(row.reminder_minutes),
  recurrence_rule: stringValue(row.recurrence_rule),
  created_at: stringValue(row.created_at),
  updated_at: stringValue(row.updated_at),
})

export async function getAllEvents(
  executeQuery: ExecuteQuery,
): Promise<IEvent[]> {
  const rows = await executeQuery('SELECT * FROM events ORDER BY start_date')

  return resultToRows(rows[0]).map((row) => normalizeEvent(row))
}

export async function getEventById(
  executeQuery: ExecuteQuery,
  id: string,
): Promise<IEvent | null> {
  const rows = await executeQuery('SELECT * FROM events WHERE id = ?', [id])
  const event = resultToRows(rows[0])[0]

  return event ? normalizeEvent(event) : null
}

export async function createEvent(
  executeQuery: ExecuteQuery,
  eventData: Omit<IEvent, 'id' | 'created_at' | 'updated_at'>,
): Promise<string> {
  const id = crypto.randomUUID()

  await executeQuery(
    `INSERT INTO events (
      id,
      title,
      description,
      location,
      all_day,
      start_date,
      end_date,
      color,
      label,
      reminder_minutes,
      recurrence_rule,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      id,
      eventData.title,
      eventData.description ?? null,
      eventData.location ?? null,
      eventData.all_day ? 1 : 0,
      eventData.start_date,
      eventData.end_date,
      eventData.color ?? null,
      eventData.label ?? null,
      eventData.reminder_minutes ?? null,
      eventData.recurrence_rule ?? null,
    ],
  )

  return id
}

export async function updateEvent(
  executeQuery: ExecuteQuery,
  id: string,
  eventData: Partial<IEvent>,
): Promise<void> {
  const fieldsToUpdate = Object.entries(eventData).filter(
    ([key]) => key !== 'id' && key !== 'created_at' && key !== 'updated_at',
  )

  if (!fieldsToUpdate.length) {
    return
  }

  const setClause = fieldsToUpdate
    .map(([key]) => `${key} = ?`)
    .join(', ')

  const params: SqlValue[] = fieldsToUpdate.map(([key, value]) => {
    if (key === 'all_day') {
      return value ? 1 : 0
    }

    return value === undefined ? null : typeof value === 'boolean' ? (value ? 1 : 0) : value
  })

  await executeQuery(
    `UPDATE events SET ${setClause}, updated_at = datetime('now') WHERE id = ?`,
    [...params, id],
  )
}

export async function deleteEvent(
  executeQuery: ExecuteQuery,
  id: string,
): Promise<void> {
  await executeQuery('DELETE FROM events WHERE id = ?', [id])
}

export async function getSettings(
  executeQuery: ExecuteQuery,
  key: string,
): Promise<string | null> {
  const rows = await executeQuery('SELECT value FROM settings WHERE key = ?', [key])
  const value = stringValue(resultToRows(rows[0])[0]?.value)

  return value ?? null
}

export async function saveSettings(
  executeQuery: ExecuteQuery,
  key: string,
  value: string,
): Promise<void> {
  await executeQuery('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
}
