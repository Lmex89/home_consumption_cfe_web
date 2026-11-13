import { installFetchMock } from '../test/fetchMock'
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from './authStorage'
import { requestApi } from './apiClient'

describe('requestApi', () => {
  let fetchMock
  let originalLocation

  beforeEach(() => {
    localStorage.clear()
    fetchMock = installFetchMock()
    originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' },
    })
  })

  afterEach(() => {
    fetchMock.restore()
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    })
  })

  describe('autorización', () => {
    it('envía la cabecera Bearer cuando hay token de acceso', async () => {
      setAccessToken('token-abc')
      fetchMock.on('GET', '/households', { json: [] })

      await requestApi('/households')

      expect(fetchMock.lastCall().headers.Authorization).toBe('Bearer token-abc')
    })

    it('omite la cabecera de autorización cuando no hay token', async () => {
      fetchMock.on('GET', '/households', { json: [] })

      await requestApi('/households')

      expect(fetchMock.lastCall().headers).not.toHaveProperty('Authorization')
    })

    it('omite la cabecera con requiresAuth: false aunque haya token', async () => {
      setAccessToken('token-abc')
      fetchMock.on('GET', '/public', { json: {} })

      await requestApi('/public', { requiresAuth: false })

      expect(fetchMock.lastCall().headers).not.toHaveProperty('Authorization')
    })
  })

  describe('serialización de la petición', () => {
    it('agrega los parámetros de consulta y omite undefined, null y cadena vacía', async () => {
      fetchMock.on('GET', '/meter-readings', { json: [] })

      await requestApi('/meter-readings', {
        query: {
          household_id: 7,
          page: 0,
          active: true,
          vacio: '',
          nulo: null,
          indefinido: undefined,
        },
      })

      const url = new URL(fetchMock.lastCall().url)
      expect(url.searchParams.get('household_id')).toBe('7')
      expect(url.searchParams.get('page')).toBe('0')
      expect(url.searchParams.get('active')).toBe('true')
      expect(url.searchParams.has('vacio')).toBe(false)
      expect(url.searchParams.has('nulo')).toBe(false)
      expect(url.searchParams.has('indefinido')).toBe(false)
    })

    it('envía un cuerpo JSON con su Content-Type', async () => {
      fetchMock.on('POST', '/households', { status: 201, json: { id: 1 } })

      await requestApi('/households', {
        method: 'POST',
        body: { name: 'Casa', postal_code: '01000' },
      })

      const call = fetchMock.lastCall()
      expect(call.headers['Content-Type']).toBe('application/json')
      expect(fetchMock.lastJsonBody()).toEqual({ name: 'Casa', postal_code: '01000' })
    })

    it('envía un cuerpo de formulario codificado con su Content-Type', async () => {
      fetchMock.on('POST', '/auth/login', { json: { access_token: 'abc' } })

      await requestApi('/auth/login', {
        method: 'POST',
        requiresAuth: false,
        bodyType: 'form',
        body: { username: 'ana', password: 'secreta', omitido: undefined },
      })

      const call = fetchMock.lastCall()
      const form = new URLSearchParams(call.body)
      expect(call.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
      expect(form.get('username')).toBe('ana')
      expect(form.get('password')).toBe('secreta')
      expect(form.has('omitido')).toBe(false)
    })
  })

  describe('respuestas', () => {
    it('devuelve null para una respuesta 204 sin contenido', async () => {
      fetchMock.on('DELETE', '/meter-readings/1', { status: 204 })

      await expect(requestApi('/meter-readings/1', { method: 'DELETE' })).resolves.toBeNull()
    })

    it('usa el detalle del backend como mensaje de error', async () => {
      fetchMock.on('GET', '/households', {
        status: 400,
        json: { detail: 'Hogar no encontrado' },
      })

      await expect(requestApi('/households')).rejects.toThrow('Hogar no encontrado')
    })

    it('usa "Error <status>" cuando el error no es JSON', async () => {
      fetchMock.on('GET', '/households', {
        status: 500,
        body: '<html>fallo del servidor</html>',
        headers: { 'Content-Type': 'text/html' },
      })

      await expect(requestApi('/households')).rejects.toThrow('Error 500')
    })
  })

  describe('renovación de token', () => {
    it.each([401, 403])(
      'ante un %s renueva el token una vez y reintenta la petición original',
      async (status) => {
        setAccessToken('viejo')
        setRefreshToken('refresh-1')
        fetchMock.on('POST', '/auth/refresh', {
          json: { access_token: 'nuevo', refresh_token: 'refresh-2' },
        })
        fetchMock.on(
          'GET',
          '/households',
          { status, json: { detail: 'Token expirado' } },
          { json: [{ id: 1 }] },
        )

        const result = await requestApi('/households')

        expect(result).toEqual([{ id: 1 }])
        expect(fetchMock.calls).toHaveLength(3)
        const [original, refresh, retry] = fetchMock.calls
        expect(original.url).toContain('/households')
        expect(original.headers.Authorization).toBe('Bearer viejo')
        expect(refresh.url).toContain('/auth/refresh')
        expect(JSON.parse(refresh.body)).toEqual({ refresh_token: 'refresh-1' })
        expect(retry.url).toContain('/households')
        expect(retry.headers.Authorization).toBe('Bearer nuevo')
        expect(getAccessToken()).toBe('nuevo')
        expect(getRefreshToken()).toBe('refresh-2')
      },
    )

    it.each([401, 403])(
      'si el refresco falla ante un %s limpia la sesión y redirige a /login',
      async (status) => {
        setAccessToken('viejo')
        setRefreshToken('refresh-1')
        fetchMock.on('POST', '/auth/refresh', {
          status: 401,
          json: { detail: 'Refresh vencido' },
        })
        fetchMock.on('GET', '/households', { status, json: { detail: 'Token expirado' } })

        await expect(requestApi('/households')).resolves.toBeUndefined()

        expect(fetchMock.calls).toHaveLength(2)
        expect(getAccessToken()).toBe('')
        expect(getRefreshToken()).toBe('')
        expect(window.location.href).toBe('/login')
      },
    )

    it('no renueva el token en peticiones con requiresAuth: false', async () => {
      setAccessToken('viejo')
      setRefreshToken('refresh-1')
      fetchMock.on('GET', '/public', { status: 401, json: { detail: 'No autorizado' } })

      await expect(requestApi('/public', { requiresAuth: false })).rejects.toThrow(
        'No autorizado',
      )

      expect(fetchMock.calls).toHaveLength(1)
      expect(getAccessToken()).toBe('viejo')
    })
  })
})
