import { useEffect, useState } from 'react'
import { Alert, Card, Col, Empty, Row, Select, Skeleton, Typography, message } from 'antd'
import ConsumptionForm from '../components/ConsumptionForm'
import ConsumptionTable from '../components/ConsumptionTable'
import MetricCard from '../components/MetricCard'
import { useHouseholds } from '../hooks/useHouseholds'
import { createConsumption, getDashboardConsumptions } from '../services/consumoService'
import styles from './InsertarConsumoPage.module.css'

function InsertarConsumoPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [latestItems, setLatestItems] = useState([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(null)

  const { households, isLoading: isLoadingHouseholds, error: householdsError } = useHouseholds()

  const loadHistory = async (householdId) => {
    setIsLoadingHistory(true)
    setError('')

    try {
      const updatedData = await getDashboardConsumptions({ householdId })
      setLatestItems(updatedData.items)
    } catch {
      setError('No fue posible cargar el historial del household seleccionado.')
      setLatestItems([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Auto-select the first household and load its history once households are ready.
  useEffect(() => {
    if (!isLoadingHouseholds && households.length > 0 && selectedHouseholdId === null) {
      const initialId = households[0].value
      setSelectedHouseholdId(initialId)
      loadHistory(initialId)
    }
    if (!isLoadingHouseholds && households.length === 0) {
      setIsLoadingHistory(false)
    }
    if (householdsError) {
      setError(householdsError)
      setIsLoadingHistory(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingHouseholds])

  const handleHouseholdChange = async (householdId) => {
    setSelectedHouseholdId(householdId)
    await loadHistory(householdId)
  }

  const handleSubmit = async (payload) => {
    setIsSubmitting(true)
    setSuccessMessage('')
    setError('')

    try {
      await createConsumption(payload)
      await loadHistory(payload.householdId)
      setSuccessMessage('Consumo guardado correctamente en el backend.')
      messageApi.success('Consumo registrado correctamente.')
      return true
    } catch {
      setError('No fue posible guardar el nuevo consumo.')
      messageApi.error('Error al guardar el consumo.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalLatestKwh = latestItems.reduce((accumulator, item) => accumulator + Number(item.kWh || 0), 0)
  const lastReadingDate = latestItems.at(-1)?.fecha || 'Sin lecturas'
  const initialReadingsCount = latestItems.filter((item) => item.isInitial).length

  return (
    <div className={styles.page}>
      {contextHolder}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>Registro manual</p>
          <Typography.Title level={2} className={styles.title}>
            Alta de lecturas de medidor
          </Typography.Title>
          <Typography.Paragraph className={styles.description}>
            Captura lecturas reales, marca lecturas iniciales y revisa al instante el historial del household seleccionado.
          </Typography.Paragraph>

          <Row
            gutter={[{ xs: 0, sm: 0, md: 12, lg: 12 }, 12]}
            align="middle"
            className={styles.filtersRow}
          >
            <Col xs={24} sm={24} md={10}>
              <Typography.Text strong>Household</Typography.Text>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Cambia el household para consultar y registrar lecturas en ese historial.
              </Typography.Paragraph>
            </Col>
            <Col xs={24} sm={24} md={14}>
              <Select
                style={{ width: '100%' }}
                value={selectedHouseholdId ?? undefined}
                onChange={handleHouseholdChange}
                options={households}
                loading={isLoadingHouseholds}
                placeholder="Selecciona un household"
                disabled={households.length === 0}
              />
            </Col>
          </Row>
        </div>

        <div className={styles.highlight}>
          <span>Ultima lectura registrada</span>
          <strong>{lastReadingDate}</strong>
          <p className={styles.totalCostLabel}>
            {latestItems.length} lecturas cargadas desde este flujo.
          </p>
        </div>
      </section>

      <Row
        gutter={[{ xs: 0, sm: 0, md: 12, lg: 12 }, 12]}
        className={styles.metricsRow}
      >
        <Col xs={24} sm={12} lg={8} className={styles.metricItem}>
          <MetricCard
            label="Lecturas cargadas"
            value={String(latestItems.length)}
            hint="Historial refrescado despues de cada registro"
            tone="accent"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} className={styles.metricItem}>
          <MetricCard
            label="kWh en historial"
            value={`${totalLatestKwh.toFixed(1)} kWh`}
            hint="Suma de lecturas visibles del household actual"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} className={styles.metricItem}>
          <MetricCard
            label="Lecturas iniciales"
            value={String(initialReadingsCount)}
            hint="Marcadas manualmente desde el formulario"
            tone="soft"
          />
        </Col>
      </Row>

      <ConsumptionForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        successMessage={successMessage}
        households={households}
        loadingHouseholds={isLoadingHouseholds}
        selectedHouseholdId={selectedHouseholdId}
        onHouseholdChange={handleHouseholdChange}
      />

      {error ? <Alert type="error" showIcon message={error} className={styles.error} /> : null}

      {isLoadingHistory ? (
        <Card className={styles.feedback}>
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ) : latestItems.length > 0 ? (
        <ConsumptionTable items={latestItems} />
      ) : (
        <Card className={styles.feedback}>
          <Empty description="Aun no hay historial cargado desde este formulario." />
        </Card>
      )}
    </div>
  )
}

export default InsertarConsumoPage