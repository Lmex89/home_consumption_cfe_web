import { Alert, Card, Space, Typography, message } from 'antd'
import { useState } from 'react'
import AddBillingPeriodForm from '../components/AddBillingPeriodForm'
import SectionCard from '../components/ui/SectionCard'
import { createBillingPeriod } from '../services/consumoService'
import styles from './AddBillingPeriodPage.module.css'

function AddBillingPeriodPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [createdPeriod, setCreatedPeriod] = useState(null)

  const handleSubmit = async (payload) => {
    setIsSubmitting(true)
    setSuccessMessage('')
    setError('')

    try {
      const result = await createBillingPeriod(
        payload.householdId,
        payload.startDate,
        payload.endDate,
      )

      setCreatedPeriod(result)
      setSuccessMessage(
        `Periodo de facturación creado correctamente: ${result.start_date} — ${result.end_date}.`,
      )
      messageApi.success('Periodo de facturación registrado correctamente.')
      return true
    } catch (err) {
      const errorMessage = err.message || 'No fue posible guardar el periodo de facturación.'
      setError(errorMessage)
      messageApi.error(errorMessage)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }} className={styles.page}>
      {contextHolder}
      <SectionCard
        eyebrow="Administración"
        title="Alta de periodos de facturación"
        description="Registra nuevos periodos de facturación asociados a una vivienda en el backend FastAPI."
        level={3}
      />

      <AddBillingPeriodForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        successMessage={successMessage}
      />

      {error ? <Alert type="error" showIcon message={error} /> : null}

      {createdPeriod ? (
        <Card title="Periodo creado" type="inner" className={styles.createdCard}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Text>
              <strong>ID:</strong> {createdPeriod.id}
            </Typography.Text>
            <Typography.Text>
              <strong>Vivienda ID:</strong> {createdPeriod.household_id}
            </Typography.Text>
            <Typography.Text>
              <strong>Inicio:</strong> {createdPeriod.start_date}
            </Typography.Text>
            <Typography.Text>
              <strong>Fin:</strong> {createdPeriod.end_date}
            </Typography.Text>
            {createdPeriod.created_at && (
              <Typography.Text>
                <strong>Creado:</strong> {new Date(createdPeriod.created_at).toLocaleString()}
              </Typography.Text>
            )}
          </Space>
        </Card>
      ) : null}
    </Space>
  )
}

export default AddBillingPeriodPage
