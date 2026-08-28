/** Converte valor de input datetime-local para ISO-UTC para armazenamento */
export const toIsoStorage = (dateValue: string): string => {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

/** Converte ISO-UTC do banco para valor de input datetime-local (horário local) */
export const fromIsoStorage = (dateValue: string): string => {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}`
}

/** Converte ISO-UTC do banco para valor de input date (YYYY-MM-DD local) */
export const toDateInput = (dateValue: string): string => {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Converte valor de input date para ISO-UTC para armazenamento */
export const fromDateInput = (dateValue: string): string =>
  dateValue ? toIsoStorage(`${dateValue}T00:00:00`) : ''
