import { Button, Form, Space } from 'antd'

/**
 * Shared form footer: a primary submit button and an optional reset button.
 * Used across all form components to eliminate duplicated button markup.
 *
 * Props:
 *   submitLabel  — text for the submit button (default: 'Guardar')
 *   loading      — passed to the submit button's loading prop
 *   disabled     — disables the submit button
 *   onReset      — if provided, renders a secondary 'Limpiar' button that calls this handler
 */
function FormActions({ submitLabel = 'Guardar', loading = false, disabled = false, onReset }) {
  return (
    <Form.Item style={{ marginBottom: 0 }}>
      <Space wrap>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={disabled}
        >
          {submitLabel}
        </Button>
        {onReset ? (
          <Button onClick={onReset}>Limpiar</Button>
        ) : null}
      </Space>
    </Form.Item>
  )
}

export default FormActions
