import {
  CalendarOutlined,
  FormOutlined,
  LogoutOutlined,
  ThunderboltOutlined,
  HomeOutlined,
  TagOutlined,
} from '@ant-design/icons'
import { Button, Grid, Layout as AntLayout, Menu, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'
import styles from './Layout.module.css'

const { Header, Sider, Content } = AntLayout
const { useBreakpoint } = Grid

const navItems = [
  { key: '/', icon: <ThunderboltOutlined />, label: 'Dashboard' },
  { key: '/insertar-consumo', icon: <FormOutlined />, label: 'Lecturas' },
  { key: '/agregar-vivienda', icon: <HomeOutlined />, label: 'Viviendas' },
  { key: '/agregar-tarifa', icon: <TagOutlined />, label: 'Tarifas' },
  { key: '/agregar-periodo', icon: <CalendarOutlined />, label: 'Periodos' },
]

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const screens = useBreakpoint()
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
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <AntLayout className={styles.shell}>
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

      <AntLayout className={styles.contentArea}>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <ThunderboltOutlined className={styles.headerIcon} />
            <Typography.Title level={4} className={styles.headerTitle}>
              CFE Consumos
            </Typography.Title>
          </div>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            aria-label="Cerrar sesion"
            onClick={handleLogout}
            className={styles.logoutBtn}
          />
        </Header>

        <Content className={styles.content}>
          <Outlet />
        </Content>

        {isMobile ? (
          <nav className={styles.bottomNav} aria-label="Navegacion principal">
            {navItems.map((item) => {
              const isActive = selectedKey === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavigate(item.key)}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  type="button"
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              )
            })}
          </nav>
        ) : null}
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
