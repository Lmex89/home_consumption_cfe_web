import { act, renderHook, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { installFetchMock } from '../test/fetchMock'
import { useHouseholds } from './useHouseholds'

// La selección del Hogar activo es responsabilidad de quien usa el hook:
// este arnés reproduce ese contrato sin pedirle al hook que la administre.
function useHogaresDelDashboard() {
  const { households, isLoading, error } = useHouseholds()
  const [activeHousehold, setActiveHousehold] = useState(null)

  return {
    households,
    isLoading,
    error,
    activeHousehold,
    selectHousehold: setActiveHousehold,
  }
}

describe('useHouseholds — carga de Hogares', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = installFetchMock()
  })

  afterEach(() => {
    fetchMock.restore()
    vi.restoreAllMocks()
  })

  it('inicia cargando y entrega los Hogares que responde el backend', async () => {
    fetchMock.on('GET', '/households', {
      json: [
        { id: 1, name: 'Casa' },
        { id: 2, name: 'Departamento' },
      ],
    })

    const { result } = renderHook(() => useHouseholds())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.households).toEqual([])
    expect(result.current.error).toBe('')

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.households).toEqual([
      { value: 1, label: '1 - Casa' },
      { value: 2, label: '2 - Departamento' },
    ])
    expect(result.current.error).toBe('')
  })

  it('registra el error y deja de cargar cuando falla la red', async () => {
    fetchMock.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => useHouseholds())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('No fue posible cargar los households.')
    expect(result.current.households).toEqual([])
  })

  it('permite elegir el Hogar activo a partir de la lista cargada', async () => {
    fetchMock.on('GET', '/households', {
      json: [
        { id: 1, name: 'Casa' },
        { id: 2, name: 'Departamento' },
      ],
    })

    const { result } = renderHook(() => useHogaresDelDashboard())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeHousehold).toBeNull()

    act(() => {
      result.current.selectHousehold(result.current.households[0])
    })

    expect(result.current.activeHousehold).toEqual({
      value: 1,
      label: '1 - Casa',
    })
  })

  it('no actualiza el estado ni registra errores si se desmonta antes de la respuesta', async () => {
    let resolveFetch
    fetchMock.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { unmount } = renderHook(() => useHouseholds())
    unmount()

    await act(async () => {
      resolveFetch(
        new Response(JSON.stringify([{ id: 1, name: 'Casa' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(consoleError).not.toHaveBeenCalled()
  })
})
