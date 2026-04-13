import { Typography } from 'antd'
import styles from './DashboardHighlight.module.css'

function DashboardHighlight({ totalCost, totalReadings }) {
  const currencyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  })

  return (
    <div 
      className={`${styles.highlight} ${styles.revealUp} ${styles.revealUpDelay}`}
      role="region"
      aria-label="Costo total estimado del período"
      aria-live="polite"
    >
      <span className={styles.highlightLabel}>Total estimado del periodo</span>
      <strong aria-label={`Costo total: ${currencyFormatter.format(totalCost)}`}>
        {currencyFormatter.format(totalCost)}
      </strong>
      <p className={styles.totalCostLabel}>
        {totalReadings} lecturas disponibles para el periodo seleccionado.
      </p>
    </div>
  )
}

export default DashboardHighlight
