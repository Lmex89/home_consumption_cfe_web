import { Column } from '@ant-design/charts'
import { useMemo } from 'react'
import { Empty } from 'antd'
import styles from './ConsumptionTable.module.css'

function formatShortDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function formatFullDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function MeterReadingsChart({ chartReadings }) {
  const chartData = useMemo(() => {
    const filtered = chartReadings.filter(
      (reading) => reading.consumptionSinceLast !== null && reading.consumptionSinceLast !== undefined,
    )

    return filtered.flatMap((reading) => {
      const points = [
        {
          date: reading.date,
          dateLabel: formatShortDate(reading.date),
          type: 'Entre lecturas',
          value: Number(reading.consumptionSinceLast),
        },
      ]

      const accumulated = reading.billing_period_cost?.total_consumption_kwh
      if (accumulated !== null && accumulated !== undefined) {
        points.push({
          date: reading.date,
          dateLabel: formatShortDate(reading.date),
          type: 'Acumulado',
          value: Number(accumulated),
        })
      }

      return points
    }).filter((point) => Number.isFinite(point.value))
  }, [chartReadings])

  if (chartData.length === 0) {
    return <Empty description="No hay lecturas para graficar." />
  }

  const chartConfig = {
    data: chartData,
    xField: 'dateLabel',
    yField: 'value',
    seriesField: 'type',
    isGroup: true,
    autoFit: true,
    color: ({ type }) => (type === 'Entre lecturas' ? '#3b82f6' : '#f59e0b'),
    axis: {
      x: {
        label: {
          autoRotate: true,
          autoHide: { type: 'equidistance', cfg: { minGap: 60 } },
        },
        title: 'Fecha de lectura',
      },
      y: {
        label: {
          formatter: (value) => `${Number(value).toFixed(1)} kWh`,
        },
        title: 'Consumo (kWh)',
      },
    },
    style: {
      radius: 6,
    },
    tooltip: {
      title: (title) => title,
      items: [
        {
          channel: 'y',
          name: 'Consumo',
          valueFormatter: (value) => `${Number(value).toFixed(1)} kWh`,
        },
      ],
    },
    legend: {
      position: 'top',
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
      <Column {...chartConfig} />
    </div>
  )
}

export default MeterReadingsChart
