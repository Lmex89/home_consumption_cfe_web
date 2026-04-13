import { Line } from '@ant-design/charts'
import { Empty } from 'antd'
import styles from './ConsumptionTable.module.css'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

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
  const lineData = chartReadings.flatMap((reading) => {
    const points = [
      {
        date: reading.date,
        value: Number(reading.readingKwh),
        series: 'Lectura (kWh)',
        estimatedCost: reading.estimatedCost,
      },
    ]

    if (reading.consumptionSinceLast !== null && reading.consumptionSinceLast !== undefined) {
      points.push({
        date: reading.date,
        value: Number(reading.consumptionSinceLast),
        series: 'Consumo entre lecturas (kWh)',
        estimatedCost: reading.estimatedCost,
      })
    }

    return points
  })

  if (lineData.length === 0) {
    return <Empty description="No hay lecturas para graficar." />
  }

  const chartConfig = {
    data: lineData,
    xField: 'date',
    yField: 'value',
    seriesField: 'series',
    autoFit: true,
    smooth: false,
    point: {
      size: 3,
      shape: 'circle',
    },
    legend: {
      position: 'top',
    },
    xAxis: {
      label: {
        formatter: (value) =>
          new Date(value).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
          }),
      },
    },
    yAxis: {
      label: {
        formatter: (value) => `${Number(value).toFixed(1)} kWh`,
      },
    },
    tooltip: {
      title: (title) => formatFullDate(title),
      formatter: (datum) => ({
        name: datum.series,
        value: `${Number(datum.value).toFixed(1)} kWh | Costo estimado: ${
          datum.estimatedCost === null || datum.estimatedCost === undefined
            ? 'N/D'
            : currencyFormatter.format(Number(datum.estimatedCost))
        }`,
      }),
    },
  }

  return (
    <div className={styles.chartArea}>
      <Line {...chartConfig} />
    </div>
  )
}

export default MeterReadingsChart
