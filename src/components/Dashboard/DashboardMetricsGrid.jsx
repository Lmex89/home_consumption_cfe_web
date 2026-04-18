import { Col, Row } from 'antd'
import MetricCard from '../MetricCard'
import styles from './DashboardMetricsGrid.module.css'

function DashboardMetricsGrid({ summary, itemsCount }) {
  return (
    <section 
      className={styles.metricsSection}
      aria-label="Métricas de consumo"
    >
      <Row
        gutter={[{ xs: 0, sm: 0, md: 12, lg: 12 }, 12]}
        className={styles.metricsRow}
        role="list"
      >
        <Col xs={24} sm={12} lg={6} className={styles.metricItem} role="listitem">
          <MetricCard
            label="Consumo actual"
            value={`${summary.current.toFixed(1)} kWh`}
            hint={`Fecha de lectura: ${summary.currentDate}`}
            tone="accent"
          />
        </Col>
        <Col xs={24} sm={12} lg={6} className={styles.metricItem} role="listitem">
          <MetricCard
            label="Consumo anterior"
            value={`${summary.previous.toFixed(1)} kWh`}
            hint={`Comparativo inmediato: ${summary.difference >= 0 ? '+' : ''}${summary.difference.toFixed(1)} kWh`}
            tone="soft"
          />
        </Col>
        <Col xs={24} sm={12} lg={6} className={styles.metricItem} role="listitem">
          <MetricCard
            label="Promedio"
            value={`${summary.average.toFixed(1)} kWh`}
            hint={`Basado en ${itemsCount} mediciones`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6} className={styles.metricItem} role="listitem">
          <MetricCard
            label="Maximo registrado"
            value={`${summary.max.toFixed(1)} kWh`}
            hint={`Minimo registrado: ${summary.min.toFixed(1)} kWh`}
            tone="accent"
          />
        </Col>
      </Row>
    </section>
  )
}

export default DashboardMetricsGrid
