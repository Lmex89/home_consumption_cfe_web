import { useEffect, useState } from 'react'
import { Alert, Card, Col, Collapse, Empty, Row, Skeleton, Space, Typography } from 'antd'
import ConsumptionTable from '../components/ConsumptionTable'
import MetricCard from '../components/MetricCard'
import { getDashboardConsumptions } from '../services/consumoService'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getDashboardConsumptions()
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

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

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
      <Card>
        <Space direction="vertical" size={4} style={{ display: 'flex' }}>
          <Typography.Text type="secondary">Dashboard principal</Typography.Text>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Seguimiento diario del consumo electrico
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Resumen con consumo actual, lectura anterior, promedio y total acumulado a partir de un API GET simulado.
          </Typography.Paragraph>
          <Typography.Text strong>
            Costo total estimado: {currencyFormatter.format(billing.totalMxn)}
          </Typography.Text>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
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
                {billing.breakdown.map((line) => (
                  <Row key={line.concept} justify="space-between">
                    <Typography.Text type="secondary">{line.concept}</Typography.Text>
                    <Typography.Text strong>{currencyFormatter.format(line.amount)}</Typography.Text>
                  </Row>
                ))}
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