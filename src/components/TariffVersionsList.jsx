import { DeleteOutlined, EditOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Table, Button, Grid, message, Space, Popconfirm, Form, Input, Row, Col, Card, Tag } from 'antd'
import { useState } from 'react'
import { deleteTariffVersion, updateTariffVersion } from '../services/householdService'
import styles from './TariffVersionsList.module.css'

/**
 * Formats an ISO date (YYYY-MM-DD) as DD/MM/YY so the mobile `Vigencia`
 * column stays narrow enough to keep the table free of horizontal scroll.
 */
function formatShortDate(value) {
  if (!value) return '—'
  const [year, month, day] = String(value).slice(0, 10).split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year.slice(-2)}`
}

function TariffVersionsList({ versions, selectedVersionId, onRefresh, onSelectVersion }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm] = Form.useForm()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const screens = Grid.useBreakpoint()
  // Icon-only actions below the md breakpoint keep the Acciones column
  // reachable without a horizontal swipe on 360/390px screens.
  const compactActions = screens.md === false

  const handleEdit = (record) => {
    setEditingId(record.id)
    editForm.setFieldsValue({
      startDate: record.startDate,
      endDate: record.endDate || '',
    })
  }

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields()
      setIsUpdating(true)

      await updateTariffVersion(
        editingId,
        values.startDate,
        values.endDate || null,
      )

      message.success('Versión de tarifa actualizada correctamente.')
      setEditingId(null)
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating version:', error)
      message.error(error.message || 'Error al actualizar la versión.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (versionId) => {
    try {
      setIsDeleting(true)
      await deleteTariffVersion(versionId)
      message.success('Versión de tarifa eliminada correctamente.')
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting version:', error)
      message.error(error.message || 'Error al eliminar la versión.')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      responsive: ['sm'],
    },
    {
      title: 'Vigencia',
      key: 'range',
      responsive: ['xs'],
      render: (_, record) => (
        <div className={styles.range}>
          <span>{formatShortDate(record.startDate)}</span>
          <span className={styles.rangeEnd}>
            → {record.endDate ? formatShortDate(record.endDate) : 'abierta'}
          </span>
        </div>
      ),
    },
    {
      title: 'Fecha Inicio',
      dataIndex: 'startDate',
      key: 'startDate',
      responsive: ['sm'],
    },
    {
      title: 'Fecha Fin',
      dataIndex: 'endDate',
      key: 'endDate',
      responsive: ['sm'],
      render: (text) => text || '-',
    },
    {
      title: 'Estado',
      key: 'selected',
      responsive: ['sm'],
      render: (_, record) => (
        record.id === selectedVersionId ? <Tag color="blue">Activa</Tag> : null
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size={compactActions ? 4 : 8}>
          <Button
            size="small"
            icon={<UnorderedListOutlined />}
            aria-label="Rangos"
            onClick={() => onSelectVersion?.(record)}
            disabled={editingId !== null}
          >
            {compactActions ? null : 'Rangos'}
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            aria-label="Editar"
            onClick={() => handleEdit(record)}
            disabled={editingId !== null}
          >
            {compactActions ? null : 'Editar'}
          </Button>
          <Popconfirm
            title="Eliminar versión"
            description="¿Está seguro que desea eliminar esta versión de tarifa?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              aria-label="Eliminar"
              loading={isDeleting}
              disabled={editingId !== null}
            >
              {compactActions ? null : 'Eliminar'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const dataSource = versions.map((v) => ({
    key: v.id,
    ...v,
  }))

  return (
    <>
      {editingId ? (
        <Card title="Editar versión" size="small" style={{ marginBottom: 16 }}>
          <Form form={editForm} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Fecha de inicio"
                  name="startDate"
                  rules={[{ required: true, message: 'La fecha es obligatoria.' }]}
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
            <Space>
              <Button
                type="primary"
                onClick={handleSaveEdit}
                loading={isUpdating}
              >
                Guardar
              </Button>
              <Button onClick={() => setEditingId(null)}>
                Cancelar
              </Button>
            </Space>
          </Form>
        </Card>
      ) : null}

      <Table
        className={styles.table}
        columns={columns}
        dataSource={dataSource}
        pagination={{ pageSize: 10 }}
        size="small"
        rowClassName={(record) => (record.id === selectedVersionId ? 'ant-table-row-selected' : '')}
      />
    </>
  )
}

export default TariffVersionsList
