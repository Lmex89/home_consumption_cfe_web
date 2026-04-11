import { apiEndpoints, authConfig } from '../config/apiConfig'
import { requestApi } from '../lib/apiClient'
import {
  clearAuthSession,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
} from '../lib/authStorage'

export async function login(username, password) {
  const payload = await requestApi(apiEndpoints.authLogin, {
    method: 'POST',
    requiresAuth: false,
    bodyType: 'form',
    body: {
      username,
      password,
    },
  })

  if (payload?.access_token) {
    setAccessToken(payload.access_token)
  }

  setRefreshToken(payload?.refresh_token || '')

  return payload
}

export async function register(user) {
  if (!authConfig.registerApiKey) {
    throw new Error('Missing VITE_REGISTER_API_KEY configuration.')
  }

  return requestApi(apiEndpoints.authRegister, {
    method: 'POST',
    requiresAuth: false,
    headers: {
      'x-api-key': authConfig.registerApiKey,
    },
    body: {
      username: user.username,
      password: user.password,
      email: user.email || null,
      full_name: user.fullName || null,
      role: user.role || 'user',
    },
  })
}

export async function getCurrentUser() {
  return requestApi(apiEndpoints.authMe)
}

export function logout() {
  clearAuthSession()
}

export function hasToken() {
  return Boolean(getAccessToken())
}
