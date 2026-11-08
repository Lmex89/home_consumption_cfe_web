import { installFetchMock } from '../test/fetchMock'
import {
  createHousehold,
  createHouseholdTariff,
  createHouseholdWithTariff,
  createTariff,
  createTariffRange,
  createTariffVersion,
  deleteTariffRange,
  deleteTariffVersion,
  listHouseholds,
  listTariffRanges,
  listTariffs,
  listTariffVersions,
  updateTariffRange,
  updateTariffVersion,
} from './householdService'

function lastBody(fetchMock) {
  return JSON.parse(fetchMock.lastCall().body)
}

describe('householdService — Hogares', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = installFetchMock()
  })

  afterEach(() => {
    fetchMock.restore()
  })

  describe('listHouseholds', () => {
    it('consulta los Hogares con limit=500 y offset=0', async () => {
      fetchMock.on('GET', '/households', { json: [] })

      await listHouseholds()

      const url = new URL(fetchMock.lastCall().url)
      expect(fetchMock.lastCall().method).toBe('GET')
      expect(url.pathname.endsWith('/households')).toBe(true)
      expect(url.searchParams.get('limit')).toBe('500')
      expect(url.searchParams.get('offset')).toBe('0')
    })

    it('mapea cada Hogar a una opción con su id y nombre', async () => {
      fetchMock.on('GET', '/households', {
        json: [
          { id: 1, name: 'Casa' },
          { id: 2, name: 'Departamento' },
        ],
      })

      const households = await listHouseholds()

      expect(households).toEqual([
        { value: 1, label: '1 - Casa' },
        { value: 2, label: '2 - Departamento' },
      ])
    })

    it('etiqueta con el id cuando el Hogar no tiene nombre', async () => {
      fetchMock.on('GET', '/households', {
        json: [
          { id: 3, name: null },
          { id: 4 },
        ],
      })

      const households = await listHouseholds()

      expect(households).toEqual([
        { value: 3, label: '3' },
        { value: 4, label: '4' },
      ])
    })

    it('devuelve una lista vacía cuando el backend no responde un arreglo', async () => {
      fetchMock.on('GET', '/households', { json: { items: [] } })

      await expect(listHouseholds()).resolves.toEqual([])
    })
  })

  describe('listTariffs', () => {
    it('mapea código y descripción de cada Tarifa', async () => {
      fetchMock.on('GET', '/tariffs', {
        json: [{ id: 7, code: '1', description: 'Tarifa básica' }],
      })

      const tariffs = await listTariffs()

      expect(tariffs).toEqual([
        {
          value: 7,
          label: '1 - Tarifa básica',
          code: '1',
          description: 'Tarifa básica',
        },
      ])
    })

    it('devuelve una lista vacía cuando el backend no responde un arreglo', async () => {
      fetchMock.on('GET', '/tariffs', { json: null })

      await expect(listTariffs()).resolves.toEqual([])
    })
  })

  describe('createTariff', () => {
    it('envía el código y la descripción sin espacios sobrantes', async () => {
      fetchMock.on('POST', '/tariffs', { status: 201, json: { id: 7, code: '1' } })

      const result = await createTariff('  1  ', '  Tarifa básica  ')

      expect(fetchMock.lastCall().method).toBe('POST')
      expect(lastBody(fetchMock)).toEqual({ code: '1', description: 'Tarifa básica' })
      expect(result).toEqual({ success: true, tariff: { id: 7, code: '1' } })
    })

    it('envía null cuando la descripción está en blanco y cadena vacía en el código', async () => {
      fetchMock.on('POST', '/tariffs', { status: 201, json: { id: 7 } })

      await createTariff('   ', '   ')

      expect(lastBody(fetchMock)).toEqual({ code: '', description: null })
    })
  })

  describe('createHousehold', () => {
    it('envía el nombre del Hogar sin espacios sobrantes', async () => {
      fetchMock.on('POST', '/households', { status: 201, json: { id: 1, name: 'Casa' } })

      const result = await createHousehold('  Casa  ')

      expect(fetchMock.lastCall().method).toBe('POST')
      expect(lastBody(fetchMock)).toEqual({ name: 'Casa' })
      expect(result).toEqual({ success: true, household: { id: 1, name: 'Casa' } })
    })

    it('envía null cuando el nombre está en blanco', async () => {
      fetchMock.on('POST', '/households', { status: 201, json: { id: 1 } })

      await createHousehold('   ')

      expect(lastBody(fetchMock)).toEqual({ name: null })
    })
  })

  describe('createHouseholdTariff', () => {
    it('envía la asociación en snake_case con end_date null cuando no hay fecha final', async () => {
      fetchMock.on('POST', '/household-tariffs', { status: 201, json: { id: 9 } })

      const result = await createHouseholdTariff(7, 3, '2026-01-01')

      expect(fetchMock.lastCall().method).toBe('POST')
      expect(lastBody(fetchMock)).toEqual({
        household_id: 7,
        tariff_id: 3,
        start_date: '2026-01-01',
        end_date: null,
      })
      expect(result).toEqual({ success: true, householdTariff: { id: 9 } })
    })
  })

  describe('createHouseholdWithTariff', () => {
    it('crea el Hogar primero y usa su id en la asociación con la Tarifa', async () => {
      fetchMock.on('POST', '/households', {
        status: 201,
        json: { id: 42, name: 'Casa' },
      })
      fetchMock.on('POST', '/household-tariffs', { status: 201, json: { id: 9 } })

      const result = await createHouseholdWithTariff('Casa', 3, '2026-01-01')

      expect(fetchMock.calls).toHaveLength(2)
      expect(lastBody(fetchMock)).toEqual({
        household_id: 42,
        tariff_id: 3,
        start_date: '2026-01-01',
        end_date: null,
      })
      expect(result).toEqual({
        success: true,
        household: { id: 42, name: 'Casa' },
        householdTariff: { id: 9 },
      })
    })
  })

  describe('Capa de normalización de Tarifas', () => {
    it('normaliza las Versiones de tarifa de snake_case a camelCase', async () => {
      fetchMock.on('GET', '/tariff-versions', {
        json: [
          {
            id: 8,
            tariff_id: 5,
            start_date: '2026-01-01',
            end_date: '2026-02-01',
            created_at: '2025-12-01T10:00:00',
            updated_at: '2025-12-02T11:00:00',
          },
        ],
      })

      const versions = await listTariffVersions(5)

      const url = new URL(fetchMock.lastCall().url)
      expect(url.searchParams.get('tariff_id')).toBe('5')
      expect(versions).toEqual([
        {
          id: 8,
          tariffId: 5,
          startDate: '2026-01-01',
          endDate: '2026-02-01',
          createdAt: '2025-12-01T10:00:00',
          updatedAt: '2025-12-02T11:00:00',
        },
      ])
    })

    it('normaliza los Rangos de tarifa de snake_case a camelCase', async () => {
      fetchMock.on('GET', '/tariff-ranges', {
        json: [
          {
            id: 10,
            tariff_version_id: 8,
            range_min: 0,
            range_max: 150,
            price_per_kwh: 1.25,
            created_at: '2025-12-01T10:00:00',
            updated_at: '2025-12-02T11:00:00',
          },
          {
            id: 11,
            tariff_version_id: 8,
            range_min: 150,
            range_max: null,
            price_per_kwh: 2.5,
            created_at: '2025-12-01T10:00:00',
            updated_at: '2025-12-02T11:00:00',
          },
        ],
      })

      const ranges = await listTariffRanges(8)

      const url = new URL(fetchMock.lastCall().url)
      expect(url.searchParams.get('tariff_version_id')).toBe('8')
      expect(ranges).toEqual([
        {
          id: 10,
          tariffVersionId: 8,
          rangeMin: 0,
          rangeMax: 150,
          pricePerKwh: 1.25,
          createdAt: '2025-12-01T10:00:00',
          updatedAt: '2025-12-02T11:00:00',
        },
        {
          id: 11,
          tariffVersionId: 8,
          rangeMin: 150,
          rangeMax: null,
          pricePerKwh: 2.5,
          createdAt: '2025-12-01T10:00:00',
          updatedAt: '2025-12-02T11:00:00',
        },
      ])
    })
  })

  describe('createTariffVersion', () => {
    it('envía la Versión de tarifa en snake_case con end_date null cuando no hay fecha final', async () => {
      fetchMock.on('POST', '/tariff-versions', { status: 201, json: { id: 8 } })

      const result = await createTariffVersion(5, '2026-01-01')

      expect(fetchMock.lastCall().method).toBe('POST')
      expect(lastBody(fetchMock)).toEqual({
        tariff_id: 5,
        start_date: '2026-01-01',
        end_date: null,
      })
      expect(result).toEqual({ success: true, tariffVersion: { id: 8 } })
    })
  })

  describe('updateTariffVersion', () => {
    it('actualiza la Versión de tarifa por id y convierte la fecha final vacía en null', async () => {
      fetchMock.on('PUT', '/tariff-versions/8', { json: { id: 8 } })

      const result = await updateTariffVersion(8, '2026-01-05', '')

      expect(fetchMock.lastCall().method).toBe('PUT')
      expect(fetchMock.lastCall().url).toContain('/tariff-versions/8')
      expect(lastBody(fetchMock)).toEqual({ start_date: '2026-01-05', end_date: null })
      expect(result).toEqual({ success: true, tariffVersion: { id: 8 } })
    })
  })

  describe('deleteTariffVersion', () => {
    it('elimina la Versión de tarifa por id con DELETE', async () => {
      fetchMock.on('DELETE', '/tariff-versions/8', { status: 204 })

      const result = await deleteTariffVersion(8)

      expect(fetchMock.lastCall().method).toBe('DELETE')
      expect(fetchMock.lastCall().url).toContain('/tariff-versions/8')
      expect(result).toEqual({ success: true })
    })
  })

  describe('createTariffRange', () => {
    it('envía el Rango en snake_case con los valores numéricos convertidos', async () => {
      fetchMock.on('POST', '/tariff-ranges', { status: 201, json: { id: 10 } })

      const result = await createTariffRange(5, '0', '150', '1.75')

      expect(fetchMock.lastCall().method).toBe('POST')
      expect(lastBody(fetchMock)).toEqual({
        tariff_version_id: 5,
        range_min: 0,
        range_max: 150,
        price_per_kwh: 1.75,
      })
      expect(result).toEqual({ success: true, tariffRange: { id: 10 } })
    })

    it('envía range_max null cuando el máximo está vacío', async () => {
      fetchMock.on('POST', '/tariff-ranges', { status: 201, json: { id: 10 } })

      await createTariffRange(5, '150', '', '2.5')

      expect(lastBody(fetchMock)).toEqual({
        tariff_version_id: 5,
        range_min: 150,
        range_max: null,
        price_per_kwh: 2.5,
      })
    })
  })

  describe('updateTariffRange', () => {
    it('actualiza el Rango por id con números y range_max null cuando el máximo está vacío', async () => {
      fetchMock.on('PUT', '/tariff-ranges/10', { json: { id: 10 } })

      const result = await updateTariffRange(10, '10', '', '2.5')

      expect(fetchMock.lastCall().method).toBe('PUT')
      expect(fetchMock.lastCall().url).toContain('/tariff-ranges/10')
      expect(lastBody(fetchMock)).toEqual({
        range_min: 10,
        range_max: null,
        price_per_kwh: 2.5,
      })
      expect(result).toEqual({ success: true, tariffRange: { id: 10 } })
    })
  })

  describe('deleteTariffRange', () => {
    it('elimina el Rango por id con DELETE', async () => {
      fetchMock.on('DELETE', '/tariff-ranges/10', { status: 204 })

      const result = await deleteTariffRange(10)

      expect(fetchMock.lastCall().method).toBe('DELETE')
      expect(fetchMock.lastCall().url).toContain('/tariff-ranges/10')
      expect(result).toEqual({ success: true })
    })
  })

  describe('errores del backend', () => {
    it('propaga el detalle al consultar los Hogares', async () => {
      fetchMock.on('GET', '/households', {
        status: 500,
        json: { detail: 'Servicio no disponible.' },
      })

      await expect(listHouseholds()).rejects.toThrow('Servicio no disponible.')
    })

    it('propaga el detalle al crear un Hogar', async () => {
      fetchMock.on('POST', '/households', {
        status: 422,
        json: { detail: 'El nombre del Hogar es obligatorio.' },
      })

      await expect(createHousehold('')).rejects.toThrow('El nombre del Hogar es obligatorio.')
    })
  })
})
