import {
  createConsumption,
  fetchAllMeterReadings,
  fetchBillingPeriods,
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
      expect(fetchMock.lastJsonBody()).toEqual({
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
      expect(fetchMock.lastJsonBody().household_id).toBe(7)
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
      expect(fetchMock.lastJsonBody().household_id).toBe(42)
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
      expect(fetchMock.lastJsonBody()).toEqual({ reading_date: '2026-10-02', reading_kwh: 310.5 })
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
