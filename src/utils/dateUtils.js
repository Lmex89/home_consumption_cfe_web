/**
 * Validates that the given year/month/day combination represents a real calendar date.
 */
function isValidDate(year, month, day) {
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

/**
 * Normalizes various date input formats to a canonical ISO YYYY-MM-DD string.
 *
 * Accepts:
 *   - YYYY-MM-DD (ISO date)
 *   - YYYY/MM/DD
 *   - DD/MM/YYYY or DD-MM-YYYY
 *   - YYYY-MM-DDTHH:mm... (ISO datetime, strips time)
 *
 * Returns null if the date cannot be parsed or is invalid.
 */
export function normalizeDateValue(rawDate) {
  if (!rawDate) return null

  const value = String(rawDate).trim()
  if (!value) return null

  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch
    return isValidDate(Number(year), Number(month), Number(day))
      ? `${year}-${month}-${day}`
      : null
  }

  const yearFirstMatch = value.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (yearFirstMatch) {
    const [, year, month, day] = yearFirstMatch
    return isValidDate(Number(year), Number(month), Number(day))
      ? `${year}-${month}-${day}`
      : null
  }

  const dayFirstMatch = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/)
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch
    return isValidDate(Number(year), Number(month), Number(day))
      ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      : null
  }

  const isoDateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T/)
  if (isoDateTimeMatch) {
    const [, year, month, day] = isoDateTimeMatch
    return isValidDate(Number(year), Number(month), Number(day))
      ? `${year}-${month}-${day}`
      : null
  }

  return null
}
