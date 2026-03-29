import { useState } from 'react'
import { Alert, Card, Empty, Space, Typography, message } from 'antd'
import ConsumptionForm from '../components/ConsumptionForm'
import ConsumptionTable from '../components/ConsumptionTable'
import { createConsumption, getDashboardConsumptions } from '../services/consumoService'

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
      const updatedData = await getDashboardConsumptions()

      setLatestItems(updatedData.items)
      setSuccessMessage('Consumo guardado correctamente en el backend simulado.')
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

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      {contextHolder}
      <Card>
        <Typography.Text type="secondary">Registro manual</Typography.Text>
        <Typography.Title level={3} style={{ marginTop: 4 }}>
          Alta de consumos para personal interno
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Este flujo no usa autenticacion real. Solo simula el registro staff y refresca el historial cargado en memoria.
        </Typography.Paragraph>
      </Card>

      <ConsumptionForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        successMessage={successMessage}
      />

      {error ? <Alert type="error" showIcon message={error} /> : null}

      {latestItems.length > 0 ? (
        <ConsumptionTable items={latestItems} />
      ) : (
        <Empty description="Aun no hay historial cargado desde este formulario." />
      )}
    </Space>
  )
}

export default InsertarConsumoPage