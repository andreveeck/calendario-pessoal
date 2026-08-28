/**
 * Feriados nacionais brasileiros.
 * Inclui feriados fixos e móveis (baseados na Páscoa).
 */

/** Calcula a data da Páscoa (algoritmo de Meeus/Jones/Butcher) */
function easterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

function daysBefore(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

function daysAfter(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface Holiday {
  date: string // YYYY-MM-DD
  name: string
  color: string
}

const HOLIDAY_COLOR = '#059669' // emerald-600

/**
 * Retorna os feriados nacionais brasileiros para um determinado ano.
 */
export function getBrazilianHolidays(year: number): Holiday[] {
  const easter = easterDate(year)

  const fixed: Holiday[] = [
    { date: formatDate(new Date(year, 0, 1)), name: 'Confraternização Universal', color: HOLIDAY_COLOR },
    { date: formatDate(new Date(year, 3, 21)), name: 'Tiradentes', color: HOLIDAY_COLOR },
    { date: formatDate(new Date(year, 4, 1)), name: 'Dia do Trabalho', color: HOLIDAY_COLOR },
    { date: formatDate(new Date(year, 8, 7)), name: 'Independência do Brasil', color: HOLIDAY_COLOR },
    { date: formatDate(new Date(year, 9, 12)), name: 'Nossa Senhora Aparecida', color: HOLIDAY_COLOR },
    { date: formatDate(new Date(year, 10, 2)), name: 'Finados', color: HOLIDAY_COLOR },
    { date: formatDate(new Date(year, 10, 15)), name: 'Proclamação da República', color: HOLIDAY_COLOR },
    { date: formatDate(new Date(year, 11, 25)), name: 'Natal', color: HOLIDAY_COLOR },
  ]

  const movable: Holiday[] = [
    { date: formatDate(daysBefore(easter, 48)), name: 'Carnaval', color: HOLIDAY_COLOR },
    { date: formatDate(daysBefore(easter, 47)), name: 'Carnaval', color: HOLIDAY_COLOR },
    { date: formatDate(daysBefore(easter, 2)), name: 'Sexta-feira Santa', color: HOLIDAY_COLOR },
    { date: formatDate(daysAfter(easter, 60)), name: 'Corpus Christi', color: HOLIDAY_COLOR },
  ]

  return [...fixed, ...movable].sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Retorna feriados para o ano atual e o próximo (para cobrir meses de transição).
 */
export function getCurrentAndNextYearHolidays(): Holiday[] {
  const currentYear = new Date().getFullYear()
  return [...getBrazilianHolidays(currentYear), ...getBrazilianHolidays(currentYear + 1)]
}

/**
 * Converte feriados para formato EventInput do FullCalendar.
 */
export function holidaysToEventInputs(holidays: Holiday[]) {
  return holidays.map((holiday) => ({
    id: `holiday-${holiday.date}`,
    title: holiday.name,
    start: holiday.date,
    allDay: true,
    display: 'background' as const,
    backgroundColor: holiday.color + '33', // 20% opacity
    borderColor: holiday.color,
    textColor: holiday.color,
    extendedProps: {
      isHoliday: true,
    },
  }))
}
