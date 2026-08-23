import { RRule, rrulestr, type Weekday } from 'rrule'
import type { IEvent } from '../types/event'

const MAX_INSTANCES = 400
const MAX_MONTHS_AHEAD = 12

export function expandRecurringEvent(event: IEvent): IEvent[] {
  if (!event.recurrence_rule) {
    return [event]
  }

  try {
    const rule = rrulestr(event.recurrence_rule, { forceset: false })
    const startDate = new Date(event.start_date)
    const until = new Date(startDate)
    until.setMonth(until.getMonth() + MAX_MONTHS_AHEAD)

    const occurrenceDates = rule.between(startDate, until, true, (_, index) => index < MAX_INSTANCES)

    if (occurrenceDates.length <= 1) {
      return [event]
    }

    const duration = new Date(event.end_date).getTime() - startDate.getTime()

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

const DAY_MAP: Record<string, Weekday> = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
}

export function buildRecurrenceRule(
  freq: 'daily' | 'weekly' | 'monthly',
  interval: number,
  byDay?: string[],
  until?: string,
): string {
  const freqMap = { daily: RRule.DAILY, weekly: RRule.WEEKLY, monthly: RRule.MONTHLY } as const
  const options: Record<string, unknown> = { freq: freqMap[freq], interval }

  if (byDay?.length) {
    options.byweekday = byDay.map((day) => DAY_MAP[day.toUpperCase()] ?? RRule.MO).filter(Boolean)
  }

  if (until) {
    options.until = new Date(until)
  }

  return new RRule(options).toString()
}
