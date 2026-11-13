import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InsertarConsumoPage from './InsertarConsumoPage'
import { installFetchMock } from '../test/fetchMock'

describe('Página de alta de Lecturas', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = installFetchMock()
  })

  afterEach(() => {
    fetchMock.restore()
  })

  it('muestra las Lecturas del Periodo más reciente, aunque no sea el actual', async () => {
    fetchMock.on('GET', '/households', { json: [{ id: 1, name: 'Casa' }] })
    fetchMock.on('GET', '/billing-periods', { json: [
      { id: 1, start_date: '2000-01-01', end_date: '2000-02-29' },
      { id: 2, start_date: '2099-01-01', end_date: '2099-02-28' },
    ] })
    fetchMock.on('GET', '/meter-readings', { json: [
      { id: 8, household_id: 1, reading_date: '2099-01-10', reading_kwh: '123' },
    ] })

    render(<InsertarConsumoPage />)

    await screen.findByText('1 lecturas cargadas desde este flujo.')
    const readingCalls = fetchMock.calls.filter(({ url }) => url.includes('/meter-readings'))
    expect(readingCalls).toHaveLength(1)
    expect(readingCalls[0].url).toContain('reading_date_from=2099-01-01')
    expect(readingCalls[0].url).toContain('reading_date_to=2099-02-28')
  })

  it('muestra el error cuando el backend rechaza la Lectura', async () => {
    fetchMock.on('GET', '/households', { json: [{ id: 1, name: 'Casa' }] })
    fetchMock.on('GET', '/meter-readings', { json: [] })
    fetchMock.on('GET', '/billing-periods', { json: [] })
    fetchMock.on('POST', '/meter-readings', {
      status: 500,
      json: { detail: 'Lectura duplicada' },
    })
    const user = userEvent.setup()

    render(<InsertarConsumoPage />)

    await screen.findByText('Aun no hay historial cargado desde este formulario.')
    fireEvent.change(screen.getByLabelText('Fecha'), {
      target: { value: '2026-11-17' },
    })
    await user.type(screen.getByLabelText('Cantidad de kWh'), '42')
    await user.click(screen.getByRole('button', { name: /Guardar consumo/ }))

    const alert = await screen.findByRole('alert')
    expect(
      within(alert).getByText('No fue posible guardar el nuevo consumo.'),
    ).toBeInTheDocument()
  })
})
