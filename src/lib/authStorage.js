const ACCESS_TOKEN_KEY = 'cfe_access_token'
const REFRESH_TOKEN_KEY = 'cfe_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

export function setAccessToken(token) {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    return
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export function setRefreshToken(token) {
  if (!token) {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    return
  }

  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearAuthSession() {
  clearAccessToken()
  clearRefreshToken()
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}
