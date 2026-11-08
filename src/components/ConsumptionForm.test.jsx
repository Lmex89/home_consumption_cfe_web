import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConsumptionForm from './ConsumptionForm'

const hogares = [
  { value: 1, label: 'Casa Centro' },
  { value: 2, label: 'Casa Norte' },
]

function renderForm(overrides = {}) {
  const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(true)
  const onHouseholdChange = overrides.onHouseholdChange ?? vi.fn()
  const props = {
    onSubmit,
    isSubmitting: false,
    successMessage: '',
    households: hogares,
    loadingHouseholds: false,
    selectedHouseholdId: 1,
    onHouseholdChange,
    ...overrides,
  }

  const view = render(<ConsumptionForm {...props} />)

  return { ...view, props, onSubmit, onHouseholdChange }
}

async function submit(user) {
  await user.click(screen.getByRole('button', { name: /Guardar consumo/ }))
}

function fechaInput() {
  return screen.getByLabelText('Fecha')
}

function kwhInput() {
  return screen.getByLabelText('Cantidad de kWh')
}

/**
 * A native date input sanitizes anything that is not a valid ISO date to ''.
 * jsdom applies that sanitization, so the raw text cannot be typed or pasted.
 * Patch the value getter and the cloneNode used by the input's onChange so the
 * component receives the raw text, as the defensive date normalization expects.
 */
function setRawFecha(value) {
  const input = fechaInput()
  const descriptor = Object.getOwnPropertyDescriptor(input, 'value')
  const originalCloneNode = input.cloneNode

  Object.defineProperty(input, 'value', {
    configurable: true,
    get: () => value,
    set: descriptor.set,
  })
  input.cloneNode = () => input

  fireEvent.change(input)

  delete input.value
  if (descriptor) Object.defineProperty(input, 'value', descriptor)
  input.cloneNode = originalCloneNode
}

describe('Formulario de captura de Lecturas', () => {
  describe('validación', () => {
    it('exige el Hogar, la Fecha y la cantidad de kWh', async () => {
      const { onSubmit } = renderForm({ selectedHouseholdId: null })
      const user = userEvent.setup()

      await submit(user)

      expect(
        await screen.findByText('La vivienda es obligatoria.'),
      ).toBeInTheDocument()
      expect(
        await screen.findByText('La fecha es obligatoria.'),
      ).toBeInTheDocument()
      expect(
        await screen.findByText('La cantidad de kWh es obligatoria.'),
      ).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('rechaza un Consumo de 0 kWh', async () => {
      const { onSubmit } = renderForm()
      const user = userEvent.setup()

      fireEvent.change(fechaInput(), { target: { value: '2026-11-17' } })
      await user.type(kwhInput(), '0')
      // El InputNumber recorta al mínimo (0.1) al perder el foco, así que se
      // envía el formulario sin desenfocar para que la validación vea el 0.
      fireEvent.submit(kwhInput().closest('form'))

      expect(
        await screen.findByText('El consumo debe ser un numero positivo.'),
      ).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('rechaza un Consumo negativo', async () => {
      const { onSubmit } = renderForm()
      const user = userEvent.setup()

      fireEvent.change(fechaInput(), { target: { value: '2026-11-17' } })
      await user.type(kwhInput(), '-3')
      fireEvent.submit(kwhInput().closest('form'))

      expect(
        await screen.findByText('El consumo debe ser un numero positivo.'),
      ).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('muestra el error de formato cuando la Fecha no existe y no envía la Lectura', async () => {
      const { onSubmit } = renderForm()
      const user = userEvent.setup()

      await user.type(kwhInput(), '12')
      setRawFecha('2026-02-30')
      await submit(user)

      expect(
        await screen.findByText(
          'La fecha debe estar en formato YYYY-MM-DD o DD/MM/YYYY.',
        ),
      ).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('envío', () => {
    it('envía una sola vez el payload con la Fecha normalizada a YYYY-MM-DD', async () => {
      const { onSubmit } = renderForm({ selectedHouseholdId: 2 })
      const user = userEvent.setup()

      await user.type(kwhInput(), '46.7')
      await user.type(screen.getByPlaceholderText('Opcional'), '  medidor 42  ')
      setRawFecha('17/11/2026')
      await submit(user)

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
      expect(onSubmit).toHaveBeenCalledWith({
        householdId: 2,
        fecha: '2026-11-17',
        kWh: 46.7,
        isInitial: false,
        note: 'medidor 42',
      })
    })

    it('marca la Lectura inicial en el payload cuando se selecciona', async () => {
      const { onSubmit } = renderForm()
      const user = userEvent.setup()

      fireEvent.change(fechaInput(), { target: { value: '2026-11-17' } })
      await user.type(kwhInput(), '12')
      await user.click(screen.getByLabelText('La lectura es inicial'))
      await submit(user)

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ isInitial: true }),
      )
    })

    it('limpia los campos y conserva el Hogar activo tras guardar', async () => {
      const { onSubmit } = renderForm({ selectedHouseholdId: 2 })
      const user = userEvent.setup()

      await user.type(kwhInput(), '46.7')
      await user.type(screen.getByPlaceholderText('Opcional'), 'medidor 42')
      fireEvent.change(fechaInput(), { target: { value: '2026-11-17' } })
      await user.click(screen.getByLabelText('La lectura es inicial'))
      await submit(user)

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
      await waitFor(() => {
        expect(fechaInput()).toHaveValue('')
        expect(kwhInput()).toHaveValue('')
        expect(screen.getByPlaceholderText('Opcional')).toHaveValue('')
        expect(screen.getByLabelText('La lectura es inicial')).not.toBeChecked()
      })
      expect(screen.getByTitle('Casa Norte')).toBeInTheDocument()
    })

    it('conserva los valores cuando el guardado falla', async () => {
      const onSubmit = vi.fn().mockResolvedValue(false)
      renderForm({ onSubmit, selectedHouseholdId: 2 })
      const user = userEvent.setup()

      await user.type(kwhInput(), '46.7')
      await user.type(screen.getByPlaceholderText('Opcional'), 'medidor 42')
      fireEvent.change(fechaInput(), { target: { value: '2026-11-17' } })
      await submit(user)

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
      expect(fechaInput()).toHaveValue('2026-11-17')
      expect(kwhInput()).toHaveValue('46.7')
      expect(screen.getByPlaceholderText('Opcional')).toHaveValue('medidor 42')
      expect(screen.getByTitle('Casa Norte')).toBeInTheDocument()
    })

    it('muestra el mensaje de éxito y lo oculta al quedar vacío', () => {
      const { props, rerender } = renderForm({
        successMessage: 'Consumo guardado correctamente.',
      })

      expect(
        screen.getByText('Consumo guardado correctamente.'),
      ).toBeInTheDocument()

      rerender(<ConsumptionForm {...props} successMessage="" />)

      expect(
        screen.queryByText('Consumo guardado correctamente.'),
      ).not.toBeInTheDocument()
    })
  })

  describe('Hogar activo', () => {
    it('muestra los Hogares disponibles en el selector de Vivienda', async () => {
      renderForm()
      const user = userEvent.setup()

      await user.click(screen.getByLabelText('Vivienda'))

      expect(
        await screen.findByRole('option', { name: 'Casa Centro' }),
      ).toBeInTheDocument()
      expect(
        await screen.findByRole('option', { name: 'Casa Norte' }),
      ).toBeInTheDocument()
    })

    it('notifica el Hogar elegido al cambiar de Vivienda', async () => {
      const { onHouseholdChange } = renderForm()
      const user = userEvent.setup()

      await user.click(screen.getByLabelText('Vivienda'))
      await user.click(screen.getByText('Casa Norte'))

      await waitFor(() => expect(onHouseholdChange).toHaveBeenCalled())
      expect(onHouseholdChange.mock.calls[0][0]).toBe(2)
    })

    it('aplica el Hogar activo como valor del formulario', () => {
      renderForm({ selectedHouseholdId: 2 })

      expect(screen.getByTitle('Casa Norte')).toBeInTheDocument()
    })

    it('deshabilita el selector y el botón mientras cargan los Hogares', () => {
      renderForm({ loadingHouseholds: true })

      expect(screen.getByLabelText('Vivienda')).toBeDisabled()
      expect(
        screen.getByRole('button', { name: /Guardar consumo/ }),
      ).toBeDisabled()
    })
  })
})
