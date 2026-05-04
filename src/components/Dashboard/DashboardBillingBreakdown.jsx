import { Collapse, Divider, Flex, Space, Tag, Typography } from 'antd'
import styles from './DashboardBillingBreakdown.module.css'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

const kwhFormatter = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const MONTH_NAMES = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

const TIER_COLORS = { 1: 'green', 2: 'blue', 3: 'volcano' }

function groupByTier(tierLines) {
  return tierLines.reduce((acc, line) => {
    const key = line.tier_level
    if (!acc[key]) {
      acc[key] = { name: line.tier_name, color: TIER_COLORS[key] ?? 'default', lines: [] }
    }
    acc[key].lines.push(line)
    return acc
  }, {})
}

function CfeTierBreakdown({ cfeBreakdown }) {
  const groups = groupByTier(cfeBreakdown.tier_lines)

  return (
    <Space direction="vertical" style={{ display: 'flex' }}>
      {Object.values(groups).map((group) => (
        <div key={group.name}>
          <Flex align="center" gap={8} style={{ marginBottom: 6 }}>
            <Tag color={group.color} style={{ margin: 0, fontWeight: 700 }}>
              {group.name}
            </Tag>
          </Flex>
          <Space direction="vertical" style={{ display: 'flex', paddingLeft: 8 }}>
            {group.lines.map((line) => (
              <Flex
                key={`${line.segment_year}-${line.segment_month}-${line.tier_level}`}
                justify="space-between"
                align="center"
                wrap="wrap"
                gap={4}
              >
                <Typography.Text type="secondary" style={{ fontSize: '0.82rem' }}>
                  {MONTH_NAMES[line.segment_month]} {line.segment_year}
                  {' · '}{line.days_in_segment} días
                  {' · '}{kwhFormatter.format(line.kwh_charged)} kWh
                  {' × '}{currencyFormatter.format(line.price_per_kwh)}/kWh
                </Typography.Text>
                <Typography.Text style={{ fontSize: '0.85rem' }}>
                  {currencyFormatter.format(line.subtotal)}
                </Typography.Text>
              </Flex>
            ))}
          </Space>
          <Divider style={{ margin: '8px 0' }} />
        </div>
      ))}
    </Space>
  )
}

function DashboardBillingBreakdown({ billing }) {
  return (
    <section
      className={styles.breakdown}
      aria-labelledby="billing-breakdown-title"
    >
      <Collapse
        className={styles.breakdownCollapse}
        bordered={false}
        items={[
          {
            key: 'billing-breakdown',
            label: <span id="billing-breakdown-title">Ver desglose del total en MXN</span>,
            children: (
              <Space direction="vertical" style={{ display: 'flex' }} role="list">
                {billing.cfeBreakdown?.tier_lines?.length > 0 && (
                  <CfeTierBreakdown cfeBreakdown={billing.cfeBreakdown} />
                )}

                {billing.breakdown.length > 0 ? (
                  billing.breakdown.map((line) => (
                    <Flex
                      key={line.concept}
                      justify="space-between"
                      align="center"
                      role="listitem"
                    >
                      <Typography.Text type="secondary">{line.concept}</Typography.Text>
                      <Typography.Text strong>
                        {currencyFormatter.format(line.amount)}
                      </Typography.Text>
                    </Flex>
                  ))
                ) : (
                  <Typography.Text type="secondary" role="status">
                    No hay desglose disponible para el periodo de facturacion actual.
                  </Typography.Text>
                )}

                <Typography.Text strong>
                  Total facturado estimado: {currencyFormatter.format(billing.totalMxn)}
                </Typography.Text>
              </Space>
            ),
          },
        ]}
      />
    </section>
  )
}

export default DashboardBillingBreakdown
