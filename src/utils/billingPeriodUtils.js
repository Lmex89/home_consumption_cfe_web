/**
 * Parses a YYYY-MM-DD string into a local-date midnight Date.
 * Using the raw string with `new Date()` can shift the date because of time zones,
 * so we explicitly build a local date from the parts.
 */
function parseLocalDate(dateString) {
  if (!dateString) return null
  const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const [, year, month, day] = match
  const parsed = new Date(Number(year), Number(month) - 1, Number(day))
  if (Number.isNaN(parsed.getTime())) return null

  return parsed
}

/**
 * Formats a Date as YYYY-MM-DD using local time values.
 */
function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns a new YYYY-MM-DD date string shifted by the given number of days.
 */
export function addDays(dateString, days) {
  const date = parseLocalDate(dateString)
  if (!date) return null

  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

/**
 * Returns the difference in days between two YYYY-MM-DD dates.
 * This matches the duration used elsewhere to generate the next period
 * (e.g. Jan 1 -> Jan 31 returns 30).
 */
export function daysBetween(startDate, endDate) {
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  if (!start || !end) return 0

  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Checks whether a new date range overlaps with any period in a list.
 * Periods are expected to have `start_date` and `end_date` in YYYY-MM-DD format.
 */
export function periodsOverlap(newStart, newEnd, existingPeriods) {
  const newStartMs = parseLocalDate(newStart)?.getTime()
  const newEndMs = parseLocalDate(newEnd)?.getTime()

  if (!newStartMs || !newEndMs || Number.isNaN(newStartMs) || Number.isNaN(newEndMs)) {
    return false
  }

  return existingPeriods.some((period) => {
    const existingStart = parseLocalDate(period.start_date)?.getTime()
    const existingEnd = parseLocalDate(period.end_date)?.getTime()
    if (!existingStart || !existingEnd) return false
    return newStartMs <= existingEnd && newEndMs >= existingStart
  })
}

/**
 * Returns the period with the latest end_date, or null if the list is empty.
 */
export function getLatestPeriod(periods) {
  if (!Array.isArray(periods) || periods.length === 0) return null

  return [...periods].sort(
    (left, right) =>
      parseLocalDate(right.end_date)?.getTime() - parseLocalDate(left.end_date)?.getTime(),
  )[0]
}

/**
 * Returns the duration in days of a single period.
 */
export function getPeriodDurationDays(period) {
  if (!period?.start_date || !period?.end_date) return 0
  return daysBetween(period.start_date, period.end_date)
}

function getToday() {
  return formatLocalDate(new Date())
}

/**
 * Suggests start/end dates for the next billing period after the latest existing one.
 * Start defaults to the latest period's end_date (user can change it).
 * If no periods exist, defaults to today.
 */
export function getSuggestedNextPeriod(periods) {
  const latest = getLatestPeriod(periods)

  if (latest) {
    const durationDays = getPeriodDurationDays(latest)
    const startDate = addDays(latest.end_date, 1)
    const endDate = addDays(startDate, durationDays)
    return { startDate, endDate, basedOnExisting: true }
  }

  const startDate = getToday()
  return { startDate, endDate: null, basedOnExisting: false }
}

/**
 * Generates billing period date ranges that cover the requested year using the given duration.
 */
export function generateYearPeriods(year, durationDays) {
  if (!year || !Number.isFinite(durationDays) || durationDays < 1) return []

  const periods = []
  const yearEnd = `${year}-12-31`
  let currentStart = `${year}-01-01`

  while (currentStart && currentStart <= yearEnd) {
    const currentEnd = addDays(currentStart, durationDays)
    if (!currentEnd) break

    periods.push({ start_date: currentStart, end_date: currentEnd })
    currentStart = addDays(currentEnd, 1)
  }

  return periods
}
