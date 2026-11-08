import { installFetchMock } from '../test/fetchMock'
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '../lib/authStorage'

describe('authService', () => {
  let fetchMock
  let authService

  beforeEach(async () => {
    localStorage.clear()
    fetchMock = installFetchMock()

    // apiConfig lee import.meta.env al cargar el módulo: se aísla el registro de
    // módulos para que cada prueba vea el valor de VITE_REGISTER_API_KEY que fija.
    vi.stubEnv('VITE_REGISTER_API_KEY', 'clave-registro')
    vi.resetModules()
    authService = await import('./authService')
  })

  afterEach(() => {
    fetchMock.restore()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  describe('login', () => {
    it('envía las credenciales como formulario y guarda ambos tokens', async () => {
      fetchMock.on('POST', '/auth/login', {
        json: { access_token: 'access-1', refresh_token: 'refresh-1', token_type: 'bearer' },
      })

      const result = await authService.login('ana', 'secreta')

      expect(result.access_token).toBe('access-1')
      const call = fetchMock.lastCall()
      expect(call.method).toBe('POST')
      expect(call.url).toContain('/auth/login')
      expect(call.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
      const form = new URLSearchParams(call.body)
      expect(form.get('username')).toBe('ana')
      expect(form.get('password')).toBe('secreta')
      expect(getAccessToken()).toBe('access-1')
      expect(getRefreshToken()).toBe('refresh-1')
    })

    it('borra el token de refresco anterior cuando la respuesta no trae uno', async () => {
      setRefreshToken('refresh-viejo')
      fetchMock.on('POST', '/auth/login', { json: { access_token: 'access-1' } })

      await authService.login('ana', 'secreta')

      expect(getAccessToken()).toBe('access-1')
      expect(getRefreshToken()).toBe('')
    })
  })

  describe('register', () => {
    it('envía x-api-key y el payload mapeado a snake_case', async () => {
      fetchMock.on('POST', '/auth/register', { status: 201, json: { id: 1 } })

      await authService.register({
        username: 'ana',
        password: 'secreta',
        email: 'ana@example.com',
        fullName: 'Ana Pérez',
        role: 'admin',
      })

      const call = fetchMock.lastCall()
      expect(call.method).toBe('POST')
      expect(call.url).toContain('/auth/register')
      expect(call.headers['x-api-key']).toBe('clave-registro')
      expect(call.headers['Content-Type']).toBe('application/json')
      expect(fetchMock.lastJsonBody()).toEqual({
        username: 'ana',
        password: 'secreta',
        email: 'ana@example.com',
        full_name: 'Ana Pérez',
        role: 'admin',
      })
    })

    it('usa null y "user" como valores por defecto', async () => {
      fetchMock.on('POST', '/auth/register', { status: 201, json: { id: 1 } })

      await authService.register({ username: 'ana', password: 'secreta' })

      expect(fetchMock.lastJsonBody()).toEqual({
        username: 'ana',
        password: 'secreta',
        email: null,
        full_name: null,
        role: 'user',
      })
    })

    it('lanza un error y no llama a fetch cuando falta VITE_REGISTER_API_KEY', async () => {
      vi.stubEnv('VITE_REGISTER_API_KEY', '')
      vi.resetModules()
      const sinApiKey = await import('./authService')

      await expect(
        sinApiKey.register({ username: 'ana', password: 'secreta' }),
      ).rejects.toThrow('Missing VITE_REGISTER_API_KEY configuration.')
      expect(fetchMock.calls).toHaveLength(0)
    })
  })

  describe('getCurrentUser', () => {
    it('consulta /auth/me con el token de acceso', async () => {
      setAccessToken('access-1')
      fetchMock.on('GET', '/auth/me', { json: { username: 'ana' } })

      const user = await authService.getCurrentUser()

      expect(user).toEqual({ username: 'ana' })
      expect(fetchMock.lastCall().url).toContain('/auth/me')
      expect(fetchMock.lastCall().headers.Authorization).toBe('Bearer access-1')
    })
  })

  describe('logout', () => {
    it('elimina ambos tokens', () => {
      setAccessToken('access-1')
      setRefreshToken('refresh-1')

      authService.logout()

      expect(getAccessToken()).toBe('')
      expect(getRefreshToken()).toBe('')
      expect(localStorage.length).toBe(0)
    })
  })

  describe('hasToken', () => {
    it('refleja la presencia del token de acceso', () => {
      expect(authService.hasToken()).toBe(false)

      setAccessToken('access-1')

      expect(authService.hasToken()).toBe(true)
    })
  })
})
