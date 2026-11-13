import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPageContainer from './DashboardPageContainer'
import { loadDashboardData } from '../../services/dashboardData'
import { installFetchMock } from '../../test/fetchMock'

vi.mock('../../services/dashboardData', () => ({ loadDashboardData: vi.fn() }))
const householdState = vi.hoisted(() => ({ current: null }))
vi.mock('../../hooks/useHouseholds', () => ({ useHouseholds: () => householdState.current }))
vi.mock('./DashboardPage', () => ({ default: (props) => <div>
  <span data-testid="data">{props.dashboardData?.name}</span>
  <span data-testid="loading">{String(props.isLoading)}</span>
  <span data-testid="error">{props.error}</span>
  <span data-testid="page">{props.paginationConfig ? props.paginationConfig.current : 'all'}</span>
  <span data-testid="readings">{props.displayItems.map((item) => item.kWh).join(', ')}</span>
  <button onClick={() => props.onHouseholdChange(2)}>Hogar 2</button>
  <button onClick={() => props.onHouseholdChange(3)}>Hogar 3</button>
  <button onClick={() => props.onBillingPeriodChange(2)}>Periodo 2</button>
  <button onClick={() => props.onBillingPeriodChange(3)}>Periodo 3</button>
  <button onClick={() => props.paginationConfig?.onChange(2)}>Página 2</button>
  <button onClick={props.onToggleShowAll}>Mostrar todo</button>
  <button onClick={() => props.onUpdateReading(12, { fecha: '2026-11-01', kWh: 240 })}>Guardar Lectura</button>
</div> }))

const data = (name) => ({ name, items: [], periods: [], billingPeriods: [], billingPeriodId: null })
const deferred = () => {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

beforeEach(() => {
  householdState.current = { households: [{ value: 1 }, { value: 2 }, { value: 3 }], isLoading: false }
  loadDashboardData.mockReset()
  loadDashboardData.mockImplementation(({ householdId, billingPeriodId }) => Promise.resolve(data(String(billingPeriodId ?? householdId))))
})

it.each([
  [[{ value: 2 }, { value: 1 }, { value: 3 }], 1],
  [[{ value: 2 }, { value: 3 }], 2],
])('selecciona el Hogar inicial correcto', async (households, expectedId) => {
  householdState.current = { households, isLoading: false }
  render(<DashboardPageContainer />)
  await waitFor(() => expect(loadDashboardData).toHaveBeenCalledWith({ householdId: expectedId }))
  expect(await screen.findByTestId('data')).toHaveTextContent(String(expectedId))
})

it.each([
  ['Hogar', 'Hogar 2', 'Hogar 3', 'householdId'],
  ['Periodo', 'Periodo 2', 'Periodo 3', 'billingPeriodId'],
])('mantiene el último %s activo cuando termina después una carga anterior', async (_, first, second, key) => {
  const user = userEvent.setup()
  const old = deferred()
  loadDashboardData.mockImplementation((options) => options[key] === 2 ? old.promise : Promise.resolve(data(String(options[key] ?? 1))))
  render(<DashboardPageContainer />)
  await screen.findByText('1')
  await user.click(screen.getByText(first))
  await user.click(screen.getByText(second))
  await screen.findByText('3')
  await act(async () => old.resolve(data('2')))
  expect(screen.getByTestId('data')).toHaveTextContent('3')
  expect(screen.getByTestId('loading')).toHaveTextContent('false')
})

it('solo la última carga puede quitar el indicador de carga', async () => {
  const user = userEvent.setup()
  const old = deferred()
  const latest = deferred()
  loadDashboardData.mockImplementation(({ householdId }) => householdId === 2 ? old.promise : householdId === 3 ? latest.promise : Promise.resolve(data('1')))
  render(<DashboardPageContainer />)
  await screen.findByText('1')
  await user.click(screen.getByText('Hogar 2'))
  await user.click(screen.getByText('Hogar 3'))
  await act(async () => old.resolve(data('2')))
  expect(screen.getByTestId('loading')).toHaveTextContent('true')
  await act(async () => latest.resolve(data('3')))
  expect(screen.getByTestId('loading')).toHaveTextContent('false')
  expect(screen.getByTestId('data')).toHaveTextContent('3')
})

it.each(['Hogar 2', 'Periodo 2'])('reinicia la paginación y mostrar todo al cambiar %s', async (selection) => {
  const user = userEvent.setup()
  const fetchMock = installFetchMock()
  fetchMock.on('GET', '/meter-readings', { json: [] })
  try {
    render(<DashboardPageContainer />)
    await screen.findByText('1')
    await user.click(screen.getByText('Página 2'))
    expect(screen.getByTestId('page')).toHaveTextContent('2')
    await user.click(screen.getByText(selection))
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('page')).toHaveTextContent('1')
    await user.click(screen.getByText('Mostrar todo'))
    await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('all'))
    await user.click(screen.getByText(selection))
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('page')).toHaveTextContent('1')
  } finally {
    fetchMock.restore()
  }
})

it.each([true, false])('invalida las Lecturas guardadas tras editar con mostrar todo activo: %s', async (showAll) => {
  const user = userEvent.setup()
  const fetchMock = installFetchMock()
  const reading = { id: 12, household_id: 1, reading_date: '2026-11-01', reading_kwh: 120 }
  const periods = [{ id: 11, start_date: '2026-11-01', end_date: '2026-11-30' }]
  const initialData = {
    ...data('Hogar 1'),
    periods,
    billingPeriodId: 11,
    items: [{ id: 12, fecha: reading.reading_date, kWh: 120 }],
  }
  loadDashboardData.mockResolvedValueOnce(initialData).mockResolvedValueOnce({
    ...initialData,
    items: [{ ...initialData.items[0], kWh: 240 }],
  })
  fetchMock.on('GET', '/meter-readings',
    { json: [reading] },
    { json: [{ ...reading, reading_kwh: 240 }] })
  fetchMock.on('PUT', '/meter-readings/12', { json: { ...reading, reading_kwh: 240 } })
  try {
    render(<DashboardPageContainer />)
    await screen.findByText('Hogar 1')
    await user.click(screen.getByText('Mostrar todo'))
    await waitFor(() => expect(screen.getByTestId('readings')).toHaveTextContent('120'))
    if (!showAll) await user.click(screen.getByText('Mostrar todo'))

    await user.click(screen.getByText('Guardar Lectura'))
    await waitFor(() => expect(screen.getByTestId('readings')).toHaveTextContent('240'))
    expect(screen.getByTestId('page')).toHaveTextContent('1')
    expect(loadDashboardData).toHaveBeenLastCalledWith({ householdId: 1, billingPeriodId: 11, periods })

    await user.click(screen.getByText('Mostrar todo'))
    await waitFor(() => expect(fetchMock.calls.filter((call) => call.method === 'GET')).toHaveLength(2))
    expect(screen.getByTestId('readings')).toHaveTextContent('240')
  } finally {
    fetchMock.restore()
  }
})

it('muestra el error cuando falla la carga principal', async () => {
  loadDashboardData.mockRejectedValue(new Error('fallo'))
  render(<DashboardPageContainer />)
  await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('No fue posible cargar los datos del dashboard.'))
  expect(screen.getByTestId('loading')).toHaveTextContent('false')
})


it.each([
  ['', 'No hay viviendas registradas.'],
  ['No fue posible cargar las viviendas.', 'No fue posible cargar las viviendas.'],
])('muestra el error de Hogares o el estado vacío', async (error, message) => {
  householdState.current = { households: [], isLoading: false, error }
  render(<DashboardPageContainer />)
  await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(message))
  expect(screen.getByTestId('loading')).toHaveTextContent('false')
})
