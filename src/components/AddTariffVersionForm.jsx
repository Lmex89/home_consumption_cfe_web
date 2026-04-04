import { Alert, Button, Card, Form, Input, Row, Col, Typography, Space, message } from 'antd'
import { useState } from 'react'
import { createTariffVersion } from '../services/householdService'

function AddTariffVersionForm({ tariffId, tariffCode, onVersionAdded }) {
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleFinish = async (values) => {
    setIsSubmitting(true)
    setSuccessMessage('')

    try {
      await createTariffVersion(
        tariffId,
        values.startDate,
        values.endDate || null,
      )

      setSuccessMessage(
        `Versión de tarifa creada correctamente para "${tariffCode}"`,
      )
      message.success('Versión de tarifa registrada.')
      form.resetFields()

      if (onVersionAdded) {
        onVersionAdded()
      }
    } catch (error) {
      console.error('Error creating version:', error)
      message.error(error.message || 'Error al crear la versión de tarifa.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card
      title="Agregar nueva versión de tarifa"
      extra={<Typography.Text type="secondary">Versiones</Typography.Text>}
      size="small"
    >
      {successMessage ? (
        <Alert
          type="success"
          showIcon
          message={successMessage}
          style={{ marginBottom: 16 }}
          closable
        />
      ) : null}

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Fecha de inicio"
              name="startDate"
              rules={[{ required: true, message: 'La fecha de inicio es obligatoria.' }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Fecha de fin (opcional)"
              name="endDate"
            >
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
            >
              Crear versión
            </Button>
            <Button onClick={() => form.resetFields()}>
              Limpiar
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default AddTariffVersionForm
