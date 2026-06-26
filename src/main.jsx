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
          colorBgBase: '#f4f6fa',
          colorBgLayout: '#f4f6fa',
          borderRadius: 12,
          borderRadiusLG: 18,
          fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
          controlHeight: 44,
          controlHeightLG: 48,
          controlOutlineWidth: 0,
          lineWidth: 1,
          lineWidthFocus: 2,
        },
        components: {
          Button: {
            controlHeight: 44,
            borderRadius: 12,
            primaryShadow: 'none',
          },
          Alert: {
            withDescriptionIconSize: 18,
            borderRadiusLG: 14,
          },
          Layout: {
            bodyBg: '#f4f6fa',
            headerBg: 'rgba(255, 255, 255, 0.92)',
            siderBg: '#0f172a',
            triggerBg: '#0b1223',
          },
          Menu: {
            itemSelectedBg: 'rgba(59, 130, 246, 0.18)',
            itemSelectedColor: '#93c5fd',
            itemHoverColor: '#dbeafe',
          },
          Card: {
            borderRadiusLG: 18,
          },
          Select: {
            controlHeight: 44,
            borderRadius: 12,
          },
          Input: {
            controlHeight: 44,
            borderRadius: 12,
          },
          InputNumber: {
            controlHeight: 44,
            borderRadius: 12,
          },
          Modal: {
            borderRadiusLG: 18,
          },
          Table: {
            borderRadius: 14,
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
