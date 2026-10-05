import { Alert, Button, Card, Modal, Space, Typography, message } from 'antd'
import { useState } from 'react'
import AddBillingPeriodForm from '../components/AddBillingPeriodForm'
import PageHero from '../components/ui/PageHero'
import SectionCollapse from '../components/ui/SectionCollapse'
import SuccessAlert from '../components/ui/SuccessAlert'
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
  const [yearSuccessMessage, setYearSuccessMessage] = useState('')
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(null)

  const handleSubmit = async (payload) => {
    setIsSubmitting(true)
    setSuccessMessage('')
    setYearSuccessMessage('')
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
    setYearSuccessMessage('')
    setError('')
    setYearCreationResult(null)

    try {
      const result = await createYearBillingPeriods(householdId)
      setYearCreationResult(result)

      if (result.created.length === 0 && result.skipped === 0) {
        setYearSuccessMessage('No se generaron periodos para el año actual.')
        messageApi.info('No se generaron periodos para el año actual.')
      } else {
        const summary = `Año ${result.year}: ${result.created.length} creado(s), ${result.skipped} omitido(s).`
        setYearSuccessMessage(summary)
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

  const handleCreateYearClick = () => {
    if (!selectedHouseholdId) {
      messageApi.warning('Selecciona una vivienda para crear los periodos del año.')
      return
    }

    Modal.confirm({
      title: '¿Crear periodos del año?',
      content:
        'Se generarán los periodos de facturación para el año actual basándose en la duración de los periodos existentes. Los periodos que ya existan serán omitidos.',
      okText: 'Crear periodos',
      cancelText: 'Cancelar',
      onOk: () => handleCreateYear(selectedHouseholdId),
    })
  }

  const sections = [
    {
      key: 'period',
      label: 'Registrar periodo de facturación',
      children: (
        <>
          <AddBillingPeriodForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            successMessage={successMessage}
            onHouseholdChange={setSelectedHouseholdId}
          />

          {createdPeriod ? (
            <Card title="Periodo creado" type="inner" style={{ marginTop: 16 }}>
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
        </>
      ),
    },
    {
      key: 'year',
      label: 'Generar periodos del año',
      children: (
        <>
          <Typography.Paragraph type="secondary">
            Genera automáticamente todos los periodos del año actual a partir de la
            duración de los periodos existentes de la vivienda seleccionada.
          </Typography.Paragraph>

          <SuccessAlert message={yearSuccessMessage} />

          <Button
            onClick={handleCreateYearClick}
            loading={isCreatingYear}
            disabled={isSubmitting || isCreatingYear}
          >
            Crear periodos del año
          </Button>

          {yearCreationResult ? (
            <Card title="Resumen de periodos del año" type="inner" style={{ marginTop: 16 }}>
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
        </>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      {contextHolder}
      <PageHero
        eyebrow="Administración"
        title="Alta de periodos de facturación"
        description="Registra nuevos periodos de facturación asociados a una vivienda en el backend FastAPI."
      />

      <SectionCollapse items={sections} />

      {error ? <Alert type="error" showIcon message={error} /> : null}
    </div>
  )
}

export default AddBillingPeriodPage
