import { useCallback, useEffect, useRef, useState } from 'react'
import {
  updateConsumption,
} from '../../services/consumoService'
import { loadDashboardData } from '../../services/dashboardData'
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
  const periodsRef = useRef(null)

  const {
    households,
    isLoading: isLoadingHouseholds,
    error: householdsError,
  } = useHouseholds()

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

  const loadDashboard = useCallback(async ({ householdId, billingPeriodId, periods }) => {
    const requestId = ++latestRequestIdRef.current
    setIsLoading(true)
    setError('')
    try {
      const data = await loadDashboardData({ householdId, billingPeriodId, periods })
      if (latestRequestIdRef.current !== requestId) return
      periodsRef.current = data.periods
      setBillingPeriods(data.billingPeriods)
      setSelectedBillingPeriodId(data.billingPeriodId)
      setDashboardData(data)
    } catch {
      if (latestRequestIdRef.current === requestId) {
        setError('No fue posible cargar los datos del dashboard.')
      }
    } finally {
      if (latestRequestIdRef.current === requestId) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoadingHouseholds) return
    if (households.length === 0) {
      setIsLoading(false)
      setError(householdsError || 'No hay viviendas registradas.')
      return
    }
    const householdId = households.some((h) => h.value === 1) ? 1 : households[0].value
    setSelectedHouseholdId(householdId)
    loadDashboard({ householdId })
    const requestCounter = latestRequestIdRef
    return () => { requestCounter.current++ }
  }, [households, isLoadingHouseholds, householdsError, loadDashboard])

  const handleHouseholdChange = (householdId) => {
    setSelectedHouseholdId(householdId)
    periodsRef.current = null
    resetPagination()
    return loadDashboard({ householdId })
  }

  const handleBillingPeriodChange = (billingPeriodId) => {
    setSelectedBillingPeriodId(billingPeriodId)
    resetPagination()
    return loadDashboard({ householdId: selectedHouseholdId, billingPeriodId, periods: periodsRef.current })
  }

  const handleUpdateReading = async (meterReadingId, values) => {
    const requestId = latestRequestIdRef.current
    await updateConsumption(meterReadingId, values)
    if (requestId !== latestRequestIdRef.current) return
    await loadDashboard({
      householdId: selectedHouseholdId,
      billingPeriodId: selectedBillingPeriodId,
      periods: periodsRef.current,
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
