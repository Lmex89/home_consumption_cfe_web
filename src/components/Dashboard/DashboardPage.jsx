import { Alert, Empty, Skeleton } from 'antd'
import DashboardBillingBreakdown from './DashboardBillingBreakdown'
import DashboardHighlight from './DashboardHighlight'
import DashboardHero from './DashboardHero'
import DashboardMetricsGrid from './DashboardMetricsGrid'
import styles from './DashboardPage.module.css'
import ConsumptionTable from '../ConsumptionTable'

/**
 * Presentation component for the dashboard page.
 * Handles rendering only, no data fetching.
 * Data is passed as props from the container component.
 */
function DashboardPage({
  dashboardData,
  isLoading,
  error,
  selectedHouseholdId,
  selectedBillingPeriodId,
  households,
  billingPeriods,
  onHouseholdChange,
  onBillingPeriodChange,
  onUpdateReading,
  displayItems,
  showAll,
  isLoadingAll,
  paginationConfig,
  onToggleShowAll,
  onPageSizeChange,
  pageSize,
}) {
  // Loading state
  if (isLoading) {
    return (
      <div className={styles.feedback} role="status" aria-live="polite">
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message={error}
        className={styles.error}
        role="alert"
        aria-live="assertive"
      />
    )
  }

  // Empty state
  if (!dashboardData) {
    return (
      <Empty
        description="No hay datos disponibles"
        className={styles.feedback}
        role="status"
        aria-live="polite"
      />
    )
  }

  const { items, summary, billing } = dashboardData

  return (
    <div className={styles.page}>
      <DashboardHero
        selectedHouseholdId={selectedHouseholdId}
        selectedBillingPeriodId={selectedBillingPeriodId}
        households={households}
        billingPeriods={billingPeriods}
        isLoading={isLoading}
        onHouseholdChange={onHouseholdChange}
        onBillingPeriodChange={onBillingPeriodChange}
      />

      <DashboardHighlight
        totalCost={billing.totalMxn}
        totalReadings={items.length}
      />

      <DashboardMetricsGrid
        summary={summary}
        itemsCount={items.length}
      />

      <DashboardBillingBreakdown billing={billing} />

      <ConsumptionTable
        key={`${selectedHouseholdId}-${selectedBillingPeriodId}`}
        items={dashboardData?.items}
        chartReadings={dashboardData?.chart?.readings ?? []}
        displayItems={displayItems}
        paginationConfig={paginationConfig}
        showAll={showAll}
        isLoadingAll={isLoadingAll}
        onUpdateItem={onUpdateReading}
        onToggleShowAll={onToggleShowAll}
        onPageSizeChange={onPageSizeChange}
        pageSize={pageSize}
      />
    </div>
  )
}

export default DashboardPage
