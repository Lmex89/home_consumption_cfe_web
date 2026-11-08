import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddTariffPage from './AddTariffPage'
import { installFetchMock } from '../test/fetchMock'

describe('Página de alta de Tarifas', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = installFetchMock()
  })

  afterEach(() => {
    fetchMock.restore()
  })

  it('muestra el detalle del backend cuando crear la Tarifa falla', async () => {
    fetchMock.on('GET', '/tariffs', { json: [] })
    fetchMock.on('POST', '/tariffs', {
      status: 500,
      json: { detail: 'La tarifa ya existe' },
    })
    const user = userEvent.setup()

    render(<AddTariffPage />)

    await user.click(await screen.findByText('Crear nueva tarifa'))
    await user.type(
      await screen.findByLabelText('Código de tarifa'),
      'DAC',
    )
    await user.click(screen.getByRole('button', { name: 'Crear tarifa' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('La tarifa ya existe')
  })
})
