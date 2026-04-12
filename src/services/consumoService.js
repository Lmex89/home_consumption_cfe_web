import { apiEndpoints, backendConfig, buildApiUrl } from '../config/apiConfig'
import { requestApi } from '../lib/apiClient'

const LIMITS = {
  households: 500,
  billingPeriods: 200,
  default: 1,
  dashboardReadings: 500,
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeReading(reading) {
  return {
    id: reading.id,
    householdId: reading.household_id,
    fecha: reading.reading_date,
    kWh: toNumber(reading.reading_kwh),
    note: reading.is_initial ? 'Lectura inicial' : '',
    isInitial: Boolean(reading.is_initial),
  }
}

function buildSummary(items) {
  const total = items.reduce((accumulator, item) => accumulator + item.kWh, 0)
  const current = items.at(-1)?.kWh ?? 0
  const previous = items.at(-2)?.kWh ?? 0
  const values = items.map((item) => item.kWh)

  return {
    total,
    current,
    previous,
    average: 0, // calculated separately below
    max: values.length > 0 ? Math.max(...values) : 0,
    min: values.length > 0 ? Math.min(...values) : 0,
    difference: current - previous,
    currentDate: items.at(-1)?.fecha ?? 'Sin fecha',
  }
}

function calculateAverageExcludingLast(items) {
  // Use the period baseline and exclude the latest reading from the displayed average.
  const baseline = items[0]?.kWh ?? 0
  const nonInitialItems = items.slice(0, -1).filter((item) => !item.isInitial)
  if (nonInitialItems.length === 0) return 0
  const sum = nonInitialItems.reduce((acc, item) => acc + item.kWh, 0)
  return sum / nonInitialItems.length - baseline
}

function buildBilling(costDashboard) {
  if (!costDashboard) {
    return {
      totalMxn: 0,
      breakdown: [],
      periodId: null,
      tariffCode: 'N/D',
    }
  }

  return {
    totalMxn: toNumber(costDashboard.total_cost),
    breakdown: [
      {
        // Note: "witout" is a typo in the backend API; kept to match backend field name.
        concept: 'Subtotal sin impuestos',
        amount: toNumber(costDashboard.total_cost_witout_taxes),
      },
      { concept: 'IVA', amount: toNumber(costDashboard.iva) },
      { concept: 'DAP', amount: toNumber(costDashboard.dap) },
    ],
    periodId: costDashboard.billing_period_id,
    tariffCode: costDashboard.tariff_code,
  }
}

async function getLatestBillingPeriodId(householdId) {
  const periods = await fetchBillingPeriods(householdId)

  if (!Array.isArray(periods) || periods.length === 0) {
    return null
  }

  const sortedPeriods = [...periods].sort(
    (left, right) => new Date(left.end_date).getTime() - new Date(right.end_date).getTime(),
  )

  return sortedPeriods.at(-1)?.id ?? null
}

export async function fetchBillingPeriods(householdId) {
  const periods = await requestApi(apiEndpoints.billingPeriods, {
    query: {
      household_id: householdId,
      limit: LIMITS.billingPeriods,
      offset: 0,
    },
  })

  return Array.isArray(periods) ? periods : []
}

function formatPeriodOption(period) {
  const start = period.start_date || 'N/A'
  const end = period.end_date || 'N/A'
  return `${start} - ${end}`
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

export async function getDashboardConsumptions(filters = {}) {
  const householdFilter = filters.householdId ? Number(filters.householdId) : undefined
  const billingPeriodFilter = filters.billingPeriodId ? Number(filters.billingPeriodId) : undefined

  const rawReadings = await requestApi(apiEndpoints.meterReadings, {
    query: {
      household_id: householdFilter,
      billing_period_id: billingPeriodFilter,
      reading_date_from: filters.startDate,
      reading_date_to: filters.endDate,
      limit: LIMITS.dashboardReadings,
      offset: 0,
    },
  })

  const items = (Array.isArray(rawReadings) ? rawReadings : [])
    .map(normalizeReading)
    .sort((left, right) => left.fecha.localeCompare(right.fecha))

  const summary = buildSummary(items)
  const householdId = householdFilter ?? items.at(-1)?.householdId ?? items[0]?.householdId ?? null
  let costDashboard = null
  let billingPeriodId = billingPeriodFilter ?? null
  let billingPeriodDates = null

  if (householdId) {
    if (!billingPeriodId) {
      billingPeriodId = await getLatestBillingPeriodId(householdId)
    }

    if (billingPeriodId) {
      try {
        costDashboard = await requestApi(apiEndpoints.billingPeriodDashboard(billingPeriodId))
      } catch {
        costDashboard = null
      }

      // Fetch billing period dates to get all readings within the period range
      const periods = await fetchBillingPeriods(householdId)
      const period = periods.find((p) => p.id === billingPeriodId)
      if (period) {
        billingPeriodDates = {
          start: period.start_date,
          end: period.end_date,
        }
      }
    }
  }

  // Fetch all readings for the household within the billing period date range
  // to calculate the average excluding the last reading
  let averageFromPeriodReadings = calculateAverageExcludingLast(items)
  if (householdId && billingPeriodDates) {
    const periodReadingsRaw = await requestApi(apiEndpoints.meterReadings, {
      query: {
        household_id: householdId,
        reading_date_from: billingPeriodDates.start,
        reading_date_to: billingPeriodDates.end,
        limit: LIMITS.dashboardReadings,
        offset: 0,
      },
    })

    const periodReadings = (Array.isArray(periodReadingsRaw) ? periodReadingsRaw : [])
      .map(normalizeReading)
      .sort((left, right) => left.fecha.localeCompare(right.fecha))

    averageFromPeriodReadings = calculateAverageExcludingLast(periodReadings)
  }

  return {
    endpoint: buildApiUrl(apiEndpoints.meterReadings),
    items,
    summary: {
      ...summary,
      average: averageFromPeriodReadings,
    },
    billing: buildBilling(costDashboard),
  }
}

export async function listBillingPeriods(householdId) {
  if (!householdId) {
    return []
  }

  const periods = await fetchBillingPeriods(householdId)

  const sortedPeriods = [...periods].sort(
    (left, right) => new Date(right.end_date).getTime() - new Date(left.end_date).getTime(),
  )

  return sortedPeriods.map((period) => ({
    value: period.id,
    label: formatPeriodOption(period),
  }))
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