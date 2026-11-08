import { render, screen, within } from '@testing-library/react'
import ConsumptionTable from './ConsumptionTable'

const lecturasDelPeriodo = [
  {
    id: 2,
    householdId: 1,
    fecha: '2026-11-10',
    kWh: 330,
    note: 'Lectura inicial',
    isInitial: true,
  },
  {
    id: 1,
    householdId: 1,
    fecha: '2026-10-20',
    kWh: 260.44,
    note: '',
    isInitial: false,
  },
]

function renderTabla(props = {}) {
  return render(
    <ConsumptionTable
      items={lecturasDelPeriodo}
      paginationConfig={false}
      {...props}
    />,
  )
}

describe('ConsumptionTable en el Periodo activo', () => {
  it('renderiza las Lecturas con fecha, kWh y nota', () => {
    renderTabla()

    const table = within(screen.getByRole('table'))

    expect(table.getByText('2026-10-20')).toBeInTheDocument()
    expect(table.getByText('260.4')).toBeInTheDocument()
    expect(table.getByText('Sin observaciones')).toBeInTheDocument()
    expect(table.getByText('2026-11-10')).toBeInTheDocument()
    expect(table.getByText('330.0')).toBeInTheDocument()
    expect(table.getByText('Lectura inicial')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando el Periodo activo no tiene Lecturas', () => {
    render(<ConsumptionTable items={[]} paginationConfig={false} />)

    expect(
      within(screen.getByRole('table')).getByText('No hay consumos para mostrar.'),
    ).toBeInTheDocument()
  })

  it('muestra Editar por cada Lectura cuando se recibe onUpdateItem', () => {
    renderTabla({ onUpdateItem: vi.fn() })

    const editar = within(screen.getByRole('table')).getAllByText('Editar')

    expect(editar).toHaveLength(2)
    editar.forEach((label) => expect(label.closest('button')).not.toBeNull())
  })

  it('no muestra Editar cuando no se recibe onUpdateItem', () => {
    renderTabla()

    expect(
      within(screen.getByRole('table')).queryByText('Editar'),
    ).not.toBeInTheDocument()
  })

  it('se mantiene en la pestaña Tabla sin montar las gráficas', () => {
    renderTabla()

    expect(screen.getByText('Tabla')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByText('Cargando grafica...')).not.toBeInTheDocument()
  })
})
