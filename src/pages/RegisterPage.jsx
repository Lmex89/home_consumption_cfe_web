import { Alert, Button, Card, Form, Input, Select, Space, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/authService'
import styles from './RegisterPage.module.css'

const roleOptions = [
  { value: 'user', label: 'Usuario' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Administrador' },
]

function RegisterPage() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (values) => {
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await register(values)
      setSuccess('Cuenta creada correctamente. Ahora puedes iniciar sesion.')
      setTimeout(() => navigate('/login'), 900)
    } catch (requestError) {
      setError(requestError.message || 'No fue posible registrar la cuenta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <Space direction="vertical" size={6}>
          <Typography.Title level={3} className={styles.title}>
            Crear cuenta
          </Typography.Title>
          <Typography.Text type="secondary">
            Registro protegido por API key del backend.
          </Typography.Text>
        </Space>

        {error ? <Alert type="error" showIcon message={error} className={styles.alert} /> : null}
        {success ? <Alert type="success" showIcon message={success} className={styles.alert} /> : null}

        <Form layout="vertical" onFinish={handleSubmit} initialValues={{ role: 'user' }}>
          <Form.Item
            name="username"
            label="Usuario"
            rules={[{ required: true, message: 'Ingresa un usuario.' }]}
          >
            <Input placeholder="nuevo_usuario" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contrasena"
            rules={[
              { required: true, message: 'Ingresa una contrasena.' },
              { min: 6, message: 'Usa al menos 6 caracteres.' },
            ]}
          >
            <Input.Password placeholder="********" />
          </Form.Item>

          <Form.Item name="email" label="Email">
            <Input placeholder="correo@dominio.com" />
          </Form.Item>

          <Form.Item name="fullName" label="Nombre completo">
            <Input placeholder="Nombre Apellido" />
          </Form.Item>

          <Form.Item name="role" label="Rol" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>

          <Button block type="primary" htmlType="submit" loading={submitting}>
            Registrar cuenta
          </Button>
        </Form>

        <Typography.Paragraph className={styles.footerText}>
          Ya tienes cuenta? <Link to="/login">Iniciar sesion</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}

export default RegisterPage
