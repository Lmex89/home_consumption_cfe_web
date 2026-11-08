import { vi } from 'vitest'

/**
 * Mock reutilizable de `fetch` global para toda la suite.
 *
 * Patrón de uso en cualquier archivo de prueba:
 *
 *   import { installFetchMock } from '../test/fetchMock'
 *
 *   let fetchMock
 *   beforeEach(() => { localStorage.clear(); fetchMock = installFetchMock() })
 *   afterEach(() => { fetchMock.restore() })
 *
 *   // Ruta por método + URL (la URL se compara por subcadena, así sirve tanto
 *   // para el endpoint relativo como para la URL absoluta que arma apiConfig):
 *   fetchMock.on('POST', '/auth/login', { status: 200, json: { access_token: 'abc' } })
 *
 *   // Varias respuestas para la misma ruta se consumen en orden y la última se
 *   // repite; es lo que permite modelar "401 y luego 200 tras refrescar":
 *   fetchMock.on('GET', '/households',
 *     { status: 401, json: { detail: 'Token expirado' } },
 *     { status: 200, json: [{ id: 1 }] })
 *
 *   // Inspección de llamadas:
 *   fetchMock.lastCall()     // { url, method, headers, body }
 *   fetchMock.lastJsonBody() // cuerpo JSON de la última llamada, ya parseado
 *   fetchMock.calls          // [{ url, method, headers, body }, ...]
 *
 * Cada respuesta acepta `status` (default 200), `json` (se serializa con
 * `Content-Type: application/json`), `body` (texto/FormData crudo) y `headers`.
 * Sin cuerpo: `{ status: 204 }`. Las respuestas son objetos `Response` reales,
 * así que `response.ok`, `response.status` y `response.json()` se comportan
 * igual que contra el backend.
 *
 * `restore()` devuelve el `fetch` original. Si una petición no tiene respuesta
 * configurada, el mock lanza un error que nombra método y URL para ubicar la
 * prueba que olvidó mockearla.
 */
export function installFetchMock() {
  const routes = []
  const originalFetch = globalThis.fetch

  const fetchMock = vi.fn(async (input, init = {}) => {
    const url = String(input)
    const method = (init.method || 'GET').toUpperCase()

    const route = routes.find(
      (candidate) =>
        (!candidate.method || candidate.method === method) && matchesUrl(candidate.url, url),
    )

    if (!route) {
      throw new Error(`fetch sin mock para ${method} ${url}`)
    }

    const response =
      route.responses.length > 1 ? route.responses.shift() : route.responses[0]

    return buildResponse(response)
  })

  globalThis.fetch = fetchMock

  const mock = {
    fetch: fetchMock,

    on(method, url, ...responses) {
      routes.push({ method: method?.toUpperCase(), url, responses })
      return mock
    },

    get calls() {
      return fetchMock.mock.calls.map(([input, init = {}]) => ({
        url: String(input),
        method: (init.method || 'GET').toUpperCase(),
        headers: init.headers || {},
        body: init.body,
      }))
    },

    lastCall() {
      return mock.calls.at(-1)
    },

    lastJsonBody() {
      return JSON.parse(mock.lastCall().body)
    },

    restore() {
      globalThis.fetch = originalFetch
    },
  }

  return mock
}

function buildResponse({ status = 200, json, body, headers = {} } = {}) {
  if (json !== undefined) {
    return new Response(JSON.stringify(json), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    })
  }

  return new Response(body ?? null, { status, headers })
}

function matchesUrl(expected, url) {
  return !expected || url.includes(expected)
}
