import { apiEndpoints, backendConfig, buildApiUrl } from '../config/apiConfig'
import { requestApi } from '../lib/apiClient'
import {
  generateYearPeriods,
  getLatestPeriod,
  getPeriodDurationDays,
  periodsOverlap,
} from '../utils/billingPeriodUtils'

const LIMITS = {
  households: 500,
  billingPeriods: 200,
  default: 1,
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizeReading(reading) {
  return {
    id: reading.id,
    householdId: reading.household_id,
    fecha: reading.reading_date,
    kWh: toNumber(reading.reading_kwh),
    note: reading.is_initial ? 'Lectura inicial' : '',
    isInitial: Boolean(reading.is_initial),
  }
}

export async function fetchBillingPeriods(householdId, requester = requestApi) {
  const periods = await requester(apiEndpoints.billingPeriods, {
    query: {
      household_id: householdId,
      limit: LIMITS.billingPeriods,
      offset: 0,
    },
  })

  return Array.isArray(periods) ? periods : []
}

export function normalizeBillingPeriods(periods) {
  return periods.map((period) => ({
    value: period.id,
    label: `${period.start_date || 'N/A'} - ${period.end_date || 'N/A'}`,
    startDate: period.start_date,
    endDate: period.end_date,
  })).sort((left, right) => (right.endDate || '').localeCompare(left.endDate || ''))
}

async function resolveDefaultHouseholdId() {
  const households = await requestApi(apiEndpoints.households, {
    query: { limit: LIMITS.default, offset: 0 },
  })

  if (Array.isArray(households) && households.length > 0) {
    return households[0].id
  }

  const readings = await requestApi(apiEndpoints.meterReadings, {
    query: { limit: LIMITS.default, offset: 0 },
  })

  if (Array.isArray(readings) && readings.length > 0) {
    return readings[0].household_id
  }

  throw new Error('No existe ningun hogar disponible para registrar lecturas.')
}

export async function listHouseholds() {
  const households = await requestApi(apiEndpoints.households, {
    query: { limit: LIMITS.households, offset: 0 },
  })

  if (!Array.isArray(households)) {
    return []
  }

  return households.map((household) => ({
    value: household.id,
    label: household.name ? `${household.id} - ${household.name}` : String(household.id),
  }))
}

export async function listLatestPeriodReadings(householdId) {
  const period = getLatestPeriod(await fetchBillingPeriods(householdId))
  const readings = await requestApi(apiEndpoints.meterReadings, {
    query: {
      household_id: Number(householdId),
      reading_date_from: period?.start_date,
      reading_date_to: period?.end_date,
      limit: 500,
      offset: 0,
    },
  })
  return (Array.isArray(readings) ? readings : [])
    .map(normalizeReading)
    .sort((left, right) => left.fecha.localeCompare(right.fecha))
}

export async function listBillingPeriods(householdId) {
  if (!householdId) {
    return []
  }

  return normalizeBillingPeriods(await fetchBillingPeriods(householdId))
}

export async function fetchAllMeterReadings(householdId) {
  const rawReadings = await requestApi(apiEndpoints.meterReadings, {
    query: {
      household_id: householdId,
      limit: 10000,
      offset: 0,
    },
  })

  return (Array.isArray(rawReadings) ? rawReadings : [])
    .map(normalizeReading)
    .sort((left, right) => left.fecha.localeCompare(right.fecha))
}

export async function createConsumption(newConsumption) {
  const householdId = newConsumption.householdId || (await resolveDefaultHouseholdId())

  const createdReading = await requestApi(apiEndpoints.meterReadings, {
    method: 'POST',
    body: {
      household_id: householdId,
      reading_date: newConsumption.fecha,
      reading_kwh: Number(newConsumption.kWh),
      is_initial: Boolean(newConsumption.isInitial),
    },
  })

  return {
    success: true,
    endpoint: buildApiUrl(apiEndpoints.meterReadings),
    backend: backendConfig,
    item: normalizeReading(createdReading),
  }
}

export async function createBillingPeriod(householdId, startDate, endDate) {
  const createdPeriod = await requestApi(apiEndpoints.billingPeriods, {
    method: 'POST',
    body: {
      household_id: Number(householdId),
      start_date: startDate,
      end_date: endDate,
    },
  })

  return createdPeriod
}

/**
 * Bulk-creates billing periods for a full year for a household.
 *
 * Behavior:
 *   - Uses the latest existing period's duration as the template for new periods.
 *   - If no periods exist, defaults to bimonthly periods (~59 days).
 *   - Generates ranges from Jan 1 to Dec 31 of the requested year.
 *   - Skips any generated range that overlaps with an existing period.
 *   - Returns a summary of created, skipped, and failed periods.
 */
export async function createYearBillingPeriods(householdId, year = new Date().getFullYear()) {
  const existingPeriods = await fetchBillingPeriods(householdId)

  const latestPeriod = getLatestPeriod(existingPeriods)
  const durationDays = latestPeriod ? getPeriodDurationDays(latestPeriod) : 59

  const candidatePeriods = generateYearPeriods(year, durationDays)
  const periodsToCreate = candidatePeriods.filter(
    (period) => !periodsOverlap(period.start_date, period.end_date, existingPeriods),
  )

  const created = []
  const errors = []

  for (const period of periodsToCreate) {
    try {
      const createdPeriod = await createBillingPeriod(
        householdId,
        period.start_date,
        period.end_date,
      )
      created.push(createdPeriod)
    } catch (error) {
      errors.push({
        start_date: period.start_date,
        end_date: period.end_date,
        message: error.message || 'Error al crear el periodo',
      })
    }
  }

  return {
    year,
    durationDays,
    created,
    skipped: candidatePeriods.length - periodsToCreate.length,
    errors,
  }
}

export async function updateConsumption(meterReadingId, values) {
  const updatedReading = await requestApi(`${apiEndpoints.meterReadings}/${meterReadingId}`, {
    method: 'PUT',
    body: {
      reading_date: values.fecha,
      reading_kwh: Number(values.kWh),
    },
  })

  return {
    success: true,
    item: normalizeReading(updatedReading),
  }
}

export function getApiConfig() {
  return {
    backend: backendConfig,
    endpoints: {
      households: buildApiUrl(apiEndpoints.households),
      meterReadings: buildApiUrl(apiEndpoints.meterReadings),
      billingPeriods: buildApiUrl(apiEndpoints.billingPeriods),
    },
  }
}
