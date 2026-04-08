const backendProtocol = import.meta.env.VITE_BACKEND_PROTOCOL || 'http'
const backendHost = import.meta.env.VITE_BACKEND_HOST || 'localhost'
const backendPort = import.meta.env.VITE_BACKEND_PORT || ''
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

export const authConfig = {
  registerApiKey: import.meta.env.VITE_REGISTER_API_KEY || '',
}

export const apiEndpoints = {
  authLogin: '/auth/login',
  authRegister: '/auth/register',
  authMe: '/auth/me',
  households: '/households',
  tariffs: '/tariffs',
  tariffVersions: '/tariff-versions',
  tariffRanges: '/tariff-ranges',
  householdTariffs: '/household-tariffs',
  meterReadings: '/meter-readings',
  billingPeriods: '/billing-periods',
  billingPeriodDashboard: (billingPeriodId) => `/dashboards/billing-period/${billingPeriodId}`,
}

export function buildApiUrl(endpoint) {
  return `${backendConfig.baseUrl}${endpoint}`
}
