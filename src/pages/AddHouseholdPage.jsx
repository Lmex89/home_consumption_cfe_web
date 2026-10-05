import { useState } from 'react'
import { Alert, Space, Typography, message } from 'antd'
import AddHouseholdForm from '../components/AddHouseholdForm'
import PageHero from '../components/ui/PageHero'
import SectionCollapse from '../components/ui/SectionCollapse'
import { createHouseholdWithTariff } from '../services/householdService'
import styles from './AddHouseholdPage.module.css'

function AddHouseholdPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [createdHousehold, setCreatedHousehold] = useState(null)
  const [openSections, setOpenSections] = useState([])

  const handleSubmit = async (payload) => {
    setIsSubmitting(true)
    setSuccessMessage('')
    setError('')

    try {
      const result = await createHouseholdWithTariff(
        payload.householdName,
        payload.tariffId,
        payload.startDate,
        payload.endDate,
      )

      setCreatedHousehold(result.household)
      setOpenSections((current) => (
        current.includes('created') ? current : [...current, 'created']
      ))
      setSuccessMessage(
        `Vivienda "${result.household.name}" creada correctamente con Tarifa asignada.`,
      )
      messageApi.success('Vivienda registrada correctamente.')
      return true
    } catch (err) {
      const errorMessage = err.message || 'No fue posible guardar la nueva vivienda.'
      setError(errorMessage)
      messageApi.error(errorMessage)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const sections = [
    {
      key: 'register',
      label: 'Registrar vivienda',
      children: (
        <AddHouseholdForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          successMessage={successMessage}
        />
      ),
    },
  ]

  if (createdHousehold) {
    sections.push({
      key: 'created',
      label: 'Vivienda creada',
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>
            <strong>ID:</strong> {createdHousehold.id}
          </Typography.Text>
          <Typography.Text>
            <strong>Nombre:</strong> {createdHousehold.name || 'Sin nombre'}
          </Typography.Text>
          {createdHousehold.created_at && (
            <Typography.Text>
              <strong>Creada:</strong> {new Date(createdHousehold.created_at).toLocaleString()}
            </Typography.Text>
          )}
        </Space>
      ),
    })
  }

  return (
    <div className={styles.page}>
      {contextHolder}
      <PageHero
        eyebrow="Administración"
        title="Alta de viviendas con tarifas"
        description="Este flujo registra nuevas viviendas en FastAPI con tarifas asociadas."
      />

      <SectionCollapse
        activeKey={openSections}
        onChange={setOpenSections}
        items={sections}
      />

      {error ? <Alert type="error" showIcon message={error} /> : null}
    </div>
  )
}

export default AddHouseholdPage
