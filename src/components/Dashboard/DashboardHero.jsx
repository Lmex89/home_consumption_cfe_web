import { Col, Row, Select, Typography } from 'antd'
import styles from './DashboardHero.module.css'

function DashboardHero({
  selectedHouseholdId,
  selectedBillingPeriodId,
  households,
  billingPeriods,
  isLoading,
  onHouseholdChange,
  onBillingPeriodChange,
}) {
  return (
    <section className={styles.hero} aria-labelledby="dashboard-title">
      <div className={styles.heroAmbient} aria-hidden="true" />
      <div className={styles.heroNoise} aria-hidden="true" />

      <div className={`${styles.heroContent} ${styles.revealUp}`}>
        <p className={styles.eyebrow}>Dashboard principal</p>
        <Typography.Title id="dashboard-title" level={2} className={styles.title}>
          Seguimiento diario del consumo electrico
        </Typography.Title>
        <Typography.Paragraph className={styles.description}>
          Consulta el hogar activo, revisa métricas de consumo y edita lecturas recientes desde una sola vista.
        </Typography.Paragraph>

        <fieldset className={styles.filterFieldset}>
          <legend className={styles.filterLegend}>Filtros del dashboard</legend>
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
                onChange={onHouseholdChange}
                options={households}
                loading={isLoading}
                placeholder="Selecciona un household"
                aria-label="Seleccionar hogar activo"
                aria-describedby="household-description"
              />
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Select
                className={styles.selectField}
                style={{ width: '100%' }}
                value={selectedBillingPeriodId ?? undefined}
                onChange={onBillingPeriodChange}
                options={billingPeriods}
                loading={isLoading}
                placeholder="Selecciona un periodo de facturacion"
                disabled={billingPeriods.length === 0}
                aria-label="Seleccionar período de facturación"
                aria-describedby="period-description"
              />
            </Col>
          </Row>
        </fieldset>
      </div>
    </section>
  )
}

export default DashboardHero
