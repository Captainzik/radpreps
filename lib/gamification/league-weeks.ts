/**
 * UTC week boundary helpers.
 * A "week" runs Monday 00:00:00.000 UTC → Sunday 23:59:59.999 UTC.
 */

/** Returns the Monday 00:00:00.000 UTC of the week containing `date`. */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  // getUTCDay(): 0=Sun, 1=Mon … 6=Sat  → offset to Monday
  const dayOfWeek = d.getUTCDay()
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  d.setUTCDate(d.getUTCDate() + offsetToMonday)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/** Returns the Sunday 23:59:59.999 UTC of the week containing `date`. */
export function getWeekEnd(date: Date = new Date()): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)
  end.setUTCHours(23, 59, 59, 999)
  return end
}

/** True if `date` falls in the same UTC week as `now` (defaults to today). */
export function isCurrentWeek(date: Date, now: Date = new Date()): boolean {
  return getWeekStart(date).getTime() === getWeekStart(now).getTime()
}

/** Milliseconds remaining until the current week ends. */
export function msUntilWeekEnd(now: Date = new Date()): number {
  return getWeekEnd(now).getTime() - now.getTime()
}
