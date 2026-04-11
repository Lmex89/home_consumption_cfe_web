import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import styles from './LoginPage.module.css'

function LoginPage() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (values) => {
    setSubmitting(true)
    setError('')

    try {
      await login(values.username, values.password)
      navigate(from, { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'No fue posible iniciar sesion.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <Space direction="vertical" size={6}>
          <Typography.Title level={3} className={styles.title}>
            Iniciar sesion
          </Typography.Title>
          <Typography.Text type="secondary">
            Ingresa tus credenciales para acceder al panel.
          </Typography.Text>
        </Space>

        {error ? <Alert type="error" showIcon message={error} className={styles.alert} /> : null}

        <Form layout="vertical" onFinish={handleSubmit} autoComplete="on">
          <Form.Item
            name="username"
            label="Usuario"
            rules={[{ required: true, message: 'Ingresa tu usuario.' }]}
          >
            <Input placeholder="usuario" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contrasena"
            rules={[{ required: true, message: 'Ingresa tu contrasena.' }]}
          >
            <Input.Password placeholder="********" />
          </Form.Item>

          <Button block type="primary" htmlType="submit" loading={submitting}>
            Entrar
          </Button>
        </Form>

        <Typography.Paragraph className={styles.footerText}>
          No tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}

export default LoginPage
