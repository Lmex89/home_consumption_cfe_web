import { Column } from '@ant-design/charts'
import { Empty } from 'antd'
import { useMemo } from 'react'
import { getSeriesColor } from '../../utils/tierColors'
import styles from './BillingPeriodCostChart.module.css'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

function formatCurrencyValue(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 'N/D'
  return currencyFormatter.format(numericValue)
}

function formatFullDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function aggregateTierLines(tierLines) {
  if (!Array.isArray(tierLines) || tierLines.length === 0) {
    return []
  }

  const totals = tierLines.reduce((acc, line) => {
    const key = line.tier_level
    if (!acc[key]) {
      acc[key] = {
        tierLevel: key,
        series: line.tier_name || `Nivel ${key}`,
        value: 0,
      }
    }
    acc[key].value += Number(line.subtotal || 0)
    return acc
  }, {})

  return Object.values(totals).sort((a, b) => a.tierLevel - b.tierLevel)
}

function toFiniteNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function buildStackedRows(reading, index) {
  const cost = reading.billing_period_cost
  if (!cost) return []

  const breakdown = cost.cfe_breakdown
  const hasBreakdown = breakdown && Array.isArray(breakdown.tier_lines)
  const dateLabel = formatFullDate(reading.date)
  const totalConsumption = toFiniteNumber(cost.total_consumption_kwh)
  const totalCost = toFiniteNumber(cost.total_cost)

  const rows = []

  if (hasBreakdown) {
    const tierRows = aggregateTierLines(breakdown.tier_lines)
    tierRows.forEach((tier) => {
      if (tier.value > 0) {
        rows.push({
          dateLabel,
          readingIndex: index + 1,
          series: tier.series,
          tierLevel: tier.tierLevel,
          value: tier.value,
          totalConsumption,
          totalCost,
          isTax: false,
        })
      }
    })
  } else if (Number.isFinite(totalCost)) {
    // Fallback when the API has no tier breakdown: show a single "Subtotal" bar.
    rows.push({
      dateLabel,
      readingIndex: index + 1,
      series: 'Subtotal',
      tierLevel: 0,
      value: toFiniteNumber(cost.total_cost_witout_taxes),
      totalConsumption,
      totalCost,
      isTax: false,
    })
  }

  const iva = toFiniteNumber(cost.iva)
  if (iva > 0) {
    rows.push({
      dateLabel,
      readingIndex: index + 1,
      series: 'IVA',
      tierLevel: 99,
      value: iva,
      totalConsumption,
      totalCost,
      isTax: true,
    })
  }

  const dap = toFiniteNumber(cost.dap)
  if (dap > 0) {
    rows.push({
      dateLabel,
      readingIndex: index + 1,
      series: 'DAP',
      tierLevel: 100,
      value: dap,
      totalConsumption,
      totalCost,
      isTax: true,
    })
  }

  return rows
}

/**
 * Chart component that displays billing period costs from the dashboard API.
 * Shows a stacked breakdown of cumulative cost by CFE tier (Básico, Intermedio,
 * Intermedio2, Excedente) plus IVA and DAP across meter readings.
 *
 * @param {object} props
 * @param {Array} props.readings - Array of readings from the meter-readings dashboard API
 *   Each reading should have: date, billing_period_cost.total_cost,
 *   billing_period_cost.cfe_breakdown.tier_lines
 */
