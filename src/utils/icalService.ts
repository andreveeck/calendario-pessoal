import ICAL from 'ical.js'
import type { IEvent } from '../types/event'

type ImportedEvent = Pick<IEvent, 'title' | 'description' | 'location' | 'start_date' | 'end_date' | 'all_day' | 'recurrence_rule'>

export function parseIcalContent(icalContent: string): ImportedEvent[] {
  const jcalData = ICAL.parse(icalContent)
  const comp = new ICAL.Component(jcalData)
  const vevents = comp.getAllSubcomponents('vevent')

  return vevents.map((vevent) => {
    const event = new ICAL.Event(vevent)
    const startDate = event.startDate?.toJSDate()
    const endDate = event.endDate?.toJSDate()
    const isAllDay = event.startDate?.isDate ?? false
    const rrule = vevent.getFirstPropertyValue('rrule') as ICAL.Recur | undefined

    return {
      title: event.summary ?? 'Evento sem título',
      description: event.description ?? '',
      location: event.location ?? '',
      start_date: startDate?.toISOString() ?? '',
      end_date: endDate?.toISOString() ?? '',
      all_day: isAllDay,
      recurrence_rule: rrule ? rrule.toString() : '',
    }
  })
}
