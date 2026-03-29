import { FormOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Grid, Layout as AntLayout, Menu, Space, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = AntLayout
const { useBreakpoint } = Grid

const navItems = [
  { key: '/', icon: <ThunderboltOutlined />, label: 'Dashboard' },
  { key: '/insertar-consumo', icon: <FormOutlined />, label: 'Staff' },
]

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const screens = useBreakpoint()

  const selectedKey = location.pathname.startsWith('/insertar-consumo')
    ? '/insertar-consumo'
    : '/'

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        breakpoint="lg"
        collapsedWidth={screens.md ? 80 : 0}
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
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <AntLayout>
        <Header
          style={{
            height: 'auto',
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Space direction="vertical" size={0}>
            <Typography.Title level={3} className="app-shell-title">
              Panel de consumos CFE
            </Typography.Title>
            <Typography.Text className="app-shell-subtitle">
              Monitoreo de consumo energetico y registro de lecturas con backend simulado.
            </Typography.Text>
          </Space>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout