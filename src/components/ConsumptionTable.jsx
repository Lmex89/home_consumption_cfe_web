import { EditOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Modal, Space, Table, Typography, message } from 'antd'
import { useState } from 'react'

function ConsumptionTable({ items, onUpdateItem }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue({
      fecha: record.fecha,
      kWh: Number(record.kWh),
    })
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    form.resetFields()
  }

  const handleSave = async () => {
    if (!editingItem || !onUpdateItem) {
      return
    }

    try {
      const values = await form.validateFields()
      setIsSubmitting(true)
      await onUpdateItem(editingItem.id, values)
      message.success('Lectura actualizada correctamente.')
      handleCancel()
    } catch (error) {
      if (error?.errorFields) {
        return
      }

      console.error('Error updating meter reading:', error)
      message.error(error.message || 'Error al actualizar la lectura.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
    },
    {
      title: 'kWh consumidos',
      dataIndex: 'kWh',
      key: 'kWh',
      render: (value) => Number(value).toFixed(1),
    },
    {
      title: 'Nota',
      dataIndex: 'note',
      key: 'note',
      render: (value) => value || 'Sin observaciones',
    },
  ]

  if (onUpdateItem) {
    columns.push({
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          Editar
        </Button>
      ),
    })
  }

  return (
    <>
      <Card
        title="Lecturas recientes"
        extra={<Typography.Text type="secondary">Ultimos consumos registrados por fecha</Typography.Text>}
      >
        <Table
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={items}
          pagination={false}
          locale={{ emptyText: 'No hay consumos para mostrar.' }}
          scroll={{ x: 640 }}
        />
      </Card>

      <Modal
        title="Editar lectura"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={handleCancel}
        confirmLoading={isSubmitting}
        okText="Guardar"
        cancelText="Cancelar"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Form.Item
              label="Fecha"
              name="fecha"
              rules={[{ required: true, message: 'La fecha es obligatoria.' }]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item
              label="Lectura kWh"
              name="kWh"
              rules={[
                { required: true, message: 'La lectura es obligatoria.' },
                {
                  validator: (_, value) => {
                    if (value > 0) return Promise.resolve()
                    return Promise.reject(new Error('La lectura debe ser un numero positivo.'))
                  },
                },
              ]}
            >
              <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  )
}

export default ConsumptionTable