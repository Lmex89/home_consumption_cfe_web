import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { message } from 'antd'
import AddTariffRangeForm from './AddTariffRangeForm'
import { installFetchMock } from '../test/fetchMock'

const createdRange = {
  id: 21,
  tariff_version_id: 3,
  range_min: 100,
  range_max: 200,
  price_per_kwh: 1.2345,
}

function renderForm(overrides = {}) {
  const onRangeAdded = overrides.onRangeAdded ?? vi.fn()
  const props = {
    tariffVersionId: 3,
    versionLabel: 'la versión #3',
    onRangeAdded,
    ...overrides,
  }
  const view = render(<AddTariffRangeForm {...props} />)

  return { ...view, props, onRangeAdded }
}

async function fillRange(user, { rangeMin, rangeMax, pricePerKwh }) {
  if (rangeMin !== undefined) {
    await user.type(screen.getByLabelText('Rango mínimo'), String(rangeMin))
  }
  if (rangeMax !== undefined) {
    await user.type(screen.getByLabelText('Rango máximo'), String(rangeMax))
  }
  if (pricePerKwh !== undefined) {
    await user.type(screen.getByLabelText('Precio por kWh'), String(pricePerKwh))
  }
}

async function submit(user) {
  await user.click(screen.getByRole('button', { name: 'Crear rango' }))
}

describe('Formulario de Rango', () => {
  let fetchMock

  beforeEach(() => {
    localStorage.clear()
    fetchMock = installFetchMock()
  })

  afterEach(() => {
    fetchMock.restore()
    message.destroy()
  })

  it('exige el rango mínimo y el precio por kWh', async () => {
    renderForm()
    const user = userEvent.setup()

    await submit(user)

    expect(
      await screen.findByText('El rango mínimo es obligatorio.'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('El precio por kWh es obligatorio.'),
    ).toBeInTheDocument()
    expect(fetchMock.calls).toHaveLength(0)
  })

  it('envía el payload numérico con rango mínimo, rango máximo y precio por kWh', async () => {
    fetchMock.on('POST', '/tariff-ranges', { status: 201, json: createdRange })
    renderForm()
    const user = userEvent.setup()

    await fillRange(user, { rangeMin: 100, rangeMax: 200, pricePerKwh: 1.2345 })
    await submit(user)

    await waitFor(() => {
      expect(fetchMock.lastJsonBody()).toEqual({
        tariff_version_id: 3,
        range_min: 100,
        range_max: 200,
        price_per_kwh: 1.2345,
      })
    })
    expect(fetchMock.lastCall()).toMatchObject({
      method: 'POST',
      url: expect.stringContaining('/tariff-ranges'),
    })
  })

  it('muestra el mensaje de éxito y entrega el Rango creado al padre', async () => {
    fetchMock.on('POST', '/tariff-ranges', { status: 201, json: createdRange })
    const { onRangeAdded } = renderForm()
    const user = userEvent.setup()

    await fillRange(user, { rangeMin: 100, rangeMax: 200, pricePerKwh: 1.2345 })
    await submit(user)

    expect(
      await screen.findByText(
        'Rango tarifario creado correctamente para la versión #3.',
      ),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Rango tarifario registrado.'),
    ).toBeInTheDocument()
    expect(onRangeAdded).toHaveBeenCalledWith(createdRange)
  })

  it('muestra el mensaje del backend cuando la creación falla', async () => {
    fetchMock.on('POST', '/tariff-ranges', {
      status: 500,
      json: { detail: 'El rango se traslapa con un rango existente.' },
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { onRangeAdded } = renderForm()
    const user = userEvent.setup()

    await fillRange(user, { rangeMin: 100, pricePerKwh: 1.2345 })
    await submit(user)

    expect(
      await screen.findByText('El rango se traslapa con un rango existente.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Rango tarifario creado correctamente/),
    ).not.toBeInTheDocument()
    expect(onRangeAdded).not.toHaveBeenCalled()
  })

  it('limpia los campos y el mensaje de éxito al cambiar de Versión de tarifa', async () => {
    fetchMock.on('POST', '/tariff-ranges', { status: 201, json: createdRange })
    const { rerender, props } = renderForm()
    const user = userEvent.setup()

    await fillRange(user, { rangeMin: 100, pricePerKwh: 1.2345 })
    await submit(user)
    expect(
      await screen.findByText(
        'Rango tarifario creado correctamente para la versión #3.',
      ),
    ).toBeInTheDocument()

    rerender(<AddTariffRangeForm {...props} tariffVersionId={4} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Rango mínimo')).toHaveValue('')
      expect(screen.getByLabelText('Precio por kWh')).toHaveValue('')
    })
    expect(
      screen.queryByText(/Rango tarifario creado correctamente/),
    ).not.toBeInTheDocument()
  })
})
