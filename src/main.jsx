import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import { BrowserRouter } from 'react-router-dom'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          colorSuccess: '#10b981',
          colorError: '#ef4444',
          colorLink: '#3b82f6',
          colorBgBase: '#f5f5f5',
          colorBgLayout: '#f5f5f5',
          borderRadius: 12,
          fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
        },
        components: {
          Button: {
            controlHeight: 40,
          },
          Alert: {
            withDescriptionIconSize: 18,
          },
          Layout: {
            bodyBg: '#f5f5f5',
            headerBg: '#ffffff',
            siderBg: '#0f172a',
            triggerBg: '#0b1223',
          },
          Menu: {
            itemSelectedBg: 'rgba(59, 130, 246, 0.18)',
            itemSelectedColor: '#93c5fd',
            itemHoverColor: '#dbeafe',
          },
          Card: {
            borderRadiusLG: 16,
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
)
