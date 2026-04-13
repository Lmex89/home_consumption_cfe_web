import { DualAxes } from '@ant-design/charts'
import { useMemo, useState } from 'react'
import { Empty, Segmented } from 'antd'
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
  const seriesOptions = [
    {
      label: 'Consumo entre lecturas',
      value: 'consumption',
    },
    {
      label: 'Lectura acumulada',
      value: 'reading',
    },
  ]
  const [visibleSeries, setVisibleSeries] = useState('consumption')

  const readingSeriesData = chartReadings
    .map((reading) => ({
      date: reading.date,
      value: Number(reading.readingKwh),
      series: 'Lectura acumulada (kWh)',
      estimatedCost: reading.estimatedCost,
    }))
    .filter((point) => Number.isFinite(point.value))

  const consumptionSeriesData = chartReadings
    .filter((reading) => reading.consumptionSinceLast !== null && reading.consumptionSinceLast !== undefined)
    .map((reading) => ({
      date: reading.date,
      value: Number(reading.consumptionSinceLast),
      series: 'Consumo entre lecturas (kWh)',
      estimatedCost: reading.estimatedCost,
    }))
    .filter((point) => Number.isFinite(point.value))

  const chartData = useMemo(() => {
    if (visibleSeries === 'reading') {
      return [readingSeriesData, []]
    }

    if (visibleSeries === 'consumption') {
      return [[], consumptionSeriesData]
    }

    return [readingSeriesData, consumptionSeriesData]
  }, [consumptionSeriesData, readingSeriesData, visibleSeries])

  if (readingSeriesData.length === 0 && consumptionSeriesData.length === 0) {
    return <Empty description="No hay lecturas para graficar." />
  }

  const chartConfig = {
    data: chartData,
    xField: 'date',
    yField: ['value', 'value'],
    autoFit: true,
    smooth: false,
    geometryOptions: [
      {
        geometry: 'line',
        seriesField: 'series',
        color: '#2563eb',
        lineStyle: {
          lineWidth: 2.8,
        },
        point: {
          size: 3.5,
          shape: 'circle',
        },
      },
      {
        geometry: 'line',
        seriesField: 'series',
        color: '#f59e0b',
        lineStyle: {
          lineWidth: 2.8,
        },
        point: {
          size: 3.5,
          shape: 'circle',
        },
      },
    ],
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
    yAxis: [
      {
        title: {
          text: 'Lectura acumulada',
        },
        label: {
          formatter: (value) => `${Number(value).toFixed(1)} kWh`,
        },
      },
      {
        title: {
          text: 'Consumo entre lecturas',
        },
        label: {
          formatter: (value) => `${Number(value).toFixed(1)} kWh`,
        },
      },
    ],
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
      <div className={styles.chartControls}>
        <Segmented options={seriesOptions} value={visibleSeries} onChange={setVisibleSeries} />
      </div>
      <DualAxes {...chartConfig} />
    </div>
  )
}

export default MeterReadingsChart
