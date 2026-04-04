import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Card, Form, InputNumber, Popconfirm, Space, Table, message } from 'antd'
import { useEffect, useState } from 'react'
import { deleteTariffRange, updateTariffRange } from '../services/householdService'

function TariffRangesList({ ranges, onRefresh }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm] = Form.useForm()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (editingId && !ranges.some((range) => range.id === editingId)) {
      setEditingId(null)
      editForm.resetFields()
    }
  }, [editingId, editForm, ranges])

  const handleEdit = (record) => {
    setEditingId(record.id)
    editForm.setFieldsValue({
      rangeMin: Number(record.rangeMin),
      rangeMax: record.rangeMax === null ? null : Number(record.rangeMax),
      pricePerKwh: Number(record.pricePerKwh),
    })
  }

  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields()
      setIsUpdating(true)

      await updateTariffRange(
        editingId,
        values.rangeMin,
        values.rangeMax,
        values.pricePerKwh,
      )

      message.success('Rango tarifario actualizado correctamente.')
      setEditingId(null)
      editForm.resetFields()
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error updating tariff range:', error)
      message.error(error.message || 'Error al actualizar el rango tarifario.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (rangeId) => {
    try {
      setIsDeleting(true)
      await deleteTariffRange(rangeId)
      message.success('Rango tarifario eliminado correctamente.')
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting tariff range:', error)
      message.error(error.message || 'Error al eliminar el rango tarifario.')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    {
      title: 'Mínimo',
      dataIndex: 'rangeMin',
      key: 'rangeMin',
      render: (value) => value,
    },
    {
      title: 'Máximo',
      dataIndex: 'rangeMax',
      key: 'rangeMax',
      render: (value) => value ?? 'Abierto',
    },
    {
      title: 'Precio/kWh',
      dataIndex: 'pricePerKwh',
      key: 'pricePerKwh',
      render: (value) => value,
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={editingId !== null && editingId !== record.id}
          >
            Editar
          </Button>
          <Popconfirm
            title="Eliminar rango"
            description="¿Está seguro que desea eliminar este rango tarifario?"
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

  const dataSource = ranges.map((range) => ({
    key: range.id,
    ...range,
  }))

  return (
    <>
      {editingId ? (
        <Card title="Editar rango" size="small" style={{ marginBottom: 16 }}>
          <Form form={editForm} layout="vertical">
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <Space wrap style={{ width: '100%' }}>
                <Form.Item
                  label="Rango mínimo"
                  name="rangeMin"
                  rules={[{ required: true, message: 'El rango mínimo es obligatorio.' }]}
                  style={{ minWidth: 160, marginBottom: 0 }}
                >
                  <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                  label="Rango máximo"
                  name="rangeMax"
                  style={{ minWidth: 160, marginBottom: 0 }}
                >
                  <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                  label="Precio por kWh"
                  name="pricePerKwh"
                  rules={[{ required: true, message: 'El precio por kWh es obligatorio.' }]}
                  style={{ minWidth: 180, marginBottom: 0 }}
                >
                  <InputNumber min={0.0001} step={0.0001} precision={4} style={{ width: '100%' }} />
                </Form.Item>
              </Space>

              <Space>
                <Button type="primary" onClick={handleSaveEdit} loading={isUpdating}>
                  Guardar
                </Button>
                <Button
                  onClick={() => {
                    setEditingId(null)
                    editForm.resetFields()
                  }}
                >
                  Cancelar
                </Button>
              </Space>
            </Space>
          </Form>
        </Card>
      ) : null}

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={{ pageSize: 10 }}
        size="small"
        scroll={{ x: 540 }}
      />
    </>
  )
}

export default TariffRangesList