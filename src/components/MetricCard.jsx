import { Card, Typography } from 'antd'
import styles from './MetricCard.module.css'

function MetricCard({ label, value, hint, tone = 'default', secondaryValue, secondaryLabel }) {
  const toneClassName = tone === 'accent'
    ? styles.accent
    : tone === 'soft'
      ? styles.soft
      : ''

  return (
    <Card className={`${styles.card} ${toneClassName}`.trim()}>
      <Typography.Paragraph className={styles.label}>{label}</Typography.Paragraph>
      <Typography.Text className={styles.value}>{value}</Typography.Text>
      {secondaryValue ? (
        <div className={styles.secondaryMetric}>
          {secondaryLabel ? <Typography.Paragraph className={styles.secondaryLabel}>{secondaryLabel}</Typography.Paragraph> : null}
          <Typography.Text className={styles.secondaryValue}>{secondaryValue}</Typography.Text>
        </div>
      ) : null}
      {hint ? <Typography.Paragraph className={styles.hint}>{hint}</Typography.Paragraph> : null}
    </Card>
  )
}

export default MetricCard