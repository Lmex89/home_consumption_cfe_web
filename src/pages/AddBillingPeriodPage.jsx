import { Alert, Card, Space, Typography, message } from 'antd'
import { useState } from 'react'
import AddBillingPeriodForm from '../components/AddBillingPeriodForm'
import SectionCard from '../components/ui/SectionCard'
import { createBillingPeriod, createYearBillingPeriods } from '../services/consumoService'
import styles from './AddBillingPeriodPage.module.css'

function AddBillingPeriodPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreatingYear, setIsCreatingYear] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [createdPeriod, setCreatedPeriod] = useState(null)
  const [yearCreationResult, setYearCreationResult] = useState(null)

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

  const handleCreateYear = async (householdId) => {
    setIsCreatingYear(true)
    setSuccessMessage('')
    setError('')
    setYearCreationResult(null)

    try {
      const result = await createYearBillingPeriods(householdId)
      setYearCreationResult(result)

      if (result.created.length === 0 && result.skipped === 0) {
        setSuccessMessage('No se generaron periodos para el año actual.')
        messageApi.info('No se generaron periodos para el año actual.')
      } else {
        const summary = `Año ${result.year}: ${result.created.length} creado(s), ${result.skipped} omitido(s).`
        setSuccessMessage(summary)
        messageApi.success('Periodos del año creados correctamente.')
      }

      return true
    } catch (err) {
      const errorMessage = err.message || 'No fue posible crear los periodos del año.'
      setError(errorMessage)
      messageApi.error(errorMessage)
      return false
    } finally {
      setIsCreatingYear(false)
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
        onCreateYear={handleCreateYear}
        isSubmitting={isSubmitting}
        isCreatingYear={isCreatingYear}
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

      {yearCreationResult ? (
        <Card title="Resumen de periodos del año" type="inner" className={styles.createdCard}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Text>
              <strong>Año:</strong> {yearCreationResult.year}
            </Typography.Text>
            <Typography.Text>
              <strong>Duración base:</strong> {yearCreationResult.durationDays} días
            </Typography.Text>
            <Typography.Text>
              <strong>Creados:</strong> {yearCreationResult.created.length}
            </Typography.Text>
            <Typography.Text>
              <strong>Omitidos (ya existían):</strong> {yearCreationResult.skipped}
            </Typography.Text>
            {yearCreationResult.errors.length > 0 && (
              <Typography.Text type="danger">
                <strong>Errores:</strong> {yearCreationResult.errors.length}
              </Typography.Text>
            )}
            {yearCreationResult.created.length > 0 && (
              <Typography.Text type="secondary">
                Primer periodo: {yearCreationResult.created[0].start_date} —{' '}
                {yearCreationResult.created[0].end_date}
                <br />
                Último periodo:{' '}
                {yearCreationResult.created[yearCreationResult.created.length - 1].start_date} —{' '}
                {yearCreationResult.created[yearCreationResult.created.length - 1].end_date}
              </Typography.Text>
            )}
          </Space>
        </Card>
      ) : null}
    </Space>
  )
}

export default AddBillingPeriodPage
