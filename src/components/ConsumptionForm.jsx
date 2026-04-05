import { Card, Checkbox, Form, Input, InputNumber, Row, Col, Typography, Select } from 'antd'
import { useEffect } from 'react'
import { normalizeDateValue } from '../utils/dateUtils'
import FormActions from './ui/FormActions'
import SuccessAlert from './ui/SuccessAlert'


function ConsumptionForm({
  onSubmit,
  isSubmitting,
  successMessage,
  households,
  loadingHouseholds,
  selectedHouseholdId,
  onHouseholdChange,
}) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (selectedHouseholdId !== null && selectedHouseholdId !== undefined) {
      form.setFieldValue('householdId', selectedHouseholdId)
    }
  }, [form, selectedHouseholdId])

  const handleFinish = async (values) => {
    const normalizedDate = normalizeDateValue(values.fecha)

    if (!normalizedDate) {
      form.setFields([
        {
          name: 'fecha',
          errors: ['La fecha debe estar en formato YYYY-MM-DD o DD/MM/YYYY.'],
        },
      ])
      return
    }

    const payload = {
      householdId: values.householdId,
      fecha: normalizedDate,
      kWh: Number(values.kWh),
      isInitial: Boolean(values.isInitial),
      note: values.note?.trim() || '',
    }

    const wasSaved = await onSubmit(payload)
    if (wasSaved) {
      form.resetFields()
      if (selectedHouseholdId !== null && selectedHouseholdId !== undefined) {
        form.setFieldValue('householdId', selectedHouseholdId)
      }
      form.setFieldValue('isInitial', false)
    }
  }

  return (
    <Card
      title="Insertar nuevo consumo"
      extra={<Typography.Text type="secondary">Staff only</Typography.Text>}
    >
      <Typography.Paragraph type="secondary">
        El formulario envia lecturas al backend FastAPI usando el endpoint de meter readings.
      </Typography.Paragraph>

      <SuccessAlert message={successMessage} />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          isInitial: false,
          householdId: selectedHouseholdId ?? undefined,
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Vivienda"
              name="householdId"
              rules={[{ required: true, message: 'La vivienda es obligatoria.' }]}
            >
              <Select
                placeholder="Selecciona una vivienda"
                disabled={loadingHouseholds}
                options={households}
                onChange={onHouseholdChange}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Fecha"
              name="fecha"
              rules={[{ required: true, message: 'La fecha es obligatoria.' }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
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

          <Col xs={24} md={12}>
            <Form.Item label="Nota o identificador" name="note">
              <Input placeholder="Opcional" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="isInitial" valuePropName="checked" style={{ marginBottom: 16 }}>
          <Checkbox>La lectura es inicial</Checkbox>
        </Form.Item>

        <FormActions
          submitLabel="Guardar consumo"
          loading={isSubmitting || loadingHouseholds}
          disabled={loadingHouseholds}
        />
      </Form>
    </Card>
  )
}

export default ConsumptionForm