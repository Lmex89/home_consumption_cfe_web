import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import { BrowserRouter } from 'react-router-dom'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, useTheme } from './contexts/ThemeContext.jsx'

// Shared tokens that don't change with the theme.
const baseThemeTokens = {
  token: {
    colorPrimary: '#3b82f6',
    colorSuccess: '#10b981',
    colorError: '#ef4444',
    colorLink: '#3b82f6',
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
}

// Layout/Menu tokens are explicitly overridden per mode because the sidebar
// keeps its own dark palette even in light mode.
const lightComponentTokens = {
  Layout: {
    bodyBg: '#f5f5f5',
    headerBg: 'rgba(255, 255, 255, 0.92)',
    siderBg: '#0f172a',
    triggerBg: '#0b1223',
  },
  Menu: {
    itemSelectedBg: 'rgba(59, 130, 246, 0.18)',
    itemSelectedColor: '#93c5fd',
    itemHoverColor: '#dbeafe',
  },
}

const darkComponentTokens = {
  Layout: {
    bodyBg: '#141414',
    headerBg: 'rgba(30, 30, 30, 0.92)',
    siderBg: '#1f1f1f',
    triggerBg: '#2a2a2a',
  },
  Menu: {
    itemSelectedBg: 'rgba(59, 130, 246, 0.18)',
    itemSelectedColor: '#93c5fd',
    itemHoverColor: '#dbeafe',
  },
}

// ConfigProvider must be inside ThemeProvider so useTheme resolves;
// a separate component is needed because hooks can't be called conditionally.
// eslint-disable-next-line react-refresh/only-export-components
function ThemedApp() {
  const { theme: currentTheme } = useTheme()
  const isDark = currentTheme === 'dark'

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: baseThemeTokens.token,
        components: {
          ...baseThemeTokens.components,
          ...(isDark ? darkComponentTokens : lightComponentTokens),
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  </StrictMode>,
)
