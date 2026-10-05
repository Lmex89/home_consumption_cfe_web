import { Column } from '@ant-design/charts'
import { useMemo } from 'react'
import { Empty } from 'antd'
import { getSeriesColor } from '../utils/tierColors'
import { formatFullReadingDate, formatReadingDate } from '../utils/billingPeriodUtils'
import { hasRoomForBarLabels } from '../utils/chartLayout'
import { useElementWidth } from '../hooks/useElementWidth'
import { useTheme } from '../contexts/ThemeContext'
import styles from './ConsumptionTable.module.css'

function formatKwhValue(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 'N/D'
  return `${numericValue.toFixed(1)} kWh`
}

function aggregateTierKwh(tierLines) {
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
    acc[key].value += Number(line.kwh_charged || 0)
    return acc
  }, {})

  return Object.values(totals).sort((a, b) => a.tierLevel - b.tierLevel)
}

function buildStackedRows(reading, index) {
  const cost = reading.billing_period_cost
  if (!cost) return []

  const breakdown = cost.cfe_breakdown
  const hasBreakdown = breakdown && Array.isArray(breakdown.tier_lines)
  const dateLabel = formatReadingDate(reading.date)
  const fullDate = formatFullReadingDate(reading.date)
  const totalConsumption = Number(cost.total_consumption_kwh)

  const rows = []

  if (hasBreakdown) {
    const tierRows = aggregateTierKwh(breakdown.tier_lines)
    tierRows.forEach((tier) => {
      if (tier.value > 0) {
        rows.push({
          dateLabel,
          fullDate,
          readingIndex: index + 1,
          series: tier.series,
          tierLevel: tier.tierLevel,
          value: tier.value,
        })
      }
    })
  } else if (Number.isFinite(totalConsumption)) {
    // Fallback when the API has no tier breakdown: show a single "Subtotal" bar.
    rows.push({
      dateLabel,
      fullDate,
      readingIndex: index + 1,
      series: 'Subtotal',
      tierLevel: 0,
      value: totalConsumption,
    })
  }

  return rows
}

/**
 * Chart component that displays kWh consumption from the dashboard API.
 * Shows a stacked breakdown of consumption by CFE tier (Básico, Intermedio,
 * Intermedio2, Excedente) across meter readings.
 *
 * @param {object} props
 * @param {Array} props.chartReadings - Array of readings from the meter-readings dashboard API
 *   Each reading should have: date, billing_period_cost.total_consumption_kwh,
 *   billing_period_cost.cfe_breakdown.tier_lines
 */
function MeterReadingsChart({ chartReadings }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [chartCanvasRef, chartCanvasWidth] = useElementWidth()
  
  // Theme-aware colors for chart elements (G2 doesn't inherit AntD theme)
  const axisLabelFill = isDark ? '#94a3b8' : '#475569'
  const barLabelFill = isDark ? '#cbd5e1' : '#64748b'
  const legendLabelFill = isDark ? '#e2e8f0' : '#1e293b'
  const chartData = useMemo(() => {
    if (!chartReadings || chartReadings.length === 0) return []

    return chartReadings
      .filter(
        (reading) =>
          reading.billing_period_cost?.total_consumption_kwh !== null &&
          reading.billing_period_cost?.total_consumption_kwh !== undefined,
      )
      .flatMap((reading, index) => buildStackedRows(reading, index))
      .filter((row) => Number.isFinite(row.value) && row.value > 0)
  }, [chartReadings])

  const maxTierLevel = useMemo(() => {
    const levels = chartData.map((row) => row.tierLevel).filter((level) => level > 0)
    return levels.length > 0 ? Math.max(...levels) : 0
  }, [chartData])

  // Series order and colors for the color scale. Kept in first-appearance
  // order (tiers by level, then the Subtotal fallback) so the legend and the
  // stacked segments stay aligned. @ant-design/plots v2 requires colorField
  // plus an explicit scale; the v1 `color` callback option is ignored by G2 v5.
  // NOTE: do NOT add seriesField back — the G2 interval mark uses the series
  // channel to dodge each series into its own thin sub-band (thin, offset
  // bars). stackY groups by the color channel, so colorField is enough.
  const seriesColorMap = useMemo(() => {
    const seen = new Set()
    const map = []
    chartData.forEach((row) => {
      if (seen.has(row.series)) return
      seen.add(row.series)
      map.push({ series: row.series, color: getSeriesColor(row.series, row.tierLevel, maxTierLevel) })
    })
    return map
  }, [chartData, maxTierLevel])

  if (chartData.length === 0) {
    return <Empty description="No hay lecturas para graficar." />
  }

  const readingCount = new Set(chartData.map((row) => row.readingIndex)).size
  const showBarLabels = hasRoomForBarLabels({
    containerWidth: chartCanvasWidth,
    readingCount,
    yAxisReserve: 80,
  })

  const chartConfig = {
    data: chartData,
    xField: 'dateLabel',
    yField: 'value',
    colorField: 'series',
    stack: true,
    autoFit: true,
    // Let G2 measure the fixed-height `.chartCanvas` wrapper below; without it
    // the chart falls back to a fixed 480px canvas on every viewport.
    containerStyle: { width: '100%', height: '100%' },
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
    // G2 v5 reads axes from `axis` (the v1 `xAxis`/`yAxis` keys are ignored).
    axis: {
      x: {
        title: false,
        labelFill: axisLabelFill,
        labelAutoRotate: true,
        labelAutoHide: { keepHeader: true, keepTail: true },
        labelFormatter: (value) => value,
      },
      y: {
        title: false,
        labelFill: axisLabelFill,
        labelFormatter: (value) => formatKwhValue(value),
      },
    },
    // G2 v5 uses tooltip `items[].valueFormatter`; the v1 `formatter` key is
    // ignored and would leak raw floating-point values into the tooltip.
    tooltip: {
      title: (datum) => datum?.fullDate ?? datum?.dateLabel ?? '',
      items: [
        {
          // `field` reads the raw datum, not the post-`stackY` cumulative
          // `y` channel value.
          field: 'value',
          valueFormatter: (value) => formatKwhValue(value),
        },
      ],
    },
    legend: {
      position: 'top',
      itemLabelFill: legendLabelFill,
      itemLabelFontSize: 10,
      itemMarkerSize: 8,
      itemSpacing: [6, 4],
      rowPadding: 2,
    },
    label: showBarLabels
      ? {
          position: 'top',
          // G2 v5 calls label formatters with the resolved text value (not the
          // v1 datum object); a datum-style callback would return ''.
          formatter: (value) => {
            const numericValue = Number(value)
            if (!Number.isFinite(numericValue) || numericValue === 0) return ''
            return formatKwhValue(numericValue)
          },
          style: {
            fontSize: 10,
            fill: barLabelFill,
          },
        }
      : false,
  }

  return (
    <div className={styles.chartArea}>
      <div className={styles.chartHeader}>
        <p className={styles.eyebrow}>Consumo del período</p>
        <p className={styles.caption}>
          Progresión del consumo acumulado desde la primera lectura hasta cada lectura,
          desglosado por rango de tarifa
        </p>
      </div>
      <div ref={chartCanvasRef} className={styles.chartCanvas}>
        <Column {...chartConfig} />
      </div>
    </div>
  )
}

export default MeterReadingsChart
