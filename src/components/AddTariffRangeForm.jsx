import { Button, Card, Form, InputNumber, Row, Col, Space, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { createTariffRange } from '../services/householdService'
import FormActions from './ui/FormActions'
import SuccessAlert from './ui/SuccessAlert'

function AddTariffRangeForm({ tariffVersionId, versionLabel, onRangeAdded }) {
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    form.resetFields()
    setSuccessMessage('')
  }, [form, tariffVersionId])

  const handleFinish = async (values) => {
    setIsSubmitting(true)
    setSuccessMessage('')

    try {
      const result = await createTariffRange(
        tariffVersionId,
        values.rangeMin,
        values.rangeMax,
        values.pricePerKwh,
      )

      setSuccessMessage(`Rango tarifario creado correctamente para ${versionLabel}.`)
      message.success('Rango tarifario registrado.')
      form.resetFields()

      if (onRangeAdded) {
        onRangeAdded(result.tariffRange)
      }
    } catch (error) {
      console.error('Error creating tariff range:', error)
      message.error(error.message || 'Error al crear el rango tarifario.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card
      title="Agregar rango de precio"
      extra={<Typography.Text type="secondary">Rangos</Typography.Text>}
      size="small"
    >
      <SuccessAlert message={successMessage} />

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Rango mínimo"
              name="rangeMin"
              rules={[{ required: true, message: 'El rango mínimo es obligatorio.' }]}
            >
              <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Rango máximo" name="rangeMax">
              <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Precio por kWh"
              name="pricePerKwh"
              rules={[{ required: true, message: 'El precio por kWh es obligatorio.' }]}
            >
              <InputNumber min={0.0001} step={0.0001} precision={4} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <FormActions
          submitLabel="Crear rango"
          loading={isSubmitting}
          onReset={() => form.resetFields()}
        />
      </Form>
    </Card>
  )
}

export default AddTariffRangeForm