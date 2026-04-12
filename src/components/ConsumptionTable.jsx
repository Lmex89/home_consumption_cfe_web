import { EditOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Spin, Table, Typography, message } from 'antd'
import { useState } from 'react'
import styles from './ConsumptionTable.module.css'

function ConsumptionTable({
  items,
  paginationConfig,
  displayItems,
  showAll,
  isLoadingAll,
  onUpdateItem,
  onToggleShowAll,
  onPageSizeChange,
  pageSize,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  const effectiveItems = displayItems || items

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

  const effectivePageSize = pageSize || 10
  const showPageSizeSelector = !showAll && effectiveItems.length > 10

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
        className={styles.wrapper}
        title={(
          <div>
            <p className={styles.eyebrow}>Historial</p>
            <h3 className={styles.title}>Lecturas recientes</h3>
          </div>
        )}
        extra={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography.Paragraph className={styles.caption} style={{ margin: 0 }}>
              Ultimos consumos registrados por fecha
            </Typography.Paragraph>
            {showPageSizeSelector && onPageSizeChange && (
              <Select
                value={effectivePageSize}
                onChange={onPageSizeChange}
                options={[
                  { value: 10, label: '10 por página' },
                  { value: 50, label: '50 por página' },
                  { value: 100, label: '100 por página' },
                ]}
                style={{ width: 140 }}
                size="small"
              />
            )}
            {isLoadingAll ? (
              <Spin size="small" />
            ) : onToggleShowAll ? (
              <Button
                type={showAll ? 'primary' : 'default'}
                size="small"
                onClick={onToggleShowAll}
              >
                {showAll ? 'Mostrar por periodo' : 'Mostrar todo'}
              </Button>
            ) : null}
          </div>
        }
      >
        <Table
          className={styles.table}
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={effectiveItems}
          pagination={paginationConfig || false}
          locale={{ emptyText: 'No hay consumos para mostrar.' }}
          scroll={{ x: 720 }}
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