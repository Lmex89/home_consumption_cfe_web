import { apiEndpoints, buildApiUrl } from '../config/apiConfig'
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './authStorage'

// Single in-flight refresh promise to prevent concurrent refresh races.
let refreshPromise = null

async function attemptTokenRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const url = buildApiUrl(apiEndpoints.authRefresh)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!response.ok) return false

    const data = await response.json()
    if (data?.access_token) {
      setAccessToken(data.access_token)
      if (data?.refresh_token) setRefreshToken(data.refresh_token)
      return true
    }
    return false
  } catch {
    return false
  }
}

function redirectToLogin() {
  clearAuthSession()
  window.location.href = '/login'
}

/**
 * Appends query parameters to an API endpoint URL.
 * Skips undefined, null, and empty-string values.
 */
export function withQuery(endpoint, query = {}) {
  const url = new URL(buildApiUrl(endpoint))

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

/**
 * Generic API request helper.
 * On 401/403, attempts to refresh the access token once and retries.
 * If refresh fails, clears the session and redirects to /login.
 * Throws an Error with the backend detail message on non-OK responses.
 * Returns null for 204 No Content.
 */
export async function requestApi(endpoint, options = {}, _isRetry = false) {
  const {
    method = 'GET',
    query,
    body,
    headers = {},
    requiresAuth = true,
    token,
    bodyType = 'json',
  } = options
  const url = withQuery(endpoint, query)

  const requestHeaders = { ...headers }
  let requestBody

  if (requiresAuth) {
    const accessToken = token || getAccessToken()
    if (accessToken) {
      requestHeaders.Authorization = `Bearer ${accessToken}`
    }
  }

  if (body !== undefined) {
    if (bodyType === 'form') {
      const formBody = new URLSearchParams()
      Object.entries(body).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formBody.set(key, String(value))
        }
      })
      requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
      requestBody = formBody.toString()
    } else {
      requestHeaders['Content-Type'] = 'application/json'
      requestBody = JSON.stringify(body)
    }
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
  })

  if (!response.ok) {
    // Attempt token refresh on 401/403, but only once and only for auth-protected requests.
    if (
      requiresAuth &&
      !_isRetry &&
      (response.status === 401 || response.status === 403)
    ) {
      if (!refreshPromise) {
        refreshPromise = attemptTokenRefresh().finally(() => {
          refreshPromise = null
        })
      }
      const refreshed = await refreshPromise
      if (refreshed) {
        return requestApi(endpoint, { ...options, token: undefined }, true)
      }
      redirectToLogin()
      return
    }

    let detail = `Error ${response.status}`
    try {
      const payload = await response.json()
      if (typeof payload?.detail === 'string') {
        detail = payload.detail
      }
    } catch {
      // If error payload is not JSON, keep generic message.
    }
    throw new Error(detail)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
