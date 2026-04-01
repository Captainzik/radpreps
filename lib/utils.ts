import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumberWithDecimal = (num: number): string => {
  const [int, decimal] = num.toString().split('.')
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : int
}
// PROMPT: [ChatGTP] create toSlug ts arrow function that convert text to lowercase, remove non-word, non-whitespace, non-hyphen characters, replace whitespace, trim leading hyphens and trim trailing hyphens

export const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Returns the current ISO week period string in the format "YYYY-week-NN"
 * Example: "2025-week-10"
 * Uses UTC to ensure consistent week numbering regardless of timezone
 */
export function getCurrentWeekPeriod(): string {
  const now = new Date()

  // Get year and start of the year in UTC
  const year = now.getUTCFullYear()
  const startOfYear = new Date(Date.UTC(year, 0, 1))

  // Calculate days since start of year
  const daysPassed = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
  )

  // ISO week number (week 1 = first week with Thursday in January)
  // Adjust to make week 1 the first full week
  const weekNumber = Math.ceil((daysPassed + startOfYear.getUTCDay() + 1) / 7)

  return `${year}-week-${weekNumber.toString().padStart(2, '0')}`
}

/**
 * Returns the current month period string in the format "YYYY-month-MM"
 * Example: "2025-month-03"
 */
export function getCurrentMonthPeriod(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-month-${month}`
}

/**
 * Returns the previous week period (useful for "last week" leaderboard)
 */
export function getPreviousWeekPeriod(): string {
  const now = new Date()
  now.setUTCDate(now.getUTCDate() - 7) // go back 7 days
  const year = now.getUTCFullYear()
  const startOfYear = new Date(Date.UTC(year, 0, 1))
  const daysPassed = Math.floor(
    (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
  )
  const weekNumber = Math.ceil((daysPassed + startOfYear.getUTCDay() + 1) / 7)
  return `${year}-week-${weekNumber.toString().padStart(2, '0')}`
}

/**
 * Returns a list of recent periods (last 5 weeks) – useful for dropdowns
 */
export function getRecentWeekPeriods(count = 5): string[] {
  const periods: string[] = []
  const current = new Date()

  for (let i = 0; i < count; i++) {
    const year = current.getUTCFullYear()
    const startOfYear = new Date(Date.UTC(year, 0, 1))
    const daysPassed = Math.floor(
      (current.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
    )
    const weekNumber = Math.ceil((daysPassed + startOfYear.getUTCDay() + 1) / 7)
    periods.push(`${year}-week-${weekNumber.toString().padStart(2, '0')}`)
    current.setUTCDate(current.getUTCDate() - 7)
  }

  return periods
}

// Optional: human-readable version
export function formatPeriod(period: string): string {
  if (period.includes('-week-')) {
    const [year, , week] = period.split('-')
    return `Week ${week} of ${year}`
  }
  if (period.includes('-month-')) {
    const [year, , month] = period.split('-')
    const monthName = new Date(2025, Number(month) - 1, 1).toLocaleString(
      'default',
      { month: 'long' },
    )
    return `${monthName} ${year}`
  }
  return period
}
