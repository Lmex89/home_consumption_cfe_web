import { useState } from 'react'
import { Alert, Card, Empty, Space, Statistic, Typography, message } from 'antd'
import ConsumptionForm from '../components/ConsumptionForm'
import ConsumptionTable from '../components/ConsumptionTable'
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

  return (
    <div className={styles.page}>
      {contextHolder}
      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>Registro manual</p>
          <Typography.Title level={2} className={styles.title}>
            Alta de lecturas de medidor
          </Typography.Title>
          <Typography.Paragraph className={styles.description}>
            Captura lecturas reales, marca lecturas iniciales y revisa al instante el historial del household seleccionado.
          </Typography.Paragraph>
        </div>

        <Space size={12} wrap>
          <Card size="small">
            <Statistic title="Lecturas cargadas" value={latestItems.length} />
          </Card>
          <Card size="small">
            <Statistic title="kWh en historial" value={totalLatestKwh.toFixed(1)} suffix="kWh" />
          </Card>
          <Card size="small">
            <Statistic title="Ultima fecha" value={lastReadingDate} />
          </Card>
        </Space>
      </section>

      <ConsumptionForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        successMessage={successMessage}
      />

      {error ? <Alert type="error" showIcon message={error} /> : null}

      {latestItems.length > 0 ? (
        <ConsumptionTable items={latestItems} />
      ) : (
        <Card>
          <Empty description="Aun no hay historial cargado desde este formulario." />
        </Card>
      )}
    </div>
  )
}

export default InsertarConsumoPage