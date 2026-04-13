import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getDashboardConsumptions,
  listBillingPeriods,
  updateConsumption,
} from '../../services/consumoService'
import { useHouseholds } from '../../hooks/useHouseholds'
import { useMeterReadingsPagination } from '../../hooks/useMeterReadingsPagination'
import DashboardPage from './DashboardPage'

/**
 * Container component for DashboardPage.
 * Handles all data fetching, state management, and user interactions.
 * Separates data logic from presentation logic.
 */
function DashboardPageContainer() {
  const [dashboardData, setDashboardData] = useState(null)
  const [billingPeriods, setBillingPeriods] = useState([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(null)
  const [selectedBillingPeriodId, setSelectedBillingPeriodId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const latestRequestIdRef = useRef(0)

  const { households, isLoading: isLoadingHouseholds } = useHouseholds()

  const {
    displayItems,
    showAll,
    isLoadingAll,
    paginationConfig,
    handleToggleShowAll,
    handlePageSizeChange,
    resetPagination,
    pageSize,
  } = useMeterReadingsPagination({
    periodItems: dashboardData?.items,
    householdId: selectedHouseholdId,
    enableShowAll: true,
  })

  /**
   * Load dashboard data for a specific household and billing period
   */
  const loadDashboard = useCallback(async ({ householdId, billingPeriodId }) => {
    const requestId = ++latestRequestIdRef.current
    setIsLoading(true)
    setError('')

    try {
      const data = await getDashboardConsumptions({
        householdId,
        billingPeriodId,
      })
      if (latestRequestIdRef.current !== requestId) return
      setDashboardData(data)
    } catch {
      if (latestRequestIdRef.current !== requestId) return
      setError('No fue posible cargar los datos del dashboard.')
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [])

  /**
   * Initialize dashboard on mount and when households load
   */
  useEffect(() => {
    if (isLoadingHouseholds || households.length === 0) return

    let isMounted = true

    const initialize = async () => {
      setIsLoading(true)
      setError('')

      try {
        const hasDefaultHousehold = households.some((h) => h.value === 1)
        const initialHouseholdId = hasDefaultHousehold ? 1 : (households[0]?.value ?? 1)

        const periods = await listBillingPeriods(initialHouseholdId)
        const initialBillingPeriodId = periods[0]?.value ?? null

        if (!isMounted) return

        setSelectedHouseholdId(initialHouseholdId)
        setBillingPeriods(periods)
        setSelectedBillingPeriodId(initialBillingPeriodId)

        const data = await getDashboardConsumptions({
          householdId: initialHouseholdId,
          billingPeriodId: initialBillingPeriodId,
        })
        if (isMounted) {
          setDashboardData(data)
        }
      } catch {
        if (isMounted) {
          setError('No fue posible cargar los datos del dashboard.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [households, isLoadingHouseholds])

  /**
   * Handle household selection change
   */
  const handleHouseholdChange = async (householdId) => {
    setSelectedHouseholdId(householdId)
    resetPagination()

    try {
      const periods = await listBillingPeriods(householdId)
      const nextBillingPeriodId = periods[0]?.value ?? null

      setBillingPeriods(periods)
      setSelectedBillingPeriodId(nextBillingPeriodId)
      await loadDashboard({ householdId, billingPeriodId: nextBillingPeriodId })
    } catch {
      setBillingPeriods([])
      setSelectedBillingPeriodId(null)
      await loadDashboard({ householdId, billingPeriodId: null })
    }
  }

  /**
   * Handle billing period selection change
   */
  const handleBillingPeriodChange = async (billingPeriodId) => {
    setSelectedBillingPeriodId(billingPeriodId)
    resetPagination()
    await loadDashboard({ householdId: selectedHouseholdId, billingPeriodId })
  }

  /**
   * Handle meter reading update
   */
  const handleUpdateReading = async (meterReadingId, values) => {
    await updateConsumption(meterReadingId, values)
    await loadDashboard({
      householdId: selectedHouseholdId,
      billingPeriodId: selectedBillingPeriodId,
    })
  }

  return (
    <DashboardPage
      dashboardData={dashboardData}
      isLoading={isLoading}
      error={error}
      selectedHouseholdId={selectedHouseholdId}
      selectedBillingPeriodId={selectedBillingPeriodId}
      households={households}
      billingPeriods={billingPeriods}
      onHouseholdChange={handleHouseholdChange}
      onBillingPeriodChange={handleBillingPeriodChange}
      onUpdateReading={handleUpdateReading}
      displayItems={displayItems}
      showAll={showAll}
      isLoadingAll={isLoadingAll}
      paginationConfig={paginationConfig}
      onToggleShowAll={handleToggleShowAll}
      onPageSizeChange={handlePageSizeChange}
      pageSize={pageSize}
    />
  )
}

export default DashboardPageContainer
