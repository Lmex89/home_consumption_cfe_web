import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { message } from 'antd'
import AddTariffVersionForm from './AddTariffVersionForm'
import { createTariffVersion } from '../services/householdService'

vi.mock('../services/householdService', () => ({
  createTariffVersion: vi.fn(),
}))

const createdVersion = { id: 11, tariffId: 7, startDate: '2026-01-15', endDate: null }

function renderForm(overrides = {}) {
  const onVersionAdded = overrides.onVersionAdded ?? vi.fn()
  render(
    <AddTariffVersionForm
      tariffId={7}
      tariffCode="DAC"
      onVersionAdded={onVersionAdded}
      {...overrides}
    />,
  )

  return { onVersionAdded }
}

function setDate(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

async function submit(user) {
  await user.click(screen.getByRole('button', { name: 'Crear versión' }))
}

describe('Formulario de Versión de tarifa', () => {
  beforeEach(() => {
    vi.mocked(createTariffVersion).mockReset()
  })

  afterEach(() => {
    message.destroy()
  })

  it('exige la fecha de inicio', async () => {
    renderForm()
    const user = userEvent.setup()

    await submit(user)

    expect(
      await screen.findByText('La fecha de inicio es obligatoria.'),
    ).toBeInTheDocument()
    expect(createTariffVersion).not.toHaveBeenCalled()
  })

  it('envía tariffId, startDate y endDate null cuando la fecha de fin está vacía', async () => {
    vi.mocked(createTariffVersion).mockResolvedValue({
      success: true,
      tariffVersion: createdVersion,
    })
    renderForm()
    const user = userEvent.setup()

    setDate('Fecha de inicio', '2026-01-15')
    await submit(user)

    await waitFor(() => {
      expect(createTariffVersion).toHaveBeenCalledWith(7, '2026-01-15', null)
    })
  })

  it('muestra el mensaje de éxito, notifica al padre y limpia el formulario', async () => {
    vi.mocked(createTariffVersion).mockResolvedValue({
      success: true,
      tariffVersion: createdVersion,
    })
    const { onVersionAdded } = renderForm()
    const user = userEvent.setup()

    setDate('Fecha de inicio', '2026-01-15')
    await submit(user)

    expect(
      await screen.findByText(
        'Versión de tarifa creada correctamente para "DAC"',
      ),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Versión de tarifa registrada.'),
    ).toBeInTheDocument()
    expect(onVersionAdded).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Fecha de inicio')).toHaveValue('')
  })

  it('muestra el mensaje del backend cuando la creación falla', async () => {
    vi.mocked(createTariffVersion).mockRejectedValue(
      new Error('La versión de tarifa se traslapa con una existente.'),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { onVersionAdded } = renderForm()
    const user = userEvent.setup()

    setDate('Fecha de inicio', '2026-01-15')
    await submit(user)

    expect(
      await screen.findByText(
        'La versión de tarifa se traslapa con una existente.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Versión de tarifa creada correctamente/),
    ).not.toBeInTheDocument()
    expect(onVersionAdded).not.toHaveBeenCalled()
  })
})
