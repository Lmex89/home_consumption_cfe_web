import { useEffect, useState } from 'react'
import {
  Alert,
  Col,
  Collapse,
  Empty,
  Flex,
  Skeleton,
  Row,
  Select,
  Space,
  Typography,
} from 'antd'
import ConsumptionTable from '../components/ConsumptionTable'
import MetricCard from '../components/MetricCard'
import { useHouseholds } from '../hooks/useHouseholds'
import {
  fetchAllMeterReadings,
  getDashboardConsumptions,
  listBillingPeriods,
  updateConsumption,
} from '../services/consumoService'
import styles from './DashboardPage.module.css'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [billingPeriods, setBillingPeriods] = useState([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(null)
  const [selectedBillingPeriodId, setSelectedBillingPeriodId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [allItems, setAllItems] = useState(null)
  const [isLoadingAll, setIsLoadingAll] = useState(false)

  const { households, isLoading: isLoadingHouseholds } = useHouseholds()

  const loadDashboard = async ({ householdId, billingPeriodId }) => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getDashboardConsumptions({
        householdId,
        billingPeriodId,
      })
      setDashboardData(data)
    } catch {
      setError('No fue posible cargar los datos del dashboard.')
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize billing periods and first dashboard load once households are ready.
  useEffect(() => {
    if (isLoadingHouseholds || households.length === 0) return

    let isMounted = true

    const initialize = async () => {
      setIsLoading(true)
      setError('')

      try {
        const hasDefaultHousehold = households.some((h) => h.value === 1)
        const initialHouseholdId = hasDefaultHousehold ? 1 : (households[0]?.value ?? 1)

        const periods = await listBillingPeriods(initialHouseholdId)
        const initialBillingPeriodId = periods[0]?.value ?? null

        if (!isMounted) return

        setSelectedHouseholdId(initialHouseholdId)
        setBillingPeriods(periods)
        setSelectedBillingPeriodId(initialBillingPeriodId)

        const data = await getDashboardConsumptions({
          householdId: initialHouseholdId,
          billingPeriodId: initialBillingPeriodId,
        })
        if (isMounted) {
          setDashboardData(data)
        }
      } catch {
        if (isMounted) {
          setError('No fue posible cargar los datos del dashboard.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingHouseholds])

  const handleHouseholdChange = async (householdId) => {
    setSelectedHouseholdId(householdId)
    setAllItems(null) // Reset all items when household changes

    try {
      const periods = await listBillingPeriods(householdId)
      const nextBillingPeriodId = periods[0]?.value ?? null

      setBillingPeriods(periods)
      setSelectedBillingPeriodId(nextBillingPeriodId)
      await loadDashboard({ householdId, billingPeriodId: nextBillingPeriodId })
    } catch {
      setBillingPeriods([])
      setSelectedBillingPeriodId(null)
      await loadDashboard({ householdId, billingPeriodId: null })
    }
  }

  const handleBillingPeriodChange = async (billingPeriodId) => {
    setSelectedBillingPeriodId(billingPeriodId)
    setAllItems(null) // Reset all items when billing period changes
    await loadDashboard({ householdId: selectedHouseholdId, billingPeriodId })
  }

  const handleUpdateReading = async (meterReadingId, values) => {
    await updateConsumption(meterReadingId, values)
    await loadDashboard({
      householdId: selectedHouseholdId,
      billingPeriodId: selectedBillingPeriodId,
    })
    // Reload all items if they are being displayed
    if (allItems) {
      await handleLoadAllItems()
    }
  }

  const handleLoadAllItems = async () => {
    if (!selectedHouseholdId) return

    setIsLoadingAll(true)
    try {
      const readings = await fetchAllMeterReadings(selectedHouseholdId)
      setAllItems(readings)
    } catch {
      setError('No fue posible cargar todas las lecturas.')
    } finally {
      setIsLoadingAll(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.feedback}>
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    )
  }

  if (error) {
    return <Alert type="error" showIcon message={error} className={styles.error} />
  }

  if (!dashboardData) {
    return <Empty description="No hay datos disponibles" className={styles.feedback} />
  }

  const { items, summary, billing } = dashboardData

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroAmbient} aria-hidden="true" />
        <div className={styles.heroNoise} aria-hidden="true" />

        <div className={`${styles.heroContent} ${styles.revealUp}`}>
          <p className={styles.eyebrow}>Dashboard principal</p>
          <Typography.Title level={2} className={styles.title}>
            Seguimiento diario del consumo electrico
          </Typography.Title>
          <Typography.Paragraph className={styles.description}>
            Consulta el hogar activo, revisa métricas de consumo y edita lecturas recientes desde una sola vista.
          </Typography.Paragraph>

          <Row
            gutter={[{ xs: 0, sm: 0, md: 12, lg: 12 }, 12]}
            align="middle"
            className={styles.filterRow}
          >
            <Col xs={24} sm={24} md={8}>
              <div className={styles.filterIntro}>
                <Typography.Text strong>Household activo</Typography.Text>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Selecciona el hogar para actualizar el dashboard y la tabla de lecturas.
                </Typography.Paragraph>
              </div>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Select
                className={styles.selectField}
                style={{ width: '100%' }}
                value={selectedHouseholdId}
                onChange={handleHouseholdChange}
                options={households}
                loading={isLoading}
                placeholder="Selecciona un household"
              />
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Select
                className={styles.selectField}
                style={{ width: '100%' }}
                value={selectedBillingPeriodId ?? undefined}
                onChange={handleBillingPeriodChange}
                options={billingPeriods}
                loading={isLoading}
                placeholder="Selecciona un periodo de facturacion"
                disabled={billingPeriods.length === 0}
              />
            </Col>
          </Row>
        </div>

        <div className={`${styles.highlight} ${styles.revealUp} ${styles.revealUpDelay}`}>
          <span className={styles.highlightLabel}>Total estimado del periodo</span>
          <strong>{currencyFormatter.format(billing.totalMxn)}</strong>
          <p className={styles.totalCostLabel}>
            {items.length} lecturas disponibles para el periodo seleccionado.
          </p>
        </div>
      </section>

      <Row
        gutter={[{ xs: 0, sm: 0, md: 12, lg: 12 }, 12]}
        className={styles.metricsRow}
      >
        <Col xs={24} sm={12} lg={6} className={styles.metricItem}>
          <MetricCard
            label="Consumo actual"
            value={`${summary.current.toFixed(1)} kWh`}
            hint={`Fecha de lectura: ${summary.currentDate}`}
            tone="accent"
          />
        </Col>
        <Col xs={24} sm={12} lg={6} className={styles.metricItem}>
          <MetricCard
            label="Consumo anterior"
            value={`${summary.previous.toFixed(1)} kWh`}
            hint={`Comparativo inmediato: ${summary.difference >= 0 ? '+' : ''}${summary.difference.toFixed(1)} kWh`}
            tone="soft"
          />
        </Col>
        <Col xs={24} sm={12} lg={6} className={styles.metricItem}>
          <MetricCard
            label="Promedio"
            value={`${summary.average.toFixed(1)} kWh`}
            hint={`Basado en ${items.length} mediciones`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6} className={styles.metricItem}>
          <MetricCard
            label="Maximo registrado"
            value={`${summary.max.toFixed(1)} kWh`}
            hint={`Minimo registrado: ${summary.min.toFixed(1)} kWh`}
            tone="accent"
          />
        </Col>
      </Row>

      <div className={styles.breakdown}>
        <Collapse
          className={styles.breakdownCollapse}
          bordered={false}
          items={[
            {
              key: 'billing-breakdown',
              label: 'Ver desglose del total en MXN',
              children: (
                <Space direction="vertical" style={{ display: 'flex' }}>
                  {billing.breakdown.length > 0 ? (
                    billing.breakdown.map((line) => (
                      <Flex key={line.concept} justify="space-between" align="center">
                        <Typography.Text type="secondary">{line.concept}</Typography.Text>
                        <Typography.Text strong>{currencyFormatter.format(line.amount)}</Typography.Text>
                      </Flex>
                    ))
                  ) : (
                    <Typography.Text type="secondary">
                      No hay desglose disponible para el periodo de facturacion actual.
                    </Typography.Text>
                  )}
                  <Typography.Text strong>
                    Total facturado estimado: {currencyFormatter.format(billing.totalMxn)}
                  </Typography.Text>
                </Space>
              ),
            },
          ]}
        />
      </div>

      <ConsumptionTable
        items={items}
        allItems={allItems}
        onUpdateItem={handleUpdateReading}
        onLoadAllItems={handleLoadAllItems}
        isLoadingAll={isLoadingAll}
      />
    </div>
  )
}

export default DashboardPage