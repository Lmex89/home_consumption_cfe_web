import { useMemo, useState } from 'react'
import { fetchAllMeterReadings } from '../services/consumoService'

/**
 * Reusable hook for meter readings pagination with "show all" toggle.
 *
 * @param {object} params
 * @param {Array} params.periodItems - Readings filtered by billing period (ascending order from API)
 * @param {number|null} params.householdId - Current household ID for fetching all readings
 * @param {boolean} params.enableShowAll - Whether to enable the "show all" feature
 *
 * @returns {object} Pagination state and handlers
 */
export function useMeterReadingsPagination({ periodItems, householdId, enableShowAll = true }) {
  const [showAll, setShowAll] = useState(false)
  const [allItems, setAllItems] = useState(null)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingAll, setIsLoadingAll] = useState(false)

  // Sort period items in descending order (newest first)
  const sortedPeriodItems = useMemo(
    () => [...(periodItems || [])].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [periodItems],
  )

  // Sort all items in descending order when available
  const sortedAllItems = useMemo(
    () => (allItems ? [...allItems].sort((a, b) => b.fecha.localeCompare(a.fecha)) : null),
    [allItems],
  )

  const displayItems = showAll ? (sortedAllItems || sortedPeriodItems) : sortedPeriodItems

  const handleToggleShowAll = async () => {
    const newShowAll = !showAll
    setShowAll(newShowAll)
    setCurrentPage(1)

    // Fetch all items if switching to "show all" and not already loaded
    if (newShowAll && !allItems && householdId && enableShowAll) {
      setIsLoadingAll(true)
      try {
        const readings = await fetchAllMeterReadings(householdId)
        setAllItems(readings)
      } catch (error) {
        console.error('Error fetching all meter readings:', error)
      } finally {
        setIsLoadingAll(false)
      }
    }
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const paginationConfig = showAll
    ? false
    : {
        current: currentPage,
        pageSize,
        onChange: (page) => setCurrentPage(page),
        onShowSizeChange: (_, newPageSize) => handlePageSizeChange(newPageSize),
        showSizeChanger: true,
        pageSizeOptions: ['10', '50', '100'],
        defaultPageSize: 10,
        showTotal: (total) => `Total ${total} lecturas`,
        showQuickJumper: true,
      }

  const resetPagination = () => {
    setShowAll(false)
    setAllItems(null)
    setCurrentPage(1)
  }

  return {
    displayItems,
    allItems,
    showAll,
    pageSize,
    currentPage,
    isLoadingAll,
    paginationConfig,
    handleToggleShowAll,
    handlePageSizeChange,
    resetPagination,
    setAllItems,
  }
}
