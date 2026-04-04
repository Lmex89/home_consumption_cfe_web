import { Card, Typography } from 'antd'
import styles from './MetricCard.module.css'

function MetricCard({ label, value, hint, tone = 'default' }) {
  const toneClassName = tone === 'accent'
    ? styles.accent
    : tone === 'soft'
      ? styles.soft
      : ''

  return (
    <Card className={`${styles.card} ${toneClassName}`.trim()}>
      <Typography.Paragraph className={styles.label}>{label}</Typography.Paragraph>
      <Typography.Text className={styles.value}>{value}</Typography.Text>
      {hint ? <Typography.Paragraph className={styles.hint}>{hint}</Typography.Paragraph> : null}
    </Card>
  )
}

export default MetricCard