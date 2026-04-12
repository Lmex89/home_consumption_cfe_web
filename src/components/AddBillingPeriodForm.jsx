import { Alert, Card, Col, Form, Input, Row, Select, Spin, Typography, message } from 'antd'
import { useState } from 'react'
import { useHouseholds } from '../hooks/useHouseholds'
import { fetchBillingPeriods } from '../services/consumoService'
import FormActions from './ui/FormActions'
import SuccessAlert from './ui/SuccessAlert'

function periodsOverlap(newStart, newEnd, existingPeriods) {
  const newStartMs = new Date(newStart).getTime()
  const newEndMs = new Date(newEnd).getTime()

  if (Number.isNaN(newStartMs) || Number.isNaN(newEndMs)) return false

  return existingPeriods.some((period) => {
    const existingStart = new Date(period.start_date).getTime()
    const existingEnd = new Date(period.end_date).getTime()
    if (Number.isNaN(existingStart) || Number.isNaN(existingEnd)) return false
    return newStartMs <= existingEnd && newEndMs >= existingStart
  })
}

function AddBillingPeriodForm({ onSubmit, isSubmitting, successMessage }) {
  const [form] = Form.useForm()
  const { households, isLoading: loadingHouseholds, error: householdsError } = useHouseholds()
  const [existingPeriods, setExistingPeriods] = useState([])
  const [loadingPeriods, setLoadingPeriods] = useState(false)

  const handleHouseholdChange = async (householdId) => {
    setExistingPeriods([])
    if (!householdId) return

    setLoadingPeriods(true)
    try {
      const periods = await fetchBillingPeriods(householdId)
      setExistingPeriods(Array.isArray(periods) ? periods : [])
    } catch (error) {
      console.error('Error fetching billing periods:', error)
      setExistingPeriods([])
    } finally {
      setLoadingPeriods(false)
    }
  }

  const handleFinish = async (values) => {
    const payload = {
      householdId: values.householdId,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    }

    if (payload.startDate && payload.endDate) {
      if (periodsOverlap(payload.startDate, payload.endDate, existingPeriods)) {
        message.error(
          'Ya existe un periodo de facturación que se superpone con las fechas seleccionadas.',
        )
        return false
      }
    }

    const wasSaved = await onSubmit(payload)
    if (wasSaved) {
      const householdId = values.householdId
      form.resetFields()
      setExistingPeriods([])
      // Reload periods for the household that was just used
      if (householdId) {
        setLoadingPeriods(true)
        try {
          const periods = await fetchBillingPeriods(householdId)
          setExistingPeriods(Array.isArray(periods) ? periods : [])
        } catch {
          setExistingPeriods([])
        } finally {
          setLoadingPeriods(false)
        }
      }
    }
  }

  return (
    <Card title="Crear nuevo periodo de facturación">
      <Typography.Paragraph type="secondary">
        Registra un nuevo periodo de facturación asociado a una vivienda en el backend FastAPI.
      </Typography.Paragraph>

      <SuccessAlert message={successMessage} />

      {householdsError ? (
        <Alert
          type="error"
          showIcon
          message="Error al cargar viviendas"
          description="No fue posible cargar el listado de viviendas. Recarga la pagina para intentar nuevamente."
          style={{ marginBottom: 16 }}
        />
      ) : null}

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
                onChange={handleHouseholdChange}
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
