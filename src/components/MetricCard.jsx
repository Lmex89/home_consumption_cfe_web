import { Card, Statistic, Typography } from 'antd'

function MetricCard({ label, value, hint }) {
  return (
    <Card>
      <Statistic title={label} value={value} valueStyle={{ fontSize: 28 }} />
      {hint ? (
        <Typography.Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
          {hint}
        </Typography.Text>
      ) : null}
    </Card>
  )
}

export default MetricCard