import { useState } from 'react'
import { Alert, Card, Empty, Typography, message } from 'antd'
import ConsumptionForm from '../components/ConsumptionForm'
import ConsumptionTable from '../components/ConsumptionTable'
import MetricCard from '../components/MetricCard'
import { createConsumption, getDashboardConsumptions } from '../services/consumoService'
import styles from './InsertarConsumoPage.module.css'

function InsertarConsumoPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [latestItems, setLatestItems] = useState([])

  const handleSubmit = async (payload) => {
    setIsSubmitting(true)
    setSuccessMessage('')
    setError('')

    try {
      await createConsumption(payload)
      const updatedData = await getDashboardConsumptions({
        householdId: payload.householdId,
      })

      setLatestItems(updatedData.items)
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
        </div>

        <div className={styles.highlight}>
          <span>Ultima lectura registrada</span>
          <strong>{lastReadingDate}</strong>
          <p className={styles.totalCostLabel}>
            {latestItems.length} lecturas cargadas desde este flujo.
          </p>
        </div>
      </section>

      <div className={styles.metrics}>
        <div className={styles.metricItem}>
          <MetricCard
            label="Lecturas cargadas"
            value={String(latestItems.length)}
            hint="Historial refrescado despues de cada registro"
            tone="accent"
          />
        </div>
        <div className={styles.metricItem}>
          <MetricCard
            label="kWh en historial"
            value={`${totalLatestKwh.toFixed(1)} kWh`}
            hint="Suma de lecturas visibles del household actual"
          />
        </div>
        <div className={styles.metricItem}>
          <MetricCard
            label="Lecturas iniciales"
            value={String(initialReadingsCount)}
            hint="Marcadas manualmente desde el formulario"
            tone="soft"
          />
        </div>
      </div>

      <ConsumptionForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        successMessage={successMessage}
      />

      {error ? <Alert type="error" showIcon message={error} className={styles.error} /> : null}

      {latestItems.length > 0 ? (
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