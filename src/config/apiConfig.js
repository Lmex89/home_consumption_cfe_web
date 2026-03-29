const backendProtocol = import.meta.env.VITE_BACKEND_PROTOCOL || 'http'
const backendHost = import.meta.env.VITE_BACKEND_HOST || 'localhost'
const backendPort = import.meta.env.VITE_BACKEND_PORT || '3001'
const backendBasePath = import.meta.env.VITE_BACKEND_BASE_PATH || '/api'

const normalizedBasePath = backendBasePath.startsWith('/')
  ? backendBasePath
  : `/${backendBasePath}`
const hostWithPort = backendPort ? `${backendHost}:${backendPort}` : backendHost

export const backendConfig = {
  protocol: backendProtocol,
  host: backendHost,
  port: backendPort,
  basePath: normalizedBasePath,
  baseUrl: `${backendProtocol}://${hostWithPort}${normalizedBasePath}`,
}

export const apiEndpoints = {
  consumptions: '/consumptions',
  dashboard: '/consumptions/dashboard',
}

export function buildApiUrl(endpoint) {
  return `${backendConfig.baseUrl}${endpoint}`
}
