import { useEffect, useState } from 'react'
import {
  Alert,
  Card,
  Col,
  Collapse,
  Empty,
  Row,
  Select,
  Skeleton,
  Space,
  Typography,
} from 'antd'
import ConsumptionTable from '../components/ConsumptionTable'
import MetricCard from '../components/MetricCard'
import { getDashboardConsumptions, listHouseholds } from '../services/consumoService'
import styles from './DashboardPage.module.css'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [households, setHouseholds] = useState([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async (householdId) => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getDashboardConsumptions({
        householdId,
      })
      setDashboardData(data)
    } catch {
      setError('No fue posible cargar los datos del dashboard.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      setIsLoading(true)
      setError('')

      try {
        const availableHouseholds = await listHouseholds()
        if (!isMounted) {
          return
        }

        setHouseholds(availableHouseholds)

        const hasDefaultHousehold = availableHouseholds.some((household) => household.value === 1)
        const initialHouseholdId = hasDefaultHousehold
          ? 1
          : (availableHouseholds[0]?.value ?? 1)

        setSelectedHouseholdId(initialHouseholdId)

        const data = await getDashboardConsumptions({ householdId: initialHouseholdId })
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
  }, [])

  const handleHouseholdChange = async (householdId) => {
    setSelectedHouseholdId(householdId)
    await loadDashboard(householdId)
  }

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
    )
  }

  if (error) {
    return <Alert type="error" showIcon message={error} />
  }

  if (!dashboardData) {
    return <Empty description="No hay datos disponibles" />
  }

  const { items, summary, billing } = dashboardData

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card className={styles.selectorCard}>
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} md={8}>
            <Typography.Text strong>Household</Typography.Text>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Selecciona el hogar para ver dashboard y staff.
            </Typography.Paragraph>
          </Col>
          <Col xs={24} md={16}>
            <Select
              style={{ width: '100%' }}
              value={selectedHouseholdId}
              onChange={handleHouseholdChange}
              options={households}
              loading={isLoading}
              placeholder="Selecciona un household"
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Space direction="vertical" size={4} style={{ display: 'flex' }}>
          <Typography.Text type="secondary">Dashboard principal</Typography.Text>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Seguimiento diario del consumo electrico
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Resumen con consumo actual, lectura anterior, promedio y total acumulado desde endpoints reales de FastAPI.
          </Typography.Paragraph>
          <Typography.Text strong>
            Costo total estimado: {currencyFormatter.format(billing.totalMxn)}
          </Typography.Text>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card className={styles.billingCard}>
            <Typography.Text className={styles.billingCardLabel}>
              Total facturado estimado
            </Typography.Text>
            <Typography.Title level={2} className={styles.billingCardValue}>
              {currencyFormatter.format(billing.totalMxn)}
            </Typography.Title>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <MetricCard
            label="Consumo actual"
            value={`${summary.current.toFixed(1)} kWh`}
            hint={`Fecha de lectura: ${summary.currentDate}`}
          />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <MetricCard
            label="Consumo anterior"
            value={`${summary.previous.toFixed(1)} kWh`}
            hint={`Comparativo inmediato: ${summary.difference >= 0 ? '+' : ''}${summary.difference.toFixed(1)} kWh`}
          />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <MetricCard
            label="Promedio"
            value={`${summary.average.toFixed(1)} kWh`}
            hint={`Basado en ${items.length} mediciones`}
          />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <MetricCard
            label="Maximo registrado"
            value={`${summary.max.toFixed(1)} kWh`}
            hint={`Minimo registrado: ${summary.min.toFixed(1)} kWh`}
          />
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'billing-breakdown',
            label: 'Ver desglose del total en MXN',
            children: (
              <Space direction="vertical" style={{ display: 'flex' }}>
                {billing.breakdown.length > 0 ? (
                  billing.breakdown.map((line) => (
                    <Row key={line.concept} justify="space-between">
                      <Typography.Text type="secondary">{line.concept}</Typography.Text>
                      <Typography.Text strong>{currencyFormatter.format(line.amount)}</Typography.Text>
                    </Row>
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

      <ConsumptionTable items={items} />
    </Space>
  )
}

export default DashboardPage