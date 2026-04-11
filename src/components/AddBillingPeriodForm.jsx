import { Card, Col, Form, Input, Row, Select, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { listHouseholds } from '../services/consumoService'
import FormActions from './ui/FormActions'
import SuccessAlert from './ui/SuccessAlert'

function AddBillingPeriodForm({ onSubmit, isSubmitting, successMessage }) {
  const [form] = Form.useForm()
  const [households, setHouseholds] = useState([])
  const [loadingHouseholds, setLoadingHouseholds] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadHouseholds = async () => {
      try {
        setLoadingHouseholds(true)
        const householdList = await listHouseholds()
        if (isMounted) {
          setHouseholds(householdList)
        }
      } catch (error) {
        console.error('Error loading households:', error)
        if (isMounted) {
          message.error('No fue posible cargar las viviendas.')
        }
      } finally {
        if (isMounted) {
          setLoadingHouseholds(false)
        }
      }
    }

    loadHouseholds()

    return () => {
      isMounted = false
    }
  }, [])

  const handleFinish = async (values) => {
    const payload = {
      householdId: values.householdId,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    }

    const wasSaved = await onSubmit(payload)
    if (wasSaved) {
      form.resetFields()
    }
  }

  return (
    <Card title="Crear nuevo periodo de facturación">
      <Typography.Paragraph type="secondary">
        Registra un nuevo periodo de facturación asociado a una vivienda en el backend FastAPI.
      </Typography.Paragraph>

      <SuccessAlert message={successMessage} />

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Vivienda"
              name="householdId"
              rules={[{ required: true, message: 'La vivienda es obligatoria.' }]}
            >
              <Select
                placeholder="Selecciona una vivienda"
                disabled={loadingHouseholds}
                loading={loadingHouseholds}
                options={households}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Fecha de inicio"
              name="startDate"
              rules={[{ required: true, message: 'La fecha de inicio es obligatoria.' }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Fecha de fin"
              name="endDate"
              dependencies={['startDate']}
              rules={[
                { required: true, message: 'La fecha de fin es obligatoria.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const startDate = getFieldValue('startDate')
                    if (!value || !startDate || value > startDate) {
                      return Promise.resolve()
                    }
                    return Promise.reject(
                      new Error('La fecha de fin debe ser posterior a la fecha de inicio.'),
                    )
                  },
                }),
              ]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>

        <FormActions loading={isSubmitting} onReset={() => form.resetFields()} />
      </Form>
    </Card>
  )
}

export default AddBillingPeriodForm
