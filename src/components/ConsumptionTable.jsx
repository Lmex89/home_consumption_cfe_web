import { EditOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Spin, Table, Typography, message } from 'antd'
import { useState } from 'react'
import styles from './ConsumptionTable.module.css'

function ConsumptionTable({ items, allItems, onUpdateItem, onLoadAllItems, isLoadingAll }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [showAll, setShowAll] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

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

  const handleToggleShowAll = async () => {
    const newShowAll = !showAll
    setShowAll(newShowAll)
    setCurrentPage(1)

    // Fetch all items if switching to "show all" and not already loaded
    if (newShowAll && !allItems && onLoadAllItems) {
      await onLoadAllItems()
    }
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const displayItems = showAll ? (allItems || items) : items

  const paginationConfig = showAll
    ? false
    : {
        current: currentPage,
        pageSize,
        onChange: (page) => setCurrentPage(page),
        onShowSizeChange: (_, newPageSize) => handlePageSizeChange(newPageSize),
        showSizeChanger: true,
        pageSizeOptions: ['10', '50', '100'],
        defaultPageSize: 10,
        showTotal: (total) => `Total ${total} lecturas`,
        showQuickJumper: true,
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
            {!showAll && items.length > 10 && (
              <Select
                value={pageSize}
                onChange={handlePageSizeChange}
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
            ) : (
              <Button
                type={showAll ? 'primary' : 'default'}
                size="small"
                onClick={handleToggleShowAll}
              >
                {showAll ? 'Mostrar por periodo' : 'Mostrar todo'}
              </Button>
            )}
          </div>
        }
      >
        <Table
          className={styles.table}
          rowKey={(record) => record.id}
          columns={columns}
          dataSource={displayItems}
          pagination={paginationConfig}
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