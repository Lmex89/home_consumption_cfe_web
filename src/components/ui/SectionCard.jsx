import { Card, Typography } from 'antd'

/**
 * Reusable page section header card.
 * Renders an optional eyebrow label, a title, and an optional description
 * inside an Ant Design Card.
 *
 * Props:
 *   eyebrow     — small uppercase label above the title
 *   title       — main heading text
 *   level       — Typography.Title heading level (default: 3)
 *   description — paragraph below the title
 *   extra       — passed to the Card's extra prop (right-aligned header content)
 *   children    — optional content rendered below the description
 */
function SectionCard({ eyebrow, title, description, level = 3, extra, children }) {
  return (
    <Card extra={extra}>
      {eyebrow ? (
        <Typography.Text type="secondary">{eyebrow}</Typography.Text>
      ) : null}
      {title ? (
        <Typography.Title
          level={level}
          style={{ marginTop: eyebrow ? 4 : 0, marginBottom: description || children ? undefined : 0 }}
        >
          {title}
        </Typography.Title>
      ) : null}
      {description ? (
        <Typography.Paragraph type="secondary" style={{ marginBottom: children ? 16 : 0 }}>
          {description}
        </Typography.Paragraph>
      ) : null}
      {children}
    </Card>
  )
}

export default SectionCard
