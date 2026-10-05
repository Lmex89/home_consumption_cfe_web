import { Collapse } from 'antd'
import styles from './SectionCollapse.module.css'

/**
 * Card-styled accordion for admin/config page sections.
 *
 * Thin wrapper over Ant Design's Collapse that centralizes the panel chrome
 * (card surface, compact paddings on mobile) so the admin pages
 * (/agregar-vivienda, /agregar-periodo y /agregar-tarifa) present their forms
 * as collapsible sections and reduce the total scroll on small screens.
 *
 * All Collapse props are forwarded as-is: `items` (key/label/children),
 * `activeKey`, `defaultActiveKey`, `onChange` and `accordion`.
 */
function SectionCollapse(props) {
  return <Collapse bordered={false} className={styles.sections} {...props} />
}

export default SectionCollapse
