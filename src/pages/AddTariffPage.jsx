import { useState, useEffect } from 'react'
import { Alert, Card, Col, Divider, Empty, Row, Select, Skeleton, Space, Statistic, Typography, message } from 'antd'
import AddTariffForm from '../components/AddTariffForm'
import AddTariffVersionForm from '../components/AddTariffVersionForm'
import AddTariffRangeForm from '../components/AddTariffRangeForm'
import TariffRangesList from '../components/TariffRangesList'
import TariffVersionsList from '../components/TariffVersionsList'
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

  const handleTariffChange = async (tariffId) => {
    setSelectedTariffId(tariffId)
    const tariff = tariffs.find((t) => t.value === tariffId)
    setSelectedTariff(tariff)
    setVersions([])
    setSelectedVersionId(null)
    setSelectedVersion(null)
    setRanges([])

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

  return (
    <div className={styles.page}>
      {contextHolder}
      <section className={styles.hero}>
        <div className={styles.introCard}>
          <p className={styles.eyebrow}>Administración</p>
          <Typography.Title level={2} className={styles.title}>
            Alta de tarifas
          </Typography.Title>
          <Typography.Paragraph type="secondary" className={styles.description}>
            Crea tarifas, administra sus versiones vigentes y ajusta rangos de precio sin salir de la misma ruta.
          </Typography.Paragraph>
        </div>

        <div className={styles.statusCard}>
          <p className={styles.eyebrow}>Tarifa seleccionada</p>
          <p className={styles.statusValue}>{selectedTariff?.code || 'N/D'}</p>
          <p className={styles.statusHint}>
            {selectedVersion
              ? `Version activa: #${selectedVersion.id}`
              : 'Selecciona una tarifa para gestionar versiones y rangos.'}
          </p>
        </div>
      </section>

      <Row
        gutter={[{ xs: 0, sm: 0, md: 12, lg: 12 }, 12]}
        className={styles.statsRow}
      >
        <Col xs={24} sm={24} md={8} className={styles.statsCol}>
          <Card>
            <Statistic title="Tarifas disponibles" value={tariffs.length} loading={loadingTariffs} />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8} className={styles.statsCol}>
          <Card>
            <Statistic title="Versiones cargadas" value={versions.length} loading={loadingVersions} />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8} className={styles.statsCol}>
          <Card>
            <Statistic title="Rangos activos" value={ranges.length} loading={loadingRanges} />
          </Card>
        </Col>
      </Row>

      <AddTariffForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        successMessage={successMessage}
      />

      {error ? <Alert type="error" showIcon message={error} /> : null}

      {createdTariff ? (
        <Card
          title="Tarifa creada"
          type="inner"
          className={styles.sectionCard}
        >
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

      <Divider />
      
      <Card className={styles.sectionCard}>
        <Typography.Text type="secondary">Gestión de Versiones</Typography.Text>
        <Typography.Title level={3} style={{ marginTop: 4 }}>
          Versiones de tarifas
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Selecciona una tarifa para gestionar sus versiones.
        </Typography.Paragraph>

        <Row
          gutter={[{ xs: 0, sm: 0, md: 12, lg: 12 }, 12]}
          className={styles.selectorRow}
          style={{ marginBottom: 16 }}
        >
          <Col xs={24} sm={24} md={12}>
            <Select
              placeholder="Selecciona una tarifa"
              value={selectedTariffId}
              onChange={handleTariffChange}
              options={tariffs}
              loading={loadingTariffs}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>

      {selectedTariff ? (
        <>
          <AddTariffVersionForm
            tariffId={selectedTariffId}
            tariffCode={selectedTariff.code}
            onVersionAdded={handleRefreshVersions}
          />

          <Card title="Versiones de tarifa" size="small" className={styles.sectionCard}>
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
          </Card>

          {selectedVersion ? (
            <>
              <Card size="small" className={styles.sectionCard}>
                <Typography.Text type="secondary">Gestión de rangos</Typography.Text>
                <Typography.Title level={4} style={{ marginTop: 4, marginBottom: 0 }}>
                  Rangos de precio para versión #{selectedVersion.id}
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                  Administra los precios por tramo para la vigencia seleccionada.
                </Typography.Paragraph>
              </Card>

              <AddTariffRangeForm
                tariffVersionId={selectedVersionId}
                versionLabel={`la versión #${selectedVersion.id}`}
                onRangeAdded={() => handleRefreshRanges(selectedVersionId)}
              />

              <Card title="Rangos tarifarios" size="small" className={styles.sectionCard}>
                {loadingRanges ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : ranges.length > 0 ? (
                  <TariffRangesList ranges={ranges} onRefresh={() => handleRefreshRanges(selectedVersionId)} />
                ) : (
                  <Empty description="No hay rangos registrados para esta versión." />
                )}
              </Card>
            </>
          ) : versions.length > 0 ? (
            <Card size="small" className={styles.helperCard}>
              <Typography.Text type="secondary">
                Selecciona una versión con el botón "Rangos" para administrar sus precios por tramo.
              </Typography.Text>
            </Card>
          ) : null}
        </>
      ) : (
        <Card className={styles.helperCard}>
          <Empty description="Selecciona una tarifa para empezar a administrar versiones y rangos." />
        </Card>
      )}
    </div>
  )
}

export default AddTariffPage
