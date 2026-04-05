import { Table, Button, message, Space, Popconfirm, Form, Input, Row, Col, Card, Tag } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { deleteTariffVersion, updateTariffVersion } from '../services/householdService'

function TariffVersionsList({ versions, selectedVersionId, onRefresh, onSelectVersion }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm] = Form.useForm()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

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
      width: 60,
    },
    {
      title: 'Fecha Inicio',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: 'Fecha Fin',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (text) => text || '-',
    },
    {
      title: 'Estado',
      key: 'selected',
      width: 110,
      render: (_, record) => (
        record.id === selectedVersionId ? <Tag color="blue">Activa</Tag> : null
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 230,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => onSelectVersion?.(record)}
            disabled={editingId !== null}
          >
            Rangos
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={editingId !== null}
          >
            Editar
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
              loading={isDeleting}
              disabled={editingId !== null}
            >
              Eliminar
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
        columns={columns}
        dataSource={dataSource}
        pagination={{ pageSize: 10 }}
        size="small"
        scroll={{ x: 400 }}
        rowClassName={(record) => (record.id === selectedVersionId ? 'ant-table-row-selected' : '')}
      />
    </>
  )
}

export default TariffVersionsList
