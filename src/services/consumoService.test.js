import {
  createConsumption,
  fetchAllMeterReadings,
  fetchBillingPeriods,
  getDashboardConsumptions,
  listBillingPeriods,
  updateConsumption,
} from './consumoService'
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

function jsonBody(call) {
  return JSON.parse(call.body)
}

function isMeterReadingsList(url) {
  return url.includes('/meter-readings') && !url.includes('/dashboards/')
}

describe('consumoService', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = installFetchMock()
  })

  afterEach(() => {
    fetchMock.restore()
  })

  describe('createConsumption', () => {
    it('envía el payload en snake_case y normaliza la Lectura creada', async () => {
      fetchMock.on('POST', '/meter-readings', {
        status: 201,
        json: lecturaApi({
          id: 99,
          reading_date: '2026-11-05',
          reading_kwh: '54.6',
          is_initial: true,
        }),
      })

      const result = await createConsumption({
        householdId: 1,
        fecha: '2026-11-05',
        kWh: '54.6',
        isInitial: true,
      })

      expect(result.success).toBe(true)
      expect(result.endpoint).toContain('/meter-readings')
      expect(result.item).toEqual({
        id: 99,
        householdId: 1,
        fecha: '2026-11-05',
        kWh: 54.6,
        note: 'Lectura inicial',
        isInitial: true,
      })

      const call = fetchMock.lastCall()
      expect(call.method).toBe('POST')
      expect(jsonBody(call)).toEqual({
        household_id: 1,
        reading_date: '2026-11-05',
        reading_kwh: 54.6,
        is_initial: true,
      })
      expect(fetchMock.calls).toHaveLength(1)
    })

    it('resuelve el Hogar por defecto desde /households cuando no se envía householdId', async () => {
      fetchMock.on('GET', '/households', { json: [{ id: 7, name: 'Casa' }] })
      fetchMock.on('POST', '/meter-readings', {
        status: 201,
        json: lecturaApi({ id: 99, household_id: 7 }),
      })

      await createConsumption({ fecha: '2026-11-05', kWh: 54.6 })

      expect(fetchMock.calls.map((call) => call.method)).toEqual(['GET', 'POST'])
      expect(fetchMock.calls[0].url).toContain('/households')
      expect(jsonBody(fetchMock.lastCall()).household_id).toBe(7)
    })

    it('resuelve el Hogar desde la primera Lectura cuando no hay Hogares', async () => {
      fetchMock.on('GET', '/households', { json: [] })
      fetchMock.on('GET', '/meter-readings', {
        json: [lecturaApi({ id: 3, household_id: 42 })],
      })
      fetchMock.on('POST', '/meter-readings', {
        status: 201,
        json: lecturaApi({ id: 100, household_id: 42 }),
      })

      await createConsumption({ fecha: '2026-11-05', kWh: '54.6' })

      expect(fetchMock.calls.map((call) => call.method)).toEqual(['GET', 'GET', 'POST'])
      expect(fetchMock.calls[1].url).toContain('/meter-readings')
      expect(fetchMock.calls[1].url).toContain('limit=1')
      expect(jsonBody(fetchMock.lastCall()).household_id).toBe(42)
    })

    it('rechaza el registro cuando no existe ningún Hogar disponible', async () => {
      fetchMock.on('GET', '/households', { json: [] })
      fetchMock.on('GET', '/meter-readings', { json: [] })

      await expect(
        createConsumption({ fecha: '2026-11-05', kWh: 54.6 }),
      ).rejects.toThrow('No existe ningun hogar disponible para registrar lecturas.')

      expect(fetchMock.calls).toHaveLength(2)
      expect(fetchMock.calls.every((call) => call.method === 'GET')).toBe(true)
    })
  })

  describe('updateConsumption', () => {
    it('actualiza la Lectura con PUT y devuelve el item normalizado', async () => {
      fetchMock.on('PUT', '/meter-readings/12', {
        json: lecturaApi({
          id: 12,
          reading_date: '2026-10-02',
          reading_kwh: '310.5',
        }),
      })

      const result = await updateConsumption(12, { fecha: '2026-10-02', kWh: '310.5' })

      expect(result.success).toBe(true)
      expect(result.item).toEqual({
        id: 12,
        householdId: 1,
        fecha: '2026-10-02',
        kWh: 310.5,
        note: '',
        isInitial: false,
      })

      const call = fetchMock.lastCall()
      expect(call.method).toBe('PUT')
      expect(call.url).toContain('/meter-readings/12')
      expect(jsonBody(call)).toEqual({ reading_date: '2026-10-02', reading_kwh: 310.5 })
    })
  })

  describe('fetchAllMeterReadings', () => {
    it('consulta el Hogar activo, ordena por fecha ascendente y normaliza las Lecturas', async () => {
      fetchMock.on('GET', '/meter-readings', {
        json: [
          lecturaApi({ id: 3, reading_date: '2026-11-01', reading_kwh: '420' }),
          lecturaApi({ id: 1, reading_date: '2026-09-01', reading_kwh: '120', is_initial: true }),
          lecturaApi({ id: 2, reading_date: '2026-10-01', reading_kwh: '300' }),
        ],
      })

      const items = await fetchAllMeterReadings(1)

      expect(items.map((item) => item.id)).toEqual([1, 2, 3])
      expect(items[0]).toEqual({
        id: 1,
        householdId: 1,
        fecha: '2026-09-01',
        kWh: 120,
        note: 'Lectura inicial',
        isInitial: true,
      })

      const call = fetchMock.lastCall()
      expect(call.url).toContain('household_id=1')
      expect(call.url).toContain('limit=10000')
    })
  })

  describe('getDashboardConsumptions', () => {
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
        (url) => url.includes('/dashboards/household/'),
        historyStatus === 200
          ? { json: history }
          : { status: historyStatus, json: { detail: 'Historial no disponible' } },
      )
      fetchMock.on(
        'GET',
        (url) => isMeterReadingsList(url) && url.includes('reading_date_from='),
        { json: periodReadings },
      )
      fetchMock.on('GET', isMeterReadingsList, { json: readings })
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

      const dashboard = await getDashboardConsumptions({ householdId: 1, billingPeriodId: 2 })

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

      const dashboard = await getDashboardConsumptions({ householdId: 1, billingPeriodId: 2 })

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

      const dashboard = await getDashboardConsumptions({ householdId: 1, billingPeriodId: 2 })

      expect(dashboard.chart.readings).toEqual([])
    })

    it('degrada el Desglose a ceros cuando falla el costo del Periodo activo', async () => {
      mockDashboardRoutes({
        readings: [lecturaApi({ id: 10, reading_date: '2026-10-05', reading_kwh: '200' })],
        periods: [period],
        costStatus: 500,
      })

      const dashboard = await getDashboardConsumptions({ householdId: 1, billingPeriodId: 2 })

      expect(dashboard.billing).toEqual({
        totalMxn: 0,
        breakdown: [],
        periodId: null,
        tariffCode: 'N/D',
      })
    })

    it('elige el Periodo activo más reciente cuando no se envía billingPeriodId', async () => {
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

      const dashboard = await getDashboardConsumptions({ householdId: 1 })

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

  describe('fetchBillingPeriods', () => {
    it('devuelve [] cuando el backend no responde un arreglo', async () => {
      fetchMock.on('GET', '/billing-periods', { json: { results: [] } })

      await expect(fetchBillingPeriods(1)).resolves.toEqual([])
    })
  })

  describe('listBillingPeriods', () => {
    it('ordena los Periodos del más reciente al más antiguo y arma las opciones', async () => {
      fetchMock.on('GET', '/billing-periods', {
        json: [
          { id: 1, start_date: '2026-08-01', end_date: '2026-09-30' },
          { id: 3, start_date: '2026-12-01', end_date: '2027-01-30' },
          { id: 2, start_date: '2026-10-01', end_date: '2026-11-30' },
        ],
      })

      const options = await listBillingPeriods(1)

      expect(options).toEqual([
        {
          value: 3,
          label: '2026-12-01 - 2027-01-30',
          startDate: '2026-12-01',
          endDate: '2027-01-30',
        },
        {
          value: 2,
          label: '2026-10-01 - 2026-11-30',
          startDate: '2026-10-01',
          endDate: '2026-11-30',
        },
        {
          value: 1,
          label: '2026-08-01 - 2026-09-30',
          startDate: '2026-08-01',
          endDate: '2026-09-30',
        },
      ])
      expect(fetchMock.lastCall().url).toContain('household_id=1')
    })

    it('devuelve [] sin consultar cuando no hay Hogar activo', async () => {
      await expect(listBillingPeriods(null)).resolves.toEqual([])
      expect(fetchMock.calls).toHaveLength(0)
    })
  })
})
