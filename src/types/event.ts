export interface IEvent {
  id: string
  title: string
  description?: string
  location?: string
  all_day: boolean
  start_date: string
  end_date: string
  color?: string
  label?: string
  reminder_minutes?: number
  recurrence_rule?: string
  created_at?: string
  updated_at?: string
}
