import { loadDashboardData } from './dashboardData'

const periods = [
  { id: 1, start_date: '2026-01-01', end_date: '2026-02-28' },
  { id: 2, start_date: '2026-03-01', end_date: '2026-04-30' },
]
const readings = [
  { id: 4, household_id: 7, reading_date: '2026-04-01', reading_kwh: '180' },
  { id: 1, household_id: 7, reading_date: '2026-03-01', reading_kwh: '100', is_initial: true },
  { id: 3, household_id: 7, reading_date: '2026-03-20', reading_kwh: '150' },
  { id: 2, household_id: 7, reading_date: '2026-03-10', reading_kwh: '120' },
]
const cost = {
  total_cost: '116', total_cost_witout_taxes: '100', iva: '16', dap: '5',
  billing_period_id: 2, tariff_code: '1C', cfe_breakdown: { tier_lines: [{ tier_level: 1 }] },
}
const history = { readings: [
  { id: 4, reading_date: '2026-04-01', reading_kwh: '180', consumption_since_last: '30', billing_period_cost: null },
  { id: 1, reading_date: '2026-03-01', reading_kwh: '100', consumption_since_last: null, billing_period_cost: { total_cost: '25', cfe_breakdown: { tier_lines: [] } } },
] }
const expectedItems = [
  { id: 1, householdId: 7, fecha: '2026-03-01', kWh: 100, note: 'Lectura inicial', isInitial: true },
  { id: 2, householdId: 7, fecha: '2026-03-10', kWh: 120, note: '', isInitial: false },
  { id: 3, householdId: 7, fecha: '2026-03-20', kWh: 150, note: '', isInitial: false },
  { id: 4, householdId: 7, fecha: '2026-04-01', kWh: 180, note: '', isInitial: false },
]
const expectedSummary = {
  total: 550, current: 180, previous: 150, average: 35, max: 180, min: 100,
  difference: 30, currentDate: '2026-04-01', accumulated: 80,
}
const expectedBilling = {
  totalMxn: 116,
  breakdown: [
    { concept: 'Subtotal sin impuestos', amount: 100 },
    { concept: 'IVA', amount: 16 },
    { concept: 'DAP', amount: 5 },
  ],
  periodId: 2, tariffCode: '1C', cfeBreakdown: { tier_lines: [{ tier_level: 1 }] },
}
const expectedChart = { readings: [
  { id: 1, date: '2026-03-01', readingKwh: 100, consumptionSinceLast: null, estimatedCost: 25, billing_period_cost: { total_cost: '25', cfe_breakdown: { tier_lines: [] } } },
  { id: 4, date: '2026-04-01', readingKwh: 180, consumptionSinceLast: 30, estimatedCost: null, billing_period_cost: null },
] }
const emptyBilling = { totalMxn: 0, breakdown: [], periodId: null, tariffCode: 'N/D' }

function fakeRequester({ withoutPeriods = false, failCost = false, failHistory = false } = {}) {
  return async (endpoint, options) => {
    if (endpoint === '/meter-readings') {
      if (options?.query?.reading_date_from) {
        expect(options.query).toMatchObject({ household_id: 7, reading_date_from: '2026-03-01', reading_date_to: '2026-04-30' })
        return readings
      }
      return [...readings, { id: 9, household_id: 7, reading_date: '2026-01-01', reading_kwh: '10' }]
    }
    if (endpoint === '/billing-periods') return withoutPeriods ? [] : periods
    if (endpoint === '/dashboards/billing-period/2') {
      if (failCost) throw new Error('Costo no disponible')
      return cost
    }
    if (endpoint === '/dashboards/household/7/meter-readings') {
      if (failHistory) throw new Error('Historial no disponible')
      return history
    }
    throw new Error(`Solicitud inesperada: ${endpoint}`)
  }
}

describe('Paridad del Dashboard', () => {
  it('con Periodos devuelve Lecturas ordenadas, resumen, Desglose e historial completos', async () => {
    const { items, summary, billing, chart } = await loadDashboardData({ householdId: 7, billingPeriodId: 2 }, fakeRequester())
    expect({ items, summary, billing, chart }).toEqual({ items: expectedItems, summary: expectedSummary, billing: expectedBilling, chart: expectedChart })
  })

  it('sin Periodos conserva las Lecturas y devuelve Desglose e historial vacíos', async () => {
    const { items, summary, billing, chart } = await loadDashboardData({ householdId: 7 }, fakeRequester({ withoutPeriods: true }))
    expect({ items, summary, billing, chart }).toEqual({
      items: [{ id: 9, householdId: 7, fecha: '2026-01-01', kWh: 10, note: '', isInitial: false }, ...expectedItems],
      summary: { ...expectedSummary, total: 560, average: 83.33333333333333, min: 10, accumulated: 170 },
      billing: emptyBilling, chart: { readings: [] },
    })
  })

  it('conserva las Lecturas y el historial cuando falla el costo', async () => {
    const { items, summary, billing, chart } = await loadDashboardData({ householdId: 7, billingPeriodId: 2 }, fakeRequester({ failCost: true }))
    expect({ items, summary, billing, chart }).toEqual({ items: expectedItems, summary: expectedSummary, billing: emptyBilling, chart: expectedChart })
  })

  it('conserva las Lecturas y el Desglose cuando falla el historial', async () => {
    const { items, summary, billing, chart } = await loadDashboardData({ householdId: 7, billingPeriodId: 2 }, fakeRequester({ failHistory: true }))
    expect({ items, summary, billing, chart }).toEqual({ items: expectedItems, summary: expectedSummary, billing: expectedBilling, chart: { readings: [] } })
  })
})
