import { useState, useEffect } from 'react'
import { Alert, Card, Empty, Select, Skeleton, Space, Typography, message } from 'antd'
import AddTariffForm from '../components/AddTariffForm'
import AddTariffVersionForm from '../components/AddTariffVersionForm'
import AddTariffRangeForm from '../components/AddTariffRangeForm'
import TariffRangesList from '../components/TariffRangesList'
import TariffVersionsList from '../components/TariffVersionsList'
import PageHero from '../components/ui/PageHero'
import SectionCollapse from '../components/ui/SectionCollapse'
import {
  createTariff,
  listTariffRanges,
  listTariffs,
  listTariffVersions,
} from '../services/householdService'
import styles from './AddTariffPage.module.css'

function AddTariffPage() {
  const [messageApi, contextHolder] = message.useMessage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [createdTariff, setCreatedTariff] = useState(null)
  const [tariffs, setTariffs] = useState([])
  const [selectedTariffId, setSelectedTariffId] = useState(null)
  const [selectedTariff, setSelectedTariff] = useState(null)
  const [versions, setVersions] = useState([])
  const [selectedVersionId, setSelectedVersionId] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [ranges, setRanges] = useState([])
  const [loadingTariffs, setLoadingTariffs] = useState(true)
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [loadingRanges, setLoadingRanges] = useState(false)
  const [openSections, setOpenSections] = useState([])

  useEffect(() => {
    const loadTariffs = async () => {
      try {
        setLoadingTariffs(true)
        const tariffList = await listTariffs()
        setTariffs(tariffList)
      } catch (error) {
        console.error('Error loading tariffs:', error)
        message.error('Error al cargar las tarifas.')
      } finally {
        setLoadingTariffs(false)
      }
    }

    loadTariffs()
  }, [])

  const closeRangesSection = () => {
    setOpenSections((current) => current.filter((key) => key !== 'ranges'))
  }

  const handleTariffChange = async (tariffId) => {
    setSelectedTariffId(tariffId)
    const tariff = tariffs.find((t) => t.value === tariffId)
    setSelectedTariff(tariff)
    setVersions([])
    setSelectedVersionId(null)
    setSelectedVersion(null)
    setRanges([])
    closeRangesSection()

    if (tariffId) {
      try {
        setLoadingVersions(true)
        const versionList = await listTariffVersions(tariffId)
        setVersions(versionList)
      } catch (error) {
        console.error('Error loading versions:', error)
        message.error('Error al cargar las versiones.')
      } finally {
        setLoadingVersions(false)
      }
    }
  }

  const handleRefreshVersions = async () => {
    if (selectedTariffId) {
      try {
        const versionList = await listTariffVersions(selectedTariffId)
        setVersions(versionList)
        if (selectedVersionId) {
          const refreshedSelectedVersion = versionList.find((version) => version.id === selectedVersionId) || null
          setSelectedVersion(refreshedSelectedVersion)
          if (!refreshedSelectedVersion) {
            setSelectedVersionId(null)
            setRanges([])
            closeRangesSection()
          }
        }
      } catch (error) {
        console.error('Error refreshing versions:', error)
        message.error('Error al actualizar las versiones.')
      }
    }
  }

  const handleRefreshRanges = async (versionId = selectedVersionId) => {
    if (!versionId) {
      setRanges([])
      return
    }

    try {
      setLoadingRanges(true)
      const rangeList = await listTariffRanges(versionId)
      setRanges(rangeList)
    } catch (error) {
      console.error('Error refreshing ranges:', error)
      message.error('Error al actualizar los rangos tarifarios.')
    } finally {
      setLoadingRanges(false)
    }
  }

  const handleVersionSelected = async (version) => {
    setSelectedVersionId(version.id)
    setSelectedVersion(version)
    setOpenSections((current) => (
      current.includes('ranges') ? current : [...current, 'ranges']
    ))
    await handleRefreshRanges(version.id)
  }

  const handleTariffCreated = (tariff) => {
    const newTariff = {
      value: tariff.id,
      label: `${tariff.code} - ${tariff.description || ''}`,
      code: tariff.code,
      description: tariff.description,
    }
    setTariffs((currentTariffs) => [...currentTariffs, newTariff])
    setSelectedTariffId(tariff.id)
    setSelectedTariff(newTariff)
  }

  const handleSubmit = async (payload) => {
    setIsSubmitting(true)
    setSuccessMessage('')
    setError('')

    try {
      const result = await createTariff(payload.code, payload.description)

      setCreatedTariff(result.tariff)
      handleTariffCreated(result.tariff)
      setSuccessMessage(
        `Tarifa "${result.tariff.code}" creada correctamente.`,
      )
      messageApi.success('Tarifa registrada correctamente.')
      return true
    } catch (err) {
      const errorMessage = err.message || 'No fue posible guardar la nueva tarifa.'
      setError(errorMessage)
      messageApi.error(errorMessage)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const sections = [
    {
      key: 'create',
      label: 'Crear nueva tarifa',
      children: (
        <>
          <AddTariffForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            successMessage={successMessage}
          />

          {createdTariff ? (
            <Card title="Tarifa creada" type="inner" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text>
                  <strong>ID:</strong> {createdTariff.id}
                </Typography.Text>
                <Typography.Text>
                  <strong>Código:</strong> {createdTariff.code}
                </Typography.Text>
                {createdTariff.description && (
                  <Typography.Text>
                    <strong>Descripción:</strong> {createdTariff.description}
                  </Typography.Text>
                )}
                {createdTariff.created_at && (
                  <Typography.Text>
                    <strong>Creada:</strong> {new Date(createdTariff.created_at).toLocaleString()}
                  </Typography.Text>
                )}
              </Space>
            </Card>
          ) : null}
        </>
      ),
    },
    {
      key: 'versions',
      label: 'Versiones de tarifa',
      children: (
        <>
          <Select
            placeholder="Selecciona una tarifa"
            value={selectedTariffId}
            onChange={handleTariffChange}
            options={tariffs}
            loading={loadingTariffs}
            style={{ width: '100%', marginBottom: 16 }}
          />

          {selectedTariff ? (
            <>
              <AddTariffVersionForm
                tariffId={selectedTariffId}
                tariffCode={selectedTariff.code}
                onVersionAdded={handleRefreshVersions}
              />

              {loadingVersions ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : versions.length > 0 ? (
                <TariffVersionsList
                  versions={versions}
                  selectedVersionId={selectedVersionId}
                  onRefresh={handleRefreshVersions}
                  onSelectVersion={handleVersionSelected}
                />
              ) : (
                <Empty description="No hay versiones para esta tarifa." />
              )}

              {!selectedVersion && versions.length > 0 ? (
                <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                  Selecciona una versión con el botón "Rangos" para administrar sus precios por tramo.
                </Typography.Paragraph>
              ) : null}
            </>
          ) : (
            <Empty description="Selecciona una tarifa para empezar a administrar versiones y rangos." />
          )}
        </>
      ),
    },
  ]

  if (selectedVersion) {
    sections.push({
      key: 'ranges',
      label: `Rangos de precio · versión #${selectedVersion.id}`,
      children: (
        <>
          <AddTariffRangeForm
            tariffVersionId={selectedVersionId}
            versionLabel={`la versión #${selectedVersion.id}`}
            onRangeAdded={() => handleRefreshRanges(selectedVersionId)}
          />

          {loadingRanges ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : ranges.length > 0 ? (
            <TariffRangesList
              ranges={ranges}
              onRefresh={() => handleRefreshRanges(selectedVersionId)}
            />
          ) : (
            <Empty description="No hay rangos registrados para esta versión." />
          )}
        </>
      ),
    })
  }

  return (
    <div className={styles.page}>
      {contextHolder}
      <PageHero
        eyebrow="Administración"
        title="Alta de tarifas"
        description="Crea tarifas, administra sus versiones vigentes y ajusta rangos de precio sin salir de la misma ruta."
        aside={(
          <div className={styles.statusBlock}>
            <p className={styles.eyebrow}>Tarifa seleccionada</p>
            <p className={styles.statusValue}>{selectedTariff?.code || 'N/D'}</p>
            <p className={styles.statusHint}>
              {selectedVersion
                ? `Versión activa: #${selectedVersion.id}`
                : 'Selecciona una tarifa para gestionar versiones y rangos.'}
            </p>

            <dl className={styles.statusStats}>
              <div>
                <dt>Tarifas</dt>
                <dd>{loadingTariffs ? '…' : tariffs.length}</dd>
              </div>
              <div>
                <dt>Versiones</dt>
                <dd>{loadingVersions ? '…' : versions.length}</dd>
              </div>
              <div>
                <dt>Rangos</dt>
                <dd>{loadingRanges ? '…' : ranges.length}</dd>
              </div>
            </dl>
          </div>
        )}
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

export default AddTariffPage
