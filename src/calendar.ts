/**
 * Утилита: открыть системный календарь с предзаполненным событием.
 * 
 * Android (Samsung Calendar) понимает URL:
 *   https://calendar.google.com/calendar/r/eventedit?text=...&dates=...&details=...
 * 
 * Если у пользователя дефолтный Google Calendar — откроется он.
 * Если Samsung Calendar (по умолчанию на Samsung) — обычно есть выбор.
 * 
 * Для полноценной интеграции (через Calendar Provider) нужно нативное приложение.
 */
export interface CalendarEvent {
  title: string
  description?: string
  start: Date
  duration_minutes?: number
  location?: string
}

export function buildCalendarUrl(e: CalendarEvent): string {
  const end = new Date(e.start.getTime() + (e.duration_minutes ?? 60) * 60_000)
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${fmt(e.start)}/${fmt(end)}`,
    details: e.description ?? '',
    location: e.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function openInCalendar(e: CalendarEvent): void {
  window.open(buildCalendarUrl(e), '_blank', 'noopener')
}