function BillingPeriodCostChart({ readings }) {
  const chartData = useMemo(() => {
    if (!readings || readings.length === 0) return []

    return readings
      .filter((reading) => reading.billing_period_cost?.total_cost !== null && reading.billing_period_cost?.total_cost !== undefined)
      .flatMap((reading, index) => buildStackedRows(reading, index))
  }, [readings])

  const readingsWithCost = useMemo(() => {
    if (!readings || readings.length === 0) return []
    return readings.filter(
      (reading) =>
        reading.billing_period_cost?.total_cost !== null &&
        reading.billing_period_cost?.total_cost !== undefined,
    )
  }, [readings])

  const maxTierLevel = useMemo(() => {
    const levels = chartData
      .filter((row) => row.tierLevel !== 99 && row.tierLevel !== 100)
      .map((row) => row.tierLevel)
    return levels.length > 0 ? Math.max(...levels) : 0
  }, [chartData])

  // Series order and colors for the color scale. Kept in first-appearance
  // order (tiers by level, then IVA, DAP) so the legend and the stacked
  // segments stay aligned. @ant-design/plots v2 requires colorField plus an
  // explicit scale; the v1 `color` callback option is ignored by G2 v5.
  // NOTE: do NOT add seriesField back — the G2 interval mark uses the series
  // channel to dodge each series into its own thin sub-band (thin, offset
  // bars). stackY groups by the color channel, so colorField is enough.
  const seriesColorMap = useMemo(() => {
    const seen = new Set()
    const map = []
    chartData.forEach((row) => {
      if (seen.has(row.series)) return
      seen.add(row.series)
      const isTax = row.series === 'IVA' || row.series === 'DAP'
      const color = isTax
        ? getSeriesColor(row.series)
        : getSeriesColor(row.series, row.tierLevel, maxTierLevel)
      map.push({ series: row.series, color })
    })
    return map
  }, [chartData, maxTierLevel])

  if (chartData.length === 0 || readingsWithCost.length === 0) {
    return <Empty description="No hay datos de costos disponibles para graficar." />
  }

  const hasMultipleReadings = readingsWithCost.length > 1
  const lastReading = readingsWithCost[readingsWithCost.length - 1]
  const lastTotalCost = toFiniteNumber(lastReading.billing_period_cost?.total_cost)
  const lastTariffCode = lastReading.billing_period_cost?.tariff_code || 'N/D'

  const chartConfig = {
    data: chartData,
    xField: 'dateLabel',
    yField: 'value',
    colorField: 'series',
    stack: true,
    autoFit: true,
    scale: {
      color: {
        domain: seriesColorMap.map((entry) => entry.series),
        range: seriesColorMap.map((entry) => entry.color),
      },
    },
    style: {
      radius: 6,
      maxWidth: 72,
      minWidth: 24,
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: { type: 'equidistance', cfg: { minGap: 60 } },
        formatter: (value) => {
          const date = new Date(value)
          if (Number.isNaN(date.getTime())) return value
          return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
          })
        },
      },
      title: 'Fecha de lectura',
    },
    yAxis: {
      label: {
        formatter: (value) => formatCurrencyValue(value),
      },
      title: 'Costo acumulado (MXN)',
    },
    tooltip: {
      title: (title) => title,
      formatter: (datum) => {
        const value = datum?.value
        return {
          name: datum?.series,
          value: formatCurrencyValue(value),
        }
      },
    },
    legend: {
      position: 'top',
    },
    label: hasMultipleReadings
      ? {
          position: 'top',
          formatter: (datum) => {
            const value = datum?.value
            if (value === null || value === undefined || value === 0) return ''
            return currencyFormatter.format(value)
          },
          style: {
            fontSize: 10,
            fill: '#64748b',
          },
        }
      : false,
    interaction: {
      elementHighlight: true,
    },
    animation: {
      appear: {
        animation: 'scale-in-y',
        duration: 600,
      },
    },
  }

  return (
    <div className={styles.chartArea}>
      <div className={styles.chartHeader}>
        <p className={styles.eyebrow}>Costo del período de facturación</p>
        <p className={styles.caption}>
          Progresión del costo acumulado desde la primera lectura hasta cada lectura successiva,
          desglosado por tarifa
        </p>
      </div>
      <Column {...chartConfig} />
      {hasMultipleReadings && (
        <div className={styles.summary}>
          <span>
            {readingsWithCost.length} lecturas | Tarifa: {lastTariffCode}
          </span>
          <span className={styles.totalCost}>
            Costo final: {currencyFormatter.format(lastTotalCost)}
          </span>
        </div>
      )}
    </div>
  )
}

export default BillingPeriodCostChart
