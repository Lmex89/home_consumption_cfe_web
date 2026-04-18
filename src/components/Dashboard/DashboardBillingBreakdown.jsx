import { Collapse, Flex, Space, Typography } from 'antd'
import styles from './DashboardBillingBreakdown.module.css'

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

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
