import { Column } from '@ant-design/charts'
import { useMemo } from 'react'
import { Empty } from 'antd'
import { getSeriesColor } from '../utils/tierColors'
import styles from './ConsumptionTable.module.css'

function formatKwhValue(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 'N/D'
  return `${numericValue.toFixed(1)} kWh`
}

function formatShortDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
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
  const dateLabel = formatShortDate(reading.date)
  const totalConsumption = Number(cost.total_consumption_kwh)

  const rows = []

  if (hasBreakdown) {
    const tierRows = aggregateTierKwh(breakdown.tier_lines)
    tierRows.forEach((tier) => {
      if (tier.value > 0) {
        rows.push({
          dateLabel,
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

  const hasMultipleReadings = new Set(chartData.map((row) => row.readingIndex)).size > 1

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
        formatter: (value) => value,
      },
    },
    yAxis: {
      label: {
        formatter: (value) => formatKwhValue(value),
      },
    },
    tooltip: {
      title: (title) => title,
      formatter: (datum) => ({
        name: datum?.series,
        value: formatKwhValue(datum?.value),
      }),
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
            return formatKwhValue(value)
          },
          style: {
            fontSize: 10,
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
      <Column {...chartConfig} />
    </div>
  )
}

export default MeterReadingsChart
