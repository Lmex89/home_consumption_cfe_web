import { loadDashboardData } from './dashboardData'

it('elige el Periodo activo actual y solicita Periodos y Lecturas una sola vez', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 2, 15, 12))
  const requester = vi.fn(async (endpoint) => {
    if (endpoint === '/billing-periods') return [
      { id: 2, start_date: '2026-04-01', end_date: '2026-04-30' },
      { id: 1, start_date: '2026-03-01', end_date: '2026-03-31' },
    ]
    if (endpoint === '/meter-readings') return []
    return {}
  })
  try {
    const result = await loadDashboardData({ householdId: 7 }, requester)
    expect(result.billingPeriodId).toBe(1)
    expect(requester.mock.calls.filter(([url]) => url === '/billing-periods')).toHaveLength(1)
    expect(requester.mock.calls.filter(([url]) => url === '/meter-readings')).toEqual([
      ['/meter-readings', { query: { household_id: 7, reading_date_from: '2026-03-01', reading_date_to: '2026-03-31', limit: 500, offset: 0 } }],
    ])
  } finally {
    vi.useRealTimers()
  }
})

it('reutiliza Periodos al cambiar de Periodo activo', async () => {
  const periods = [
    { id: 1, start_date: '2026-01-01', end_date: '2026-02-01' },
    { id: 2, start_date: '2026-03-01', end_date: '2026-04-01' },
  ]
  const requester = vi.fn(async (url) => url === '/meter-readings' ? [] : {})
  const result = await loadDashboardData({ householdId: 7, billingPeriodId: 2, periods }, requester)
  expect(result.billingPeriodId).toBe(2)
  expect(result.billingPeriods).toEqual([
    { value: 2, label: '2026-03-01 - 2026-04-01', startDate: '2026-03-01', endDate: '2026-04-01' },
    { value: 1, label: '2026-01-01 - 2026-02-01', startDate: '2026-01-01', endDate: '2026-02-01' },
  ])
  expect(requester.mock.calls.some(([url]) => url === '/billing-periods')).toBe(false)
  expect(requester.mock.calls.find(([url]) => url === '/meter-readings')[1].query).toMatchObject({ reading_date_from: '2026-03-01', reading_date_to: '2026-04-01' })
})

it('sin Periodos usa filtros opcionales y propaga fallos de Lecturas', async () => {
  const requester = vi.fn(async (url) => {
    if (url === '/billing-periods') return []
    throw new Error('Lecturas no disponibles')
  })
  await expect(loadDashboardData({ householdId: 7, startDate: '2026-01-01', endDate: '2026-02-01' }, requester)).rejects.toThrow('Lecturas no disponibles')
  expect(requester.mock.calls).toHaveLength(2)
  expect(requester.mock.calls[1][1].query).toMatchObject({ reading_date_from: '2026-01-01', reading_date_to: '2026-02-01' })
})

it('elige el Periodo más reciente si hoy no está en ninguno', async () => {
  const requester = vi.fn(async (url) => {
    if (url === '/billing-periods') return [
      { id: 1, start_date: '2001-01-01', end_date: '2001-02-01' },
      { id: 2, start_date: '2002-01-01', end_date: '2002-02-01' },
    ]
    return url === '/meter-readings' ? [] : {}
  })
  const result = await loadDashboardData({ householdId: 7 }, requester)
  expect(result.billingPeriodId).toBe(2)
  expect(result.summary.average).toBe(0)
})

it('sin Periodos devuelve una sola Lectura sin promedio ni costo', async () => {
  const requester = vi.fn(async (url) => url === '/billing-periods' ? [] : [
    { id: 1, household_id: 7, reading_date: '2026-01-01', reading_kwh: '100', is_initial: true },
  ])
  const result = await loadDashboardData({ householdId: 7 }, requester)
  expect(result.billingPeriodId).toBeNull()
  expect(result.items).toHaveLength(1)
  expect(result.summary).toMatchObject({ current: 100, average: 0, accumulated: 0 })
  expect(result.billing).toMatchObject({ totalMxn: 0, tariffCode: 'N/D' })
  expect(requester).toHaveBeenCalledTimes(2)
})
