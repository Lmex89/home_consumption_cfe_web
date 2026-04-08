import { buildApiUrl } from '../config/apiConfig'
import { getAccessToken } from './authStorage'

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
 * Throws an Error with the backend detail message on non-OK responses.
 * Returns null for 204 No Content.
 */
export async function requestApi(endpoint, options = {}) {
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
