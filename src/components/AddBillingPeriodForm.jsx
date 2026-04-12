import { Card, Col, Form, Input, Row, Select, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { fetchBillingPeriods, listHouseholds } from '../services/consumoService'
import FormActions from './ui/FormActions'
import SuccessAlert from './ui/SuccessAlert'

function periodsOverlap(newStart, newEnd, existingPeriods) {
  const newStartMs = new Date(newStart).getTime()
  const newEndMs = new Date(newEnd).getTime()

  return existingPeriods.some((period) => {
    const existingStart = new Date(period.start_date).getTime()
    const existingEnd = new Date(period.end_date).getTime()
    return newStartMs <= existingEnd && newEndMs >= existingStart
  })
}

function AddBillingPeriodForm({ onSubmit, isSubmitting, successMessage }) {
  const [form] = Form.useForm()
  const [households, setHouseholds] = useState([])
  const [loadingHouseholds, setLoadingHouseholds] = useState(true)
  const [existingPeriods, setExistingPeriods] = useState([])

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

  const handleHouseholdChange = async (householdId) => {
    setExistingPeriods([])
    if (!householdId) return

    try {
      const periods = await fetchBillingPeriods(householdId)
      setExistingPeriods(Array.isArray(periods) ? periods : [])
    } catch (error) {
      console.error('Error fetching billing periods:', error)
      setExistingPeriods([])
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
      form.resetFields()
      handleHouseholdChange(values.householdId)
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
