import { Alert, Button, Card, Form, Input, Row, Col, Typography, Space, message } from 'antd'
import { useState } from 'react'

function AddTariffForm({ onSubmit, isSubmitting, successMessage }) {
  const [form] = Form.useForm()

  const handleFinish = async (values) => {
    const payload = {
      code: values.code?.trim() || '',
      description: values.description?.trim() || '',
    }

    const wasSaved = await onSubmit(payload)
    if (wasSaved) {
      form.resetFields()
    }
  }

  return (
    <Card
      title="Crear nueva tarifa"
      extra={<Typography.Text type="secondary">Staff only</Typography.Text>}
    >
      <Typography.Paragraph type="secondary">
        Registro de una nueva tarifa en el backend FastAPI.
      </Typography.Paragraph>

      {successMessage ? (
        <Alert
          type="success"
          showIcon
          message={successMessage}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Código de tarifa"
              name="code"
              rules={[
                { required: true, message: 'El código de tarifa es obligatorio.' },
                { min: 1, message: 'El código debe tener al menos 1 carácter.' },
                { max: 10, message: 'El código no debe exceder 10 caracteres.' },
              ]}
            >
              <Input placeholder="Ej. DAC, TARIFA1" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Descripción (opcional)"
              name="description"
              rules={[
                { max: 255, message: 'La descripción no debe exceder 255 caracteres.' },
              ]}
            >
              <Input placeholder="Ej. Tarifa doméstica de alto consumo" />
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
              Crear tarifa
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

export default AddTariffForm
