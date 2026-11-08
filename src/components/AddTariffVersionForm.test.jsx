import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { message } from 'antd'
import AddTariffVersionForm from './AddTariffVersionForm'
import { installFetchMock } from '../test/fetchMock'

const createdVersion = { id: 11, tariff_id: 7, start_date: '2026-01-15', end_date: null }

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

// jsdom sanitiza los valores inválidos de un input type="date"; este helper
// inyecta el valor ISO que el formulario necesita sin simular tecleo.
function setDate(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

async function submit(user) {
  await user.click(screen.getByRole('button', { name: 'Crear versión' }))
}

describe('Formulario de Versión de tarifa', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = installFetchMock()
  })

  afterEach(() => {
    fetchMock.restore()
    message.destroy()
  })

  it('exige la fecha de inicio', async () => {
    renderForm()
    const user = userEvent.setup()

    await submit(user)

    expect(
      await screen.findByText('La fecha de inicio es obligatoria.'),
    ).toBeInTheDocument()
    expect(fetchMock.calls).toHaveLength(0)
  })

  it('envía tariff_id, start_date y end_date null cuando la fecha de fin está vacía', async () => {
    fetchMock.on('POST', '/tariff-versions', { status: 201, json: createdVersion })
    renderForm()
    const user = userEvent.setup()

    setDate('Fecha de inicio', '2026-01-15')
    await submit(user)

    await waitFor(() => {
      expect(fetchMock.lastJsonBody()).toEqual({
        tariff_id: 7,
        start_date: '2026-01-15',
        end_date: null,
      })
    })
    expect(fetchMock.lastCall()).toMatchObject({
      method: 'POST',
      url: expect.stringContaining('/tariff-versions'),
    })
  })

  it('muestra el mensaje de éxito, notifica al padre y limpia el formulario', async () => {
    fetchMock.on('POST', '/tariff-versions', { status: 201, json: createdVersion })
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
    fetchMock.on('POST', '/tariff-versions', {
      status: 500,
      json: { detail: 'La versión de tarifa se traslapa con una existente.' },
    })
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
