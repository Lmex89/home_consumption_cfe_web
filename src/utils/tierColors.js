/**
 * Shared colors and labels for CFE tier breakdowns.
 * Used by DashboardBillingBreakdown and BillingPeriodCostChart so both
 * UIs stay consistent for 3-range and 4-range (Intermedio2) tariffs.
 */

export const TIER_COLORS = {
  1: '#52c41a', // Básico
  2: '#1890ff', // Intermedio
  3: '#fa8c16', // Intermedio2 / third middle tier
  4: '#f5222d', // Excedente when it is the 4th tier
}

export const TAX_COLORS = {
  iva: '#722ed1',
  dap: '#eb2f96',
}

export const TIER_SERIES_NAMES = {
  basic: 'Básico',
  intermediate: 'Intermedio',
  excess: 'Excedente',
  iva: 'IVA',
  dap: 'DAP',
}

/**
 * Return a hex color for a tier series name.
 * Handles dynamic middle tiers (Intermedio, Intermedio2, Intermedio3, …)
 * by mapping the first and last names to fixed colors and middle tiers to
 * the intermediate palette.
 */
export function getSeriesColor(seriesName) {
  if (seriesName === TIER_SERIES_NAMES.basic) {
    return TIER_COLORS[1]
  }
  if (seriesName === TIER_SERIES_NAMES.excess) {
    return TIER_COLORS[4]
  }
  if (seriesName === TIER_SERIES_NAMES.iva) {
    return TAX_COLORS.iva
  }
  if (seriesName === TIER_SERIES_NAMES.dap) {
    return TAX_COLORS.dap
  }
  // Any Intermedio / Intermedio2 / Intermedio3 …
  if (seriesName.startsWith(TIER_SERIES_NAMES.intermediate)) {
    return TIER_COLORS[3]
  }
  return '#8c8c8c'
}

/**
 * Return a color for a tier by its level (1 = Básico, last = Excedente).
 * Useful when the level is known independently of the label.
 */
export function getTierColorByLevel(level, maxLevel) {
  if (level === 1) return TIER_COLORS[1]
  if (level === maxLevel) return TIER_COLORS[4]
  return TIER_COLORS[3]
}
