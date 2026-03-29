import { Alert, Button, Card, Form, Input, InputNumber, Row, Col, Typography } from 'antd'

function ConsumptionForm({ onSubmit, isSubmitting, successMessage }) {
  const [form] = Form.useForm()

  const handleFinish = async (values) => {
    const payload = {
      fecha: values.fecha,
      kWh: Number(values.kWh),
      note: values.note?.trim() || '',
    }

    const wasSaved = await onSubmit(payload)
    if (wasSaved) {
      form.resetFields()
    }
  }

  return (
    <Card
      title="Insertar nuevo consumo"
      extra={<Typography.Text type="secondary">Staff only</Typography.Text>}
    >
      <Typography.Paragraph type="secondary">
        El formulario hace un POST simulado y actualiza el historial mock en memoria.
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
              label="Fecha"
              name="fecha"
              rules={[{ required: true, message: 'La fecha es obligatoria.' }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Cantidad de kWh"
              name="kWh"
              rules={[
                { required: true, message: 'La cantidad de kWh es obligatoria.' },
                {
                  validator: (_, value) => {
                    if (value > 0) return Promise.resolve()
                    return Promise.reject(new Error('El consumo debe ser un numero positivo.'))
                  },
                },
              ]}
            >
              <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} placeholder="Ej. 46.7" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Nota o identificador" name="note">
          <Input placeholder="Opcional" />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Guardar consumo
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default ConsumptionForm