import { Button, Card, Form, Input, Row, Col, Typography, message } from 'antd'
import { useState } from 'react'
import FormActions from './ui/FormActions'
import SuccessAlert from './ui/SuccessAlert'

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

      <SuccessAlert message={successMessage} />

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

        <FormActions
          submitLabel="Crear tarifa"
          loading={isSubmitting}
          onReset={() => form.resetFields()}
        />
      </Form>
    </Card>
  )
}

export default AddTariffForm
