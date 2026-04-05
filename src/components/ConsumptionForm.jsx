import { Alert, Button, Card, Checkbox, Form, Input, InputNumber, Row, Col, Typography, Select } from 'antd'
import { useEffect } from 'react'

function isValidDate(year, month, day) {
  const parsed = new Date(Date.UTC(year, month - 1, day))

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

function normalizeDateValue(rawDate) {
  if (!rawDate) return null

  const value = String(rawDate).trim()
  if (!value) return null

  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch
    const yearNumber = Number(year)
    const monthNumber = Number(month)
    const dayNumber = Number(day)

    return isValidDate(yearNumber, monthNumber, dayNumber) ? `${year}-${month}-${day}` : null
  }

  const yearFirstMatch = value.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (yearFirstMatch) {
    const [, year, month, day] = yearFirstMatch
    const yearNumber = Number(year)
    const monthNumber = Number(month)
    const dayNumber = Number(day)

    return isValidDate(yearNumber, monthNumber, dayNumber) ? `${year}-${month}-${day}` : null
  }

  const dayFirstMatch = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/)
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch
    const yearNumber = Number(year)
    const monthNumber = Number(month)
    const dayNumber = Number(day)

    return isValidDate(yearNumber, monthNumber, dayNumber)
      ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      : null
  }

  const isoDateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})T/)
  if (isoDateTimeMatch) {
    const [, year, month, day] = isoDateTimeMatch
    const yearNumber = Number(year)
    const monthNumber = Number(month)
    const dayNumber = Number(day)

    return isValidDate(yearNumber, monthNumber, dayNumber) ? `${year}-${month}-${day}` : null
  }

  return null
}

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

      {successMessage ? (
        <Alert
          type="success"
          showIcon
          message={successMessage}
          style={{ marginBottom: 16 }}
        />
      ) : null}

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

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting || loadingHouseholds}
            disabled={loadingHouseholds}
          >
            Guardar consumo
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default ConsumptionForm