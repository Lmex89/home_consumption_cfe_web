import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Spin,
  Typography,
  message,
} from 'antd'
import { useState } from 'react'
import { useHouseholds } from '../hooks/useHouseholds'
import { fetchBillingPeriods } from '../services/consumoService'
import {
  getSuggestedNextPeriod,
  periodsOverlap,
} from '../utils/billingPeriodUtils'
import FormActions from './ui/FormActions'
import SuccessAlert from './ui/SuccessAlert'

function AddBillingPeriodForm({
  onSubmit,
  onCreateYear,
  isSubmitting,
  isCreatingYear,
  successMessage,
}) {
  const [form] = Form.useForm()
  const { households, isLoading: loadingHouseholds, error: householdsError } = useHouseholds()
  const [existingPeriods, setExistingPeriods] = useState([])
  const [loadingPeriods, setLoadingPeriods] = useState(false)

  const handleHouseholdChange = async (householdId) => {
    setExistingPeriods([])
    form.resetFields(['startDate', 'endDate'])
    if (!householdId) return

    setLoadingPeriods(true)
    try {
      const periods = await fetchBillingPeriods(householdId)
      const normalizedPeriods = Array.isArray(periods) ? periods : []
      setExistingPeriods(normalizedPeriods)

      const suggested = getSuggestedNextPeriod(normalizedPeriods)
      if (suggested.startDate) {
        form.setFieldsValue({ startDate: suggested.startDate })
      }
      if (suggested.endDate) {
        form.setFieldsValue({ endDate: suggested.endDate })
      }
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
      form.resetFields(['startDate', 'endDate'])
      // Reload periods for the household that was just used and suggest the next one
      if (householdId) {
        setLoadingPeriods(true)
        try {
          const periods = await fetchBillingPeriods(householdId)
          const normalizedPeriods = Array.isArray(periods) ? periods : []
          setExistingPeriods(normalizedPeriods)

          const suggested = getSuggestedNextPeriod(normalizedPeriods)
          if (suggested.startDate) {
            form.setFieldsValue({ startDate: suggested.startDate })
          }
          if (suggested.endDate) {
            form.setFieldsValue({ endDate: suggested.endDate })
          }
        } catch {
          setExistingPeriods([])
        } finally {
          setLoadingPeriods(false)
        }
      }
    }
  }

  const handleCreateYearClick = () => {
    const householdId = form.getFieldValue('householdId')
    if (!householdId) {
      message.warning('Selecciona una vivienda para crear los periodos del año.')
      return
    }

    Modal.confirm({
      title: '¿Crear periodos del año?',
      content:
        'Se generarán los periodos de facturación para el año actual basándose en la duración de los periodos existentes. Los periodos que ya existan serán omitidos.',
      okText: 'Crear periodos',
      cancelText: 'Cancelar',
      onOk: () => onCreateYear(householdId),
    })
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

        {loadingPeriods ? (
          <div style={{ marginBottom: 16 }}>
            <Spin size="small" />
          </div>
        ) : null}

        <FormActions loading={isSubmitting} onReset={() => form.resetFields()} />

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            También puedes generar automáticamente todos los periodos del año actual.
          </Typography.Paragraph>
          <Button
            onClick={handleCreateYearClick}
            loading={isCreatingYear}
            disabled={isSubmitting || isCreatingYear}
          >
            Crear periodos del año
          </Button>
        </div>
      </Form>
    </Card>
  )
}

export default AddBillingPeriodForm
