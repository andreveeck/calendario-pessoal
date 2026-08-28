import { rrulestr } from 'rrule'
import type { IEvent } from '../types/event'

const MAX_INSTANCES = 400
const MAX_MONTHS_AHEAD = 12

export function expandRecurringEvent(event: IEvent): IEvent[] {
  if (!event.recurrence_rule) {
    return [event]
  }

  try {
    const startDate = new Date(event.start_date)
    const rule = rrulestr(event.recurrence_rule, { dtstart: startDate, forceset: false })
    const until = new Date(startDate)
    until.setMonth(until.getMonth() + MAX_MONTHS_AHEAD)

    const occurrenceDates = rule.between(startDate, until, true, (_, index) => index < MAX_INSTANCES)

    if (occurrenceDates.length <= 1) {
      return [event]
    }

    const duration = Math.max(0, new Date(event.end_date).getTime() - startDate.getTime())

    return occurrenceDates.map((date, index) => {
      const endDate = new Date(date.getTime() + duration)

      return {
        ...event,
        id: index === 0 ? event.id : `${event.id}-r${index}`,
        start_date: date.toISOString(),
        end_date: endDate.toISOString(),
        original_event_id: event.id,
      }
    })
  } catch {
    return [event]
  }
}


