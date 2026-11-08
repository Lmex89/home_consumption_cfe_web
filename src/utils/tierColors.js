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
 * Map a tier level to a stable color.
 * - level 1 (Básico) → green
 * - middle levels (Intermedio, Intermedio2, …) → blue, orange, …
 * - max level (Excedente) → red
 *
 * Falls back to the last middle color if there are more middle tiers than
 * palette entries.
 */
export function getTierColorByLevel(level, maxLevel) {
  if (level === 1) return TIER_COLORS[1]
  if (level === maxLevel) return TIER_COLORS[4]

  const middleLevel = level - 2 // 0 for Intermedio, 1 for Intermedio2, …
  const middleKeys = [2, 3]
  const key = middleKeys[middleLevel] ?? middleKeys[middleKeys.length - 1]
  return TIER_COLORS[key]
}

/**
 * Return a hex color for a tier series name.
 * Prefers level-based coloring when tierLevel is supplied, because labels
 * from the backend can vary and middle tiers (Intermedio, Intermedio2, …)
 * should each get their own color.
 */
export function getSeriesColor(seriesName, tierLevel, maxLevel) {
  if (tierLevel !== undefined && maxLevel !== undefined) {
    return getTierColorByLevel(tierLevel, maxLevel)
  }

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
  if (seriesName === TIER_SERIES_NAMES.intermediate) {
    return TIER_COLORS[2]
  }
  if (seriesName?.startsWith(TIER_SERIES_NAMES.intermediate)) {
    return TIER_COLORS[3]
  }
  return '#8c8c8c'
}
