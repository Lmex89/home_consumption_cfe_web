import { loadDashboardData } from './dashboardData'
import { installFetchMock } from '../test/fetchMock'

function lecturaApi(overrides = {}) {
  return {
    id: 1,
    household_id: 1,
    reading_date: '2026-09-01',
    reading_kwh: '120',
    is_initial: false,
    ...overrides,
  }
}

describe('Contrato HTTP del Dashboard', () => {
  let fetchMock
  beforeEach(() => { localStorage.clear(); fetchMock = installFetchMock() })
  afterEach(() => fetchMock.restore())

  describe('loadDashboardData', () => {
    function mockDashboardRoutes({
      readings,
      periodReadings = readings,
      periods = [],
      cost = {},
      history = { readings: [] },
      costStatus = 200,
      historyStatus = 200,
    }) {
      fetchMock.on(
        'GET',
        '/dashboards/household/',
        historyStatus === 200
          ? { json: history }
          : { status: historyStatus, json: { detail: 'Historial no disponible' } },
      )
      // Las rutas se evalúan en orden y gana la primera subcadena que coincide:
      // el historial ya quedó arriba y la consulta filtrada por fechas se
      // distingue del listado general por el parámetro reading_date_from.
      fetchMock.on('GET', 'reading_date_from=', { json: periodReadings })
      fetchMock.on('GET', '/meter-readings', { json: readings })
      fetchMock.on('GET', '/billing-periods', { json: periods })
      fetchMock.on(
        'GET',
        '/dashboards/billing-period/',
        costStatus === 200 ? { json: cost } : { status: costStatus, json: { detail: 'Costo no disponible' } },
      )
    }

    const period = { id: 2, household_id: 1, start_date: '2026-10-01', end_date: '2026-11-30' }

    it('ordena las Lecturas del Periodo activo y calcula el resumen, el Desglose y el historial', async () => {
      mockDashboardRoutes({
        readings: [
          lecturaApi({ id: 9, reading_date: '2026-09-01', reading_kwh: '100', is_initial: true }),
          lecturaApi({ id: 10, reading_date: '2026-10-05', reading_kwh: '200' }),
          lecturaApi({ id: 11, reading_date: '2026-10-20', reading_kwh: '260' }),
          lecturaApi({ id: 12, reading_date: '2026-11-10', reading_kwh: '330' }),
        ],
        periodReadings: [
          lecturaApi({ id: 12, reading_date: '2026-11-10', reading_kwh: '330' }),
          lecturaApi({ id: 10, reading_date: '2026-10-05', reading_kwh: '200' }),
          lecturaApi({ id: 11, reading_date: '2026-10-20', reading_kwh: '260' }),
        ],
        periods: [period, { id: 1, household_id: 1, start_date: '2026-08-01', end_date: '2026-09-30' }],
        cost: {
          total_cost: '1234.56',
          total_cost_witout_taxes: '1063.41',
          iva: '170.15',
          dap: '53.17',
          billing_period_id: 2,
          tariff_code: '1C',
        },
        history: { readings: [] },
      })

      const dashboard = await loadDashboardData({ householdId: 1, billingPeriodId: 2 })

      expect(dashboard.endpoint).toContain('/meter-readings')
      expect(dashboard.items.map((item) => item.id)).toEqual([10, 11, 12])
      expect(dashboard.items[0]).toEqual({
        id: 10,
        householdId: 1,
        fecha: '2026-10-05',
        kWh: 200,
        note: '',
        isInitial: false,
      })
      expect(dashboard.summary).toEqual({
        total: 790,
        current: 330,
        previous: 260,
        average: 30,
        max: 330,
        min: 200,
        difference: 70,
        currentDate: '2026-11-10',
        accumulated: 130,
      })
      expect(dashboard.billing).toMatchObject({
        totalMxn: 1234.56,
        breakdown: [
          { concept: 'Subtotal sin impuestos', amount: 1063.41 },
          { concept: 'IVA', amount: 170.15 },
          { concept: 'DAP', amount: 53.17 },
        ],
        periodId: 2,
        tariffCode: '1C',
      })

      const urls = fetchMock.calls.map((call) => call.url)
      expect(urls.some((url) => url.includes('/dashboards/billing-period/2'))).toBe(true)
      expect(
        urls.some(
          (url) =>
            url.includes('reading_date_from=2026-10-01') &&
            url.includes('reading_date_to=2026-11-30'),
        ),
      ).toBe(true)
      expect(
        urls.some(
          (url) =>
            url.includes('/dashboards/household/1/meter-readings') &&
            url.includes('billing_period_id=2'),
        ),
      ).toBe(true)
    })

    it('normaliza el historial de Lecturas y el Costo estimado para las gráficas', async () => {
      const billingPeriodCost = { total_cost: '640.00', cfe_breakdown: 'desglose' }

      mockDashboardRoutes({
        readings: [lecturaApi({ id: 10, reading_date: '2026-10-05', reading_kwh: '200' })],
        periods: [period],
        cost: { total_cost: '640.00', billing_period_id: 2, tariff_code: '1C' },
        history: {
          readings: [
            {
              id: 23,
              reading_date: '2026-11-10',
              reading_kwh: 330,
              consumption_since_last: 70,
              billing_period_cost: null,
            },
            {
              id: 21,
              reading_date: '2026-10-05',
              reading_kwh: '200',
              consumption_since_last: null,
              billing_period_cost: billingPeriodCost,
            },
            {
              id: 22,
              reading_date: '2026-10-20',
              reading_kwh: '260',
              consumption_since_last: '60',
              billing_period_cost: { total_cost: '830.5' },
            },
          ],
        },
      })

      const dashboard = await loadDashboardData({ householdId: 1, billingPeriodId: 2 })

      expect(dashboard.chart.readings).toEqual([
        {
          id: 21,
          date: '2026-10-05',
          readingKwh: 200,
          consumptionSinceLast: null,
          estimatedCost: 640,
          billing_period_cost: billingPeriodCost,
        },
        {
          id: 22,
          date: '2026-10-20',
          readingKwh: 260,
          consumptionSinceLast: 60,
          estimatedCost: 830.5,
          billing_period_cost: { total_cost: '830.5' },
        },
        {
          id: 23,
          date: '2026-11-10',
          readingKwh: 330,
          consumptionSinceLast: 70,
          estimatedCost: null,
          billing_period_cost: null,
        },
      ])
    })

    it('degrada el historial a vacío cuando falla la consulta del historial', async () => {
      mockDashboardRoutes({
        readings: [lecturaApi({ id: 10, reading_date: '2026-10-05', reading_kwh: '200' })],
        periods: [period],
        cost: { total_cost: '640.00', billing_period_id: 2, tariff_code: '1C' },
        historyStatus: 500,
      })

      const dashboard = await loadDashboardData({ householdId: 1, billingPeriodId: 2 })

      expect(dashboard.chart.readings).toEqual([])
    })

    it('degrada el Desglose a ceros cuando falla el costo del Periodo activo', async () => {
      mockDashboardRoutes({
        readings: [lecturaApi({ id: 10, reading_date: '2026-10-05', reading_kwh: '200' })],
        periods: [period],
        costStatus: 500,
      })

      const dashboard = await loadDashboardData({ householdId: 1, billingPeriodId: 2 })

      expect(dashboard.billing).toEqual({
        totalMxn: 0,
        breakdown: [],
        periodId: null,
        tariffCode: 'N/D',
      })
    })

    it('carga el Periodo activo indicado', async () => {
      mockDashboardRoutes({
        readings: [
          lecturaApi({ id: 1, reading_date: '2026-07-01', reading_kwh: '100' }),
          lecturaApi({ id: 2, reading_date: '2026-07-20', reading_kwh: '160' }),
          lecturaApi({ id: 3, reading_date: '2026-08-10', reading_kwh: '230' }),
          lecturaApi({ id: 4, reading_date: '2026-03-15', reading_kwh: '90' }),
        ],
        periodReadings: [
          lecturaApi({ id: 3, reading_date: '2026-08-10', reading_kwh: '230' }),
          lecturaApi({ id: 1, reading_date: '2026-07-01', reading_kwh: '100' }),
          lecturaApi({ id: 2, reading_date: '2026-07-20', reading_kwh: '160' }),
        ],
        periods: [
          { id: 5, household_id: 1, start_date: '2026-05-01', end_date: '2026-06-30' },
          { id: 9, household_id: 1, start_date: '2026-07-01', end_date: '2026-08-31' },
          { id: 7, household_id: 1, start_date: '2026-03-01', end_date: '2026-04-30' },
        ],
        cost: { total_cost: '500.00', billing_period_id: 9, tariff_code: '1C' },
      })

      const dashboard = await loadDashboardData({ householdId: 1, billingPeriodId: 9 })

      expect(dashboard.billing.periodId).toBe(9)
      const urls = fetchMock.calls.map((call) => call.url)
      expect(urls.some((url) => url.includes('/dashboards/billing-period/9'))).toBe(true)
      expect(
        urls.some(
          (url) =>
            url.includes('/dashboards/household/1/meter-readings') &&
            url.includes('billing_period_id=9'),
        ),
      ).toBe(true)
    })
  })

})
