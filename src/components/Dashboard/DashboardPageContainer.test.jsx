import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
  <button onClick={() => props.onHouseholdChange(2)}>Hogar 2</button>
  <button onClick={() => props.onHouseholdChange(3)}>Hogar 3</button>
  <button onClick={() => props.onBillingPeriodChange(2)}>Periodo 2</button>
  <button onClick={() => props.onBillingPeriodChange(3)}>Periodo 3</button>
  <button onClick={() => props.paginationConfig?.onChange(2)}>Página 2</button>
  <button onClick={props.onToggleShowAll}>Mostrar todo</button>
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
  ['Hogar', 'Hogar 2', 'Hogar 3', 'householdId'],
  ['Periodo', 'Periodo 2', 'Periodo 3', 'billingPeriodId'],
])('mantiene el último %s activo cuando termina después una carga anterior', async (_, first, second, key) => {
  const old = deferred()
  loadDashboardData.mockImplementation((options) => options[key] === 2 ? old.promise : Promise.resolve(data(String(options[key] ?? 1))))
  render(<DashboardPageContainer />)
  await screen.findByText('1')
  fireEvent.click(screen.getByText(first))
  fireEvent.click(screen.getByText(second))
  await screen.findByText('3')
  await act(async () => old.resolve(data('2')))
  expect(screen.getByTestId('data')).toHaveTextContent('3')
  expect(screen.getByTestId('loading')).toHaveTextContent('false')
})

it('solo la última carga puede quitar el indicador de carga', async () => {
  const old = deferred()
  const latest = deferred()
  loadDashboardData.mockImplementation(({ householdId }) => householdId === 2 ? old.promise : householdId === 3 ? latest.promise : Promise.resolve(data('1')))
  render(<DashboardPageContainer />)
  await screen.findByText('1')
  fireEvent.click(screen.getByText('Hogar 2'))
  fireEvent.click(screen.getByText('Hogar 3'))
  await act(async () => old.resolve(data('2')))
  expect(screen.getByTestId('loading')).toHaveTextContent('true')
  await act(async () => latest.resolve(data('3')))
  expect(screen.getByTestId('loading')).toHaveTextContent('false')
  expect(screen.getByTestId('data')).toHaveTextContent('3')
})

it.each(['Hogar 2', 'Periodo 2'])('reinicia la paginación y mostrar todo al cambiar %s', async (selection) => {
  const fetchMock = installFetchMock()
  fetchMock.on('GET', '/meter-readings', { json: [] })
  try {
    render(<DashboardPageContainer />)
    await screen.findByText('1')
    fireEvent.click(screen.getByText('Página 2'))
    expect(screen.getByTestId('page')).toHaveTextContent('2')
    fireEvent.click(screen.getByText(selection))
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('page')).toHaveTextContent('1')
    fireEvent.click(screen.getByText('Mostrar todo'))
    await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('all'))
    fireEvent.click(screen.getByText(selection))
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('page')).toHaveTextContent('1')
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
