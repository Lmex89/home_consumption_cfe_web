import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import DashboardPageContainer from './DashboardPageContainer'
import { loadDashboardData } from '../../services/dashboardData'

vi.mock('../../services/dashboardData', () => ({ loadDashboardData: vi.fn() }))
vi.mock('../../hooks/useHouseholds', () => {
  const households = [{ value: 1 }, { value: 2 }, { value: 3 }]
  return { useHouseholds: () => ({ households, isLoading: false }) }
})
vi.mock('../../hooks/useMeterReadingsPagination', () => ({ useMeterReadingsPagination: () => ({ resetPagination: vi.fn() }) }))
vi.mock('./DashboardPage', () => ({ default: (props) => <div>
  <span>{props.dashboardData?.name}</span>
  <span>{props.error}</span>
  <button onClick={() => props.onHouseholdChange(2)}>Hogar 2</button>
  <button onClick={() => props.onHouseholdChange(3)}>Hogar 3</button>
</div> }))

it('mantiene el último Hogar activo cuando termina después una carga anterior', async () => {
  let resolveOld
  const data = (name) => ({ name, periods: [], billingPeriods: [], billingPeriodId: null })
  loadDashboardData.mockImplementation(({ householdId }) => {
    if (householdId === 2) return new Promise((resolve) => { resolveOld = resolve })
    return Promise.resolve(data(String(householdId)))
  })
  render(<DashboardPageContainer />)
  await screen.findByText('1')
  fireEvent.click(screen.getByText('Hogar 2'))
  fireEvent.click(screen.getByText('Hogar 3'))
  await screen.findByText('3')
  await act(async () => resolveOld(data('2')))
  await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())
  expect(screen.queryByText('2')).not.toBeInTheDocument()
})
