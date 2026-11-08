import {
  clearAccessToken,
  clearAuthSession,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  isAuthenticated,
  setAccessToken,
  setRefreshToken,
} from './authStorage'

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('token de acceso', () => {
    it('guarda y lee el token de acceso', () => {
      setAccessToken('access-123')

      expect(getAccessToken()).toBe('access-123')
      expect(localStorage.getItem('cfe_access_token')).toBe('access-123')
    })

    it('elimina el token de acceso cuando se guarda un valor vacío', () => {
      setAccessToken('access-123')

      setAccessToken('')

      expect(getAccessToken()).toBe('')
      expect(localStorage.getItem('cfe_access_token')).toBeNull()
    })

    it('elimina el token de acceso explícitamente', () => {
      setAccessToken('access-123')

      clearAccessToken()

      expect(getAccessToken()).toBe('')
      expect(localStorage.getItem('cfe_access_token')).toBeNull()
    })

    it('devuelve una cadena vacía cuando no hay token guardado', () => {
      expect(getAccessToken()).toBe('')
    })

    it('devuelve el valor guardado tal cual aunque no tenga formato de JWT', () => {
      localStorage.setItem('cfe_access_token', 'dato-corrupto')

      expect(getAccessToken()).toBe('dato-corrupto')
      expect(isAuthenticated()).toBe(true)
    })
  })

  describe('token de refresco', () => {
    it('guarda y lee el token de refresco', () => {
      setRefreshToken('refresh-123')

      expect(getRefreshToken()).toBe('refresh-123')
      expect(localStorage.getItem('cfe_refresh_token')).toBe('refresh-123')
    })

    it('elimina el token de refresco cuando se guarda un valor vacío', () => {
      setRefreshToken('refresh-123')

      setRefreshToken('')

      expect(getRefreshToken()).toBe('')
      expect(localStorage.getItem('cfe_refresh_token')).toBeNull()
    })

    it('elimina el token de refresco explícitamente', () => {
      setRefreshToken('refresh-123')

      clearRefreshToken()

      expect(getRefreshToken()).toBe('')
      expect(localStorage.getItem('cfe_refresh_token')).toBeNull()
    })

    it('devuelve una cadena vacía cuando no hay token guardado', () => {
      expect(getRefreshToken()).toBe('')
    })
  })

  describe('sesión', () => {
    it('elimina ambos tokens al limpiar la sesión', () => {
      setAccessToken('access-123')
      setRefreshToken('refresh-123')

      clearAuthSession()

      expect(getAccessToken()).toBe('')
      expect(getRefreshToken()).toBe('')
      expect(localStorage.length).toBe(0)
    })

    it('tolera limpiar la sesión cuando no hay tokens', () => {
      clearAuthSession()

      expect(getAccessToken()).toBe('')
      expect(getRefreshToken()).toBe('')
    })
  })

  describe('isAuthenticated', () => {
    it('indica sesión activa cuando hay token de acceso', () => {
      setAccessToken('access-123')

      expect(isAuthenticated()).toBe(true)
    })

    it('indica sesión inactiva cuando no hay token de acceso', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('indica sesión inactiva después de limpiar la sesión', () => {
      setAccessToken('access-123')
      clearAuthSession()

      expect(isAuthenticated()).toBe(false)
    })
  })
})
