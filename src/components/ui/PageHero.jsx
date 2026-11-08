import { Typography } from 'antd'
import styles from './PageHero.module.css'

/**
 * Compact hero header for admin/config pages.
 *
 * Renders an eyebrow label, a page title, an optional description and an
 * optional `aside` panel (status, counters, contextual hints). It stays
 * compact on small screens to reduce the scroll above the page sections;
 * from 1024px the content and the aside render side by side.
 *
 * Props:
 *   eyebrow     — small uppercase label above the title
 *   title       — main heading text
 *   description — paragraph below the title
 *   aside       — optional right-hand panel content
 */
function PageHero({ eyebrow, title, description, aside }) {
  return (
    <section className={`${styles.hero} ${aside ? styles.hasAside : ''}`}>
      <div className={styles.content}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <Typography.Title level={2} className={styles.title}>
          {title}
        </Typography.Title>
        {description ? (
          <Typography.Paragraph type="secondary" className={styles.description}>
            {description}
          </Typography.Paragraph>
        ) : null}
      </div>

      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </section>
  )
}

export default PageHero
