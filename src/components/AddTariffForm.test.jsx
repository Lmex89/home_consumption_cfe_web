import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddTariffForm from './AddTariffForm'

function renderForm(overrides = {}) {
  const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(true)
  const props = {
    onSubmit,
    isSubmitting: false,
    successMessage: '',
    ...overrides,
  }

  render(<AddTariffForm {...props} />)

  return { onSubmit }
}

async function fillForm(user, { code, description }) {
  if (code) {
    await user.type(
      screen.getByPlaceholderText('Ej. DAC, TARIFA1'),
      code,
    )
  }
  if (description) {
    await user.type(
      screen.getByPlaceholderText('Ej. Tarifa doméstica de alto consumo'),
      description,
    )
  }
}

describe('Formulario de Tarifa', () => {
  it('exige el código de tarifa', async () => {
    const { onSubmit } = renderForm()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Crear tarifa' }))

    expect(
      await screen.findByText('El código de tarifa es obligatorio.'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rechaza un código de tarifa de más de 10 caracteres', async () => {
    const { onSubmit } = renderForm()
    const user = userEvent.setup()

    await fillForm(user, { code: 'TARIFA12345' })
    await user.click(screen.getByRole('button', { name: 'Crear tarifa' }))

    expect(
      await screen.findByText('El código no debe exceder 10 caracteres.'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía una vez el payload con código y descripción sin espacios sobrantes', async () => {
    const { onSubmit } = renderForm()
    const user = userEvent.setup()

    await fillForm(user, {
      code: '  DAC  ',
      description: '  Tarifa doméstica de alto consumo  ',
    })
    await user.click(screen.getByRole('button', { name: 'Crear tarifa' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      code: 'DAC',
      description: 'Tarifa doméstica de alto consumo',
    })
  })

  it('muestra el mensaje de éxito provisto por la página', () => {
    renderForm({
      successMessage: 'Tarifa "DAC" creada correctamente.',
    })

    expect(
      screen.getByText('Tarifa "DAC" creada correctamente.'),
    ).toBeInTheDocument()
  })

  it('limpia el formulario cuando el guardado tiene éxito', async () => {
    const { onSubmit } = renderForm()
    const user = userEvent.setup()

    await fillForm(user, { code: 'DAC', description: 'Tarifa doméstica' })
    await user.click(screen.getByRole('button', { name: 'Crear tarifa' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ej. DAC, TARIFA1')).toHaveValue('')
      expect(
        screen.getByPlaceholderText('Ej. Tarifa doméstica de alto consumo'),
      ).toHaveValue('')
    })
  })

  it('conserva los valores cuando el guardado falla', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false)
    renderForm({ onSubmit })
    const user = userEvent.setup()

    await fillForm(user, { code: 'DAC', description: 'Tarifa doméstica' })
    await user.click(screen.getByRole('button', { name: 'Crear tarifa' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(screen.getByPlaceholderText('Ej. DAC, TARIFA1')).toHaveValue('DAC')
    expect(
      screen.getByPlaceholderText('Ej. Tarifa doméstica de alto consumo'),
    ).toHaveValue('Tarifa doméstica')
  })

  it('no muestra el mensaje de éxito cuando la página reporta un error de backend', async () => {
    const onSubmit = vi.fn().mockResolvedValue(false)
    renderForm({ onSubmit, successMessage: '' })
    const user = userEvent.setup()

    await fillForm(user, { code: 'DAC' })
    await user.click(screen.getByRole('button', { name: 'Crear tarifa' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/creada correctamente/)).not.toBeInTheDocument()
  })
})
