import { apiEndpoints, buildApiUrl } from '../config/apiConfig'
import { requestApi } from '../lib/apiClient'
import { fetchBillingPeriods, normalizeBillingPeriods, normalizeReading } from './consumoService'

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeDashboardReading(reading) {
  return {
    id: reading.id,
    date: reading.reading_date,
    readingKwh: toNumber(reading.reading_kwh),
    consumptionSinceLast:
      reading.consumption_since_last === null || reading.consumption_since_last === undefined
        ? null
        : toNumber(reading.consumption_since_last),
    estimatedCost:
      reading.billing_period_cost?.total_cost === null ||
      reading.billing_period_cost?.total_cost === undefined
        ? null
        : toNumber(reading.billing_period_cost.total_cost),
    billing_period_cost: reading.billing_period_cost,
  }
}

function buildSummary(items) {
  const total = items.reduce((accumulator, item) => accumulator + item.kWh, 0)
  const current = items.at(-1)?.kWh ?? 0
  const previous = items.at(-2)?.kWh ?? 0
  const values = items.map((item) => item.kWh)
  const firstKwh = items[0]?.kWh ?? 0
  const lastKwh = items.at(-1)?.kWh ?? 0

  return {
    total,
    current,
    previous,
    average: 0, // calculated separately below
    max: values.length > 0 ? Math.max(...values) : 0,
    min: values.length > 0 ? Math.min(...values) : 0,
    difference: current - previous,
    currentDate: items.at(-1)?.fecha ?? 'Sin fecha',
    accumulated: lastKwh - firstKwh,
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
    cfeBreakdown: costDashboard.cfe_breakdown ?? null,
  }
}


export async function loadDashboardData({ householdId, billingPeriodId, periods, startDate, endDate }, requester = requestApi) {
  const rawPeriods = periods ?? await fetchBillingPeriods(householdId, requester)
  const billingPeriods = normalizeBillingPeriods(rawPeriods)
  const now = new Date()
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  const active = billingPeriods.find((period) => period.value === Number(billingPeriodId))
    ?? billingPeriods.find((period) => period.startDate <= today && today <= period.endDate)
    ?? billingPeriods[0]
  const resolvedId = active?.value ?? null
  const rawReadings = await requester(apiEndpoints.meterReadings, {
    query: {
      household_id: Number(householdId),
      reading_date_from: active?.startDate ?? startDate,
      reading_date_to: active?.endDate ?? endDate,
      limit: 500,
      offset: 0,
    },
  })
  const items = (Array.isArray(rawReadings) ? rawReadings : [])
    .map(normalizeReading).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const [cost, history] = resolvedId == null ? [null, null] : await Promise.all([
    Promise.resolve().then(() => requester(apiEndpoints.billingPeriodDashboard(resolvedId))).catch(() => null),
    Promise.resolve().then(() => requester(apiEndpoints.meterReadingsDashboard(householdId), {
      query: { billing_period_id: resolvedId },
    })).catch(() => null),
  ])
  const readings = (Array.isArray(history?.readings) ? history.readings : [])
    .map(normalizeDashboardReading).sort((a, b) => a.date.localeCompare(b.date))
  return {
    periods: rawPeriods,
    billingPeriods,
    billingPeriodId: resolvedId,
    endpoint: buildApiUrl(apiEndpoints.meterReadings),
    items,
    summary: { ...buildSummary(items), average: calculateAverageExcludingLast(items) },
    billing: buildBilling(cost),
    chart: { readings },
  }
}
