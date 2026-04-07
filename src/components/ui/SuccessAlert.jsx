import { Alert } from 'antd'

/**
 * Renders a success Alert when `message` is non-empty, otherwise renders nothing.
 * Drop-in replacement for the inline conditional pattern used across all forms.
 */
function SuccessAlert({ message }) {
  if (!message) return null

  return (
    <Alert
      type="success"
      showIcon
      message={message}
      style={{ marginBottom: 16 }}
    />
  )
}

export default SuccessAlert
