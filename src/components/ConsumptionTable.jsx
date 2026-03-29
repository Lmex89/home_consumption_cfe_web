import { Card, Table, Typography } from 'antd'

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
    render: (value) => value.toFixed(1),
  },
  {
    title: 'Nota',
    dataIndex: 'note',
    key: 'note',
    render: (value) => value || 'Sin observaciones',
  },
]

function ConsumptionTable({ items }) {
  return (
    <Card
      title="Lecturas recientes"
      extra={<Typography.Text type="secondary">Ultimos consumos registrados por fecha</Typography.Text>}
    >
      <Table
        rowKey={(record) => `${record.fecha}-${record.note ?? 'sin-nota'}`}
        columns={columns}
        dataSource={items}
        pagination={false}
        locale={{ emptyText: 'No hay consumos para mostrar.' }}
        scroll={{ x: 640 }}
      />
    </Card>
  )
}

export default ConsumptionTable