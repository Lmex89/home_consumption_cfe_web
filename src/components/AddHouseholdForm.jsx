import { Button, Card, Form, Input, Row, Col, Typography, Select, message } from 'antd'
import { useEffect, useState } from 'react'
import { listTariffs } from '../services/householdService'
import FormActions from './ui/FormActions'
import SuccessAlert from './ui/SuccessAlert'

function AddHouseholdForm({ onSubmit, isSubmitting, successMessage }) {
  const [form] = Form.useForm()
  const [tariffs, setTariffs] = useState([])
  const [loadingTariffs, setLoadingTariffs] = useState(true)

  useEffect(() => {
    const loadTariffs = async () => {
      try {
        setLoadingTariffs(true)
        const tariffList = await listTariffs()
        setTariffs(tariffList)
      } catch (error) {
        console.error('Error loading tariffs:', error)
        message.error('No fue posible cargar los tarifas.')
      } finally {
        setLoadingTariffs(false)
      }
    }

    loadTariffs()
  }, [])

  const handleFinish = async (values) => {
    const payload = {
      householdName: values.householdName?.trim() || '',
      tariffId: values.tariffId,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    }

    const wasSaved = await onSubmit(payload)
    if (wasSaved) {
      form.resetFields()
    }
  }

  return (
    <Card
      title="Crear nueva vivienda"
      extra={<Typography.Text type="secondary">Staff only</Typography.Text>}
    >
      <Typography.Paragraph type="secondary">
        Registro de una nueva vivienda con tafifa asociado en el backend FastAPI.
      </Typography.Paragraph>

      <SuccessAlert message={successMessage} />

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Nombre de la vivienda"
              name="householdName"
              rules={[
                { required: true, message: 'El nombre de la vivienda es obligatorio.' },
                { max: 100, message: 'El nombre no debe exceder 100 caracteres.' },
              ]}
            >
              <Input placeholder="Ej. Casa Principal" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Tarifa"
              name="tariffId"
              rules={[{ required: true, message: 'La tarifa es obligatoria.' }]}
            >
              <Select
                placeholder="Selecciona una tarifa"
                disabled={loadingTariffs}
                options={tariffs}
              />
            </Form.Item>
          </Col>
        </Row>

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

        <FormActions
          submitLabel="Crear vivienda con Tarifa"
          loading={isSubmitting || loadingTariffs}
          disabled={loadingTariffs}
          onReset={() => form.resetFields()}
        />
      </Form>
    </Card>
  )
}

export default AddHouseholdForm
