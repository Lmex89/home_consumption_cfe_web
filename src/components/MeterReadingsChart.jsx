import { Column } from '@ant-design/charts'
import { useMemo } from 'react'
import { Empty } from 'antd'
import styles from './ConsumptionTable.module.css'

function formatShortDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
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
    color: ['#3b82f6', '#f59e0b'],
    columnWidthRatio: 0.6,
    xAxis: {
      label: {
        autoRotate: true,
        formatter: (value) => value,
      },
    },
    yAxis: {
      label: {
        formatter: (value) => `${Number(value).toFixed(1)} kWh`,
      },
    },
    tooltip: {
      title: (title) => title,
      formatter: (datum) => ({
        name: datum.type,
        value: `${Number(datum.value).toFixed(1)} kWh`,
      }),
    },
    legend: {
      position: 'top',
    },
    label: {
      position: 'top',
      formatter: (datum) => `${Number(datum.value).toFixed(1)} kWh`,
      style: {
        fontSize: 10,
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
