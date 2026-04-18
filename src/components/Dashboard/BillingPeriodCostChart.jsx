import { Column } from '@ant-design/charts'
import { Empty } from 'antd'
import { useMemo } from 'react'
import styles from './BillingPeriodCostChart.module.css'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

function formatFullDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Chart component that displays billing period costs from the dashboard API.
 * Shows cumulative cost progression across meter readings within a billing period.
 *
 * @param {object} props
 * @param {Array} props.readings - Array of readings from the meter-readings dashboard API
 *   Each reading should have: reading_date, billing_period_cost.total_cost
 */
function BillingPeriodCostChart({ readings }) {
  const chartData = useMemo(() => {
    if (!readings || readings.length === 0) return []

    return readings
      .filter((reading) => reading.billing_period_cost?.total_cost !== null && reading.billing_period_cost?.total_cost !== undefined)
      .map((reading, index) => ({
        date: reading.date,
        dateLabel: formatFullDate(reading.date),
        totalCost: Number(reading.billing_period_cost.total_cost),
        totalConsumption: Number(reading.billing_period_cost.total_consumption_kwh || 0),
        readingIndex: index + 1,
        tariffCode: reading.billing_period_cost.tariff_code || 'N/D',
      }))
      .filter((point) => Number.isFinite(point.totalCost))
  }, [readings])

  if (chartData.length === 0) {
    return <Empty description="No hay datos de costos disponibles para graficar." />
  }

  const hasMultipleReadings = chartData.length > 1
  const chartConfig = {
    data: chartData,
    xField: 'dateLabel',
    yField: 'totalCost',
    autoFit: true,
    label: hasMultipleReadings
      ? {
          text: 'totalCost',
          formatter: (v) => {
            const value = v?.totalCost
            if (value === null || value === undefined) return ''
            return currencyFormatter.format(value)
          },
          style: {
            fontSize: 11,
            fill: '#64748b',
          },
        }
      : false,
    axis: {
      x: {
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
      y: {
        label: {
          formatter: (value) => currencyFormatter.format(Number(value)),
        },
        title: 'Costo acumulado (MXN)',
      },
    },
    style: {
      fill: ({ totalCost }) => {
        const maxCost = Math.max(...chartData.map((d) => d.totalCost))
        const ratio = maxCost > 0 ? totalCost / maxCost : 0
        // Gradient from light blue to dark blue based on cost
        const lightness = 85 - ratio * 40
        return `hsl(217, 89%, ${lightness}%)`
      },
      radius: 6,
    },
    tooltip: {
      title: (title) => title,
      items: [
        {
          channel: 'y',
          name: 'Costo acumulado',
          valueFormatter: (value) => currencyFormatter.format(Number(value)),
        },
        {
          channel: 'totalConsumption',
          name: 'Consumo acumulado',
          valueFormatter: (value) => `${Number(value).toFixed(1)} kWh`,
        },
      ],
    },
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
          Progresión del costo acumulado desde la primera lectura hasta cada lectura successiva
        </p>
      </div>
      <Column {...chartConfig} />
      {hasMultipleReadings && (
        <div className={styles.summary}>
          <span>
            {chartData.length} lecturas | Tarifa: {chartData[chartData.length - 1].tariffCode}
          </span>
          <span className={styles.totalCost}>
            Costo final: {currencyFormatter.format(chartData[chartData.length - 1].totalCost)}
          </span>
        </div>
      )}
    </div>
  )
}

export default BillingPeriodCostChart
