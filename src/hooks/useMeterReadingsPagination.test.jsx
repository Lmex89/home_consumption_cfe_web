import { act, renderHook } from '@testing-library/react'
import { installFetchMock } from '../test/fetchMock'
import { useMeterReadingsPagination } from './useMeterReadingsPagination'

function lectura(id, fecha, extras = {}) {
  return {
    id,
    householdId: 1,
    fecha,
    kWh: id,
    note: '',
    isInitial: false,
    ...extras,
  }
}

function lecturaApi(id, fecha) {
  return {
    id,
    household_id: 1,
    reading_date: fecha,
    reading_kwh: id,
    is_initial: false,
  }
}

function lecturasDelMes(cantidad) {
  return Array.from({ length: cantidad }, (_, index) => {
    const dia = String(index + 1).padStart(2, '0')
    return lectura(index + 1, `2026-11-${dia}`)
  })
}

function lecturasApiDelMes(cantidad) {
  return Array.from({ length: cantidad }, (_, index) => {
    const dia = String(index + 1).padStart(2, '0')
    return lecturaApi(index + 1, `2026-11-${dia}`)
  })
}

describe('useMeterReadingsPagination en las Lecturas', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = installFetchMock()
  })

  afterEach(() => {
    fetchMock.restore()
  })

  it('ordena las Lecturas de más reciente a más antigua y arranca en la primera página', () => {
    const periodItems = [
      lectura(1, '2026-09-01'),
      lectura(2, '2026-11-01'),
      lectura(3, '2026-10-01'),
    ]

    const { result } = renderHook(() =>
      useMeterReadingsPagination({ periodItems, householdId: 1, enableShowAll: true }),
    )

    expect(result.current.displayItems.map((item) => item.fecha)).toEqual([
      '2026-11-01',
      '2026-10-01',
      '2026-09-01',
    ])
    expect(result.current.paginationConfig).toMatchObject({
      current: 1,
      pageSize: 10,
      showSizeChanger: true,
      pageSizeOptions: ['10', '50', '100'],
    })
    expect(result.current.paginationConfig.showTotal(25)).toBe('Total 25 lecturas')
    expect(result.current.showAll).toBe(false)
    expect(result.current.isLoadingAll).toBe(false)
  })

  it('avanza a la última página y vuelve a la primera al cambiar el tamaño de página', () => {
    const periodItems = lecturasDelMes(25)

    const { result } = renderHook(() =>
      useMeterReadingsPagination({ periodItems, householdId: 1, enableShowAll: true }),
    )

    act(() => result.current.paginationConfig.onChange(3))

    expect(result.current.currentPage).toBe(3)
    expect(result.current.paginationConfig.current).toBe(3)

    act(() => result.current.paginationConfig.onShowSizeChange(3, 50))

    expect(result.current.pageSize).toBe(50)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.paginationConfig.pageSize).toBe(50)
  })

  it('deja una última página parcial cuando las Lecturas no llenan la página', () => {
    const periodItems = lecturasDelMes(23)

    const { result } = renderHook(() =>
      useMeterReadingsPagination({ periodItems, householdId: 1, enableShowAll: true }),
    )

    act(() => result.current.paginationConfig.onChange(3))

    const { current, pageSize, showTotal } = result.current.paginationConfig
    const start = (current - 1) * pageSize

    expect(current).toBe(3)
    expect(pageSize).toBe(10)
    expect(result.current.displayItems.slice(start)).toHaveLength(3)
    expect(showTotal(23)).toBe('Total 23 lecturas')
  })

  it('registra una página fuera de rango sin recortar la lista de Lecturas', () => {
    const periodItems = lecturasDelMes(23)

    const { result } = renderHook(() =>
      useMeterReadingsPagination({ periodItems, householdId: 1, enableShowAll: true }),
    )

    act(() => result.current.paginationConfig.onChange(99))

    expect(result.current.currentPage).toBe(99)
    expect(result.current.paginationConfig.current).toBe(99)
    expect(result.current.displayItems).toHaveLength(23)
    expect(result.current.displayItems[0].fecha).toBe('2026-11-23')
  })

  it('carga todas las Lecturas una sola vez con Mostrar todo y las conserva al volver', async () => {
    const periodItems = lecturasDelMes(12)
    fetchMock.on('GET', '/meter-readings', { json: lecturasApiDelMes(30).reverse() })

    const { result } = renderHook(() =>
      useMeterReadingsPagination({ periodItems, householdId: 1, enableShowAll: true }),
    )

    await act(async () => {
      await result.current.handleToggleShowAll()
    })

    expect(result.current.showAll).toBe(true)
    expect(result.current.paginationConfig).toBe(false)
    expect(result.current.displayItems).toHaveLength(30)
    expect(result.current.displayItems[0].fecha).toBe('2026-11-30')
    expect(result.current.allItems).toHaveLength(30)
    expect(fetchMock.calls).toHaveLength(1)
    expect(fetchMock.lastCall().url).toContain('household_id=1')

    await act(async () => {
      await result.current.handleToggleShowAll()
    })

    expect(result.current.showAll).toBe(false)
    expect(result.current.paginationConfig.current).toBe(1)
    expect(result.current.displayItems).toHaveLength(12)

    await act(async () => {
      await result.current.handleToggleShowAll()
    })

    expect(result.current.showAll).toBe(true)
    expect(result.current.displayItems).toHaveLength(30)
    expect(fetchMock.calls).toHaveLength(1)
  })

  it('resetPagination limpia Mostrar todo y vuelve a la primera página al cambiar el Periodo activo', async () => {
    const periodItems = lecturasDelMes(25)
    fetchMock.on('GET', '/meter-readings', { json: lecturasApiDelMes(30) })

    const { result, rerender } = renderHook(
      ({ items }) =>
        useMeterReadingsPagination({ periodItems: items, householdId: 1, enableShowAll: true }),
      { initialProps: { items: periodItems } },
    )

    act(() => result.current.paginationConfig.onChange(3))
    await act(async () => {
      await result.current.handleToggleShowAll()
    })
    expect(result.current.showAll).toBe(true)

    act(() => result.current.resetPagination())

    expect(result.current.showAll).toBe(false)
    expect(result.current.allItems).toBeNull()
    expect(result.current.currentPage).toBe(1)
    expect(result.current.displayItems).toHaveLength(25)

    act(() => result.current.paginationConfig.onChange(2))
    act(() => result.current.resetPagination())

    expect(result.current.currentPage).toBe(1)

    const siguientes = [lectura(101, '2026-12-01'), lectura(102, '2026-11-15')]
    rerender({ items: siguientes })

    expect(result.current.displayItems.map((item) => item.id)).toEqual([101, 102])
  })
})
