import { useState } from 'react'
import { Alert, Card, Space, Typography, message } from 'antd'
import AddHouseholdForm from '../components/AddHouseholdForm'
import { createHouseholdWithTariff } from '../services/householdService'

function AddHouseholdPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [createdHousehold, setCreatedHousehold] = useState(null)

  const handleSubmit = async (payload) => {
    setIsSubmitting(true)
    setSuccessMessage('')
    setError('')

    try {
      const result = await createHouseholdWithTariff(
        payload.householdName,
        payload.tariffId,
        payload.startDate,
        payload.endDate,
      )

      setCreatedHousehold(result.household)
      setSuccessMessage(
        `Vivienda "${result.household.name}" creada correctamente con Tarifa asignada.`,
      )
      messageApi.success('Vivienda registrada correctamente.')
      return true
    } catch (err) {
      const errorMessage = err.message || 'No fue posible guardar la nueva vivienda.'
      setError(errorMessage)
      messageApi.error(errorMessage)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      {contextHolder}
      <Card>
        <Typography.Text type="secondary">Administración</Typography.Text>
        <Typography.Title level={3} style={{ marginTop: 4 }}>
          Alta de viviendas con tarifas
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Este flujo registra nuevas viviendas en FastAPI con tarifas asociadas.
        </Typography.Paragraph>
      </Card>

      <AddHouseholdForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        successMessage={successMessage}
      />

      {error ? <Alert type="error" showIcon message={error} /> : null}

      {createdHousehold ? (
        <Card
          title="Vivienda creada"
          type="inner"
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Typography.Text>
              <strong>ID:</strong> {createdHousehold.id}
            </Typography.Text>
            <Typography.Text>
              <strong>Nombre:</strong> {createdHousehold.name || 'Sin nombre'}
            </Typography.Text>
            {createdHousehold.created_at && (
              <Typography.Text>
                <strong>Creada:</strong> {new Date(createdHousehold.created_at).toLocaleString()}
              </Typography.Text>
            )}
          </Space>
        </Card>
      ) : null}
    </Space>
  )
}

export default AddHouseholdPage
