import { useState } from 'react'
import {
  CalendarOutlined,
  EllipsisOutlined,
  FormOutlined,
  LogoutOutlined,
  ThunderboltOutlined,
  HomeOutlined,
  TagOutlined,
} from '@ant-design/icons'
import { Button, Drawer, Grid, Layout as AntLayout, Menu, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../services/authService'
import styles from './Layout.module.css'

const { Header, Sider, Content } = AntLayout
const { useBreakpoint } = Grid

const primaryNavItems = [
  { key: '/', icon: <ThunderboltOutlined />, label: 'Dashboard' },
  { key: '/insertar-consumo', icon: <FormOutlined />, label: 'Lecturas' },
]

const moreNavItems = [
  { key: '/agregar-vivienda', icon: <HomeOutlined />, label: 'Viviendas' },
  { key: '/agregar-tarifa', icon: <TagOutlined />, label: 'Tarifas' },
  { key: '/agregar-periodo', icon: <CalendarOutlined />, label: 'Periodos' },
]

const desktopNavItems = [...primaryNavItems, ...moreNavItems]

// Más is an action, not a route, so it lives outside the route arrays.
const moreTab = { icon: <EllipsisOutlined />, label: 'Más' }

const navButtonVariants = {
  tab: {
    button: styles.navItem,
    active: styles.navItemActive,
    icon: styles.navIcon,
    label: styles.navLabel,
  },
  drawer: {
    button: styles.drawerItem,
    active: styles.drawerItemActive,
    icon: styles.drawerItemIcon,
    label: styles.drawerItemLabel,
  },
}

// Shared renderer for the bottom-nav tabs and the drawer rows: same button,
// active state and aria wiring, different classes per variant.
function NavButton({ item, variant, isActive, isCurrent = isActive, onClick, ...aria }) {
  const variantStyles = navButtonVariants[variant]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${variantStyles.button} ${isActive ? variantStyles.active : ''}`}
      aria-current={isCurrent ? 'page' : undefined}
      {...aria}
    >
      <span className={variantStyles.icon}>{item.icon}</span>
      <span className={variantStyles.label}>{item.label}</span>
    </button>
  )
}

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  // `screens.lg` is undefined until the breakpoint observer measures after
  // mount; requiring an explicit false keeps desktop from flashing the mobile
  // bottom nav on the first render.
  const isMobile = screens.lg === false

  // Prefix-match the pathname against the nav routes; `/` is the fallback, so
  // it never participates in the match.
  const matchedNavItem = desktopNavItems.find(
    (item) => item.key !== '/' && location.pathname.startsWith(item.key),
  )
  const selectedKey = matchedNavItem?.key ?? '/'
  const isMoreRoute = moreNavItems.some((item) => item.key === selectedKey)
  const [lastShellState, setLastShellState] = useState({ pathname: location.pathname, isMobile })

  // Adjusting state during render (instead of an effect) closes the drawer
  // whenever the route or the shell breakpoint changes — including browser
  // back/forward and mobile/desktop resizes.
  if (lastShellState.pathname !== location.pathname || lastShellState.isMobile !== isMobile) {
    setLastShellState({ pathname: location.pathname, isMobile })
    setIsMoreOpen(false)
  }

  const handleNavigate = (key) => {
    setIsMoreOpen(false)
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
            items={desktopNavItems}
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
          {!isMobile ? (
            <Button
              type="text"
              icon={<LogoutOutlined />}
              aria-label="Cerrar sesion"
              onClick={handleLogout}
              className={styles.logoutBtn}
            />
          ) : null}
        </Header>

        <Content className={styles.content}>
          <Outlet />
        </Content>

        {isMobile ? (
          <nav className={styles.bottomNav} aria-label="Navegacion principal">
            {primaryNavItems.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                variant="tab"
                isActive={selectedKey === item.key}
                onClick={() => handleNavigate(item.key)}
              />
            ))}
            {/* While the drawer is open its row owns the "current page" marker;
                the tab keeps its visual highlight and expanded state. */}
            <NavButton
              item={moreTab}
              variant="tab"
              isActive={isMoreRoute}
              isCurrent={isMoreRoute && !isMoreOpen}
              onClick={() => setIsMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isMoreOpen}
            />
          </nav>
        ) : null}

        {isMobile ? (
          <Drawer
            title="Más"
            placement="right"
            size={280}
            open={isMoreOpen}
            onClose={() => setIsMoreOpen(false)}
            classNames={{ body: styles.moreDrawerBody }}
          >
            <nav className={styles.moreDrawerNav} aria-label="Más opciones">
              {moreNavItems.map((item) => (
                <NavButton
                  key={item.key}
                  item={item}
                  variant="drawer"
                  isActive={selectedKey === item.key}
                  onClick={() => handleNavigate(item.key)}
                />
              ))}
            </nav>
            <Button
              type="text"
              danger
              block
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              className={styles.drawerLogout}
            >
              Cerrar sesión
            </Button>
          </Drawer>
        ) : null}
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
