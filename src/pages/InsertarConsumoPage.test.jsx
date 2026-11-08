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
