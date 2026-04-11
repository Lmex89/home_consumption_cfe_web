import {
  CalendarOutlined,
  FormOutlined,
  LogoutOutlined,
  MenuOutlined,
  ThunderboltOutlined,
  HomeOutlined,
  TagOutlined,
} from '@ant-design/icons'
import { Button, Drawer, Grid, Layout as AntLayout, Menu, Space, Typography } from 'antd'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'

const { Header, Sider, Content } = AntLayout
const { useBreakpoint } = Grid

const navItems = [
  { key: '/', icon: <ThunderboltOutlined />, label: 'Dashboard' },
  { key: '/insertar-consumo', icon: <FormOutlined />, label: 'Lecturas de Medidor' },
  { key: '/agregar-vivienda', icon: <HomeOutlined />, label: 'Alta Viviendas' },
  { key: '/agregar-tarifa', icon: <TagOutlined />, label: 'Alta Tarifas' },
  { key: '/agregar-periodo', icon: <CalendarOutlined />, label: 'Alta Periodos' },
]

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isMobile = !screens.lg

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/insertar-consumo')) return '/insertar-consumo'
    if (location.pathname.startsWith('/agregar-vivienda')) return '/agregar-vivienda'
    if (location.pathname.startsWith('/agregar-tarifa')) return '/agregar-tarifa'
    if (location.pathname.startsWith('/agregar-periodo')) return '/agregar-periodo'
    return '/'
  }

  const selectedKey = getSelectedKey()

  const handleNavigate = (key) => {
    navigate(key)
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {!isMobile ? (
        <Sider
          collapsible
          breakpoint="lg"
          collapsedWidth={80}
          theme="dark"
          width={240}
        >
          <div className="app-brand">
            <ThunderboltOutlined />
            <span>CFE Web</span>
          </div>
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[selectedKey]}
            items={navItems}
            onClick={({ key }) => handleNavigate(key)}
          />
        </Sider>
      ) : null}

      <AntLayout>
        <Header
          style={{
            height: 'auto',
            padding: isMobile ? '16px' : '20px 24px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
            <Space direction="vertical" size={0}>
              <Typography.Title level={3} className="app-shell-title">
                Panel de consumos CFE
              </Typography.Title>
              <Typography.Text className="app-shell-subtitle">
                Monitoreo de consumo energetico y registro de lecturas conectado al backend FastAPI.
              </Typography.Text>
            </Space>
            {isMobile ? (
              <Space>
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  aria-label="Cerrar sesion"
                  onClick={handleLogout}
                >
                  Salir
                </Button>
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  aria-label="Abrir menu"
                  onClick={() => setIsMobileMenuOpen(true)}
                />
              </Space>
            ) : null}
            {!isMobile ? (
              <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
                Cerrar sesion
              </Button>
            ) : null}
          </Space>
        </Header>
        <Content style={{ padding: isMobile ? 16 : 24 }}>
          <Outlet />
        </Content>
      </AntLayout>

      <Drawer
        placement="left"
        width={240}
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title={null}
        closable={false}
        styles={{
          body: {
            padding: 0,
            background: '#0f172a',
          },
        }}
      >
        <div className="app-brand">
          <ThunderboltOutlined />
          <span>CFE Web</span>
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[selectedKey]}
          items={navItems}
          onClick={({ key }) => handleNavigate(key)}
        />
      </Drawer>
    </AntLayout>
  )
}

export default Layout