/**
 * Bar value labels ("100.0 kWh", "$134.00") are ~62px wide at the charts'
 * fontSize 10, so a reading needs a ~72px slot to show its label without
 * touching the next one. G2's label overlap transforms proved unreliable, so
 * both charts decide up front whether the labels fit and simply do not render
 * them when they do not.
 */
export const MIN_BAR_LABEL_SLOT = 72

/**
 * Whether the stacked bars have room for per-reading value labels.
 *
 * @param {object} params
 * @param {number} params.containerWidth - Measured chart wrapper width
 * @param {number} params.readingCount - Number of readings (bars) rendered
 * @param {number} params.yAxisReserve - Pixels reserved for the y axis
 * @returns {boolean}
 */
export function hasRoomForBarLabels({ containerWidth, readingCount, yAxisReserve }) {
  if (!containerWidth || readingCount < 2) return false

  return (containerWidth - yAxisReserve) / readingCount >= MIN_BAR_LABEL_SLOT
}
