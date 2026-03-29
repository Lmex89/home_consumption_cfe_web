const backendProtocol = import.meta.env.VITE_BACKEND_PROTOCOL || 'http'
const backendHost = import.meta.env.VITE_BACKEND_HOST || 'localhost'
const backendPort = import.meta.env.VITE_BACKEND_PORT || '8000'
const backendBasePath = import.meta.env.VITE_BACKEND_BASE_PATH || ''

const normalizedBasePath = backendBasePath
  ? backendBasePath.startsWith('/')
    ? backendBasePath
    : `/${backendBasePath}`
  : ''
const hostWithPort = backendPort ? `${backendHost}:${backendPort}` : backendHost

export const backendConfig = {
  protocol: backendProtocol,
  host: backendHost,
  port: backendPort,
  basePath: normalizedBasePath,
  baseUrl: `${backendProtocol}://${hostWithPort}${normalizedBasePath}`,
}

export const apiEndpoints = {
  households: '/households',
  meterReadings: '/meter-readings',
  billingPeriods: '/billing-periods',
  billingPeriodDashboard: (billingPeriodId) => `/dashboards/billing-period/${billingPeriodId}`,
}

export function buildApiUrl(endpoint) {
  return `${backendConfig.baseUrl}${endpoint}`
}
