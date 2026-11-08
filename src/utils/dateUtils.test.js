import { normalizeDateValue } from './dateUtils'

describe('normalizeDateValue', () => {
  it('normaliza una fecha ISO YYYY-MM-DD', () => {
    expect(normalizeDateValue('2026-11-07')).toBe('2026-11-07')
  })

  it('normaliza una fecha YYYY/MM/DD', () => {
    expect(normalizeDateValue('2026/01/05')).toBe('2026-01-05')
  })

  it('normaliza una fecha DD/MM/YYYY a ISO', () => {
    expect(normalizeDateValue('07/11/2026')).toBe('2026-11-07')
  })

  it('normaliza una fecha DD-MM-YYYY a ISO', () => {
    expect(normalizeDateValue('05-01-2026')).toBe('2026-01-05')
  })

  it('normaliza una fecha ISO con hora usando solo la fecha', () => {
    expect(normalizeDateValue('2026-11-07T00:00:00Z')).toBe('2026-11-07')
  })

  it('recorta los espacios alrededor de una fecha válida', () => {
    expect(normalizeDateValue('  2026-11-07  ')).toBe('2026-11-07')
  })

  it('acepta el 29 de febrero de un año bisiesto', () => {
    expect(normalizeDateValue('2024-02-29')).toBe('2024-02-29')
  })

  it.each(['2026-02-30', '30/02/2026', '2026-13-01', '2025-02-29'])(
    'devuelve null para una fecha de calendario inválida: %s',
    (value) => {
      expect(normalizeDateValue(value)).toBeNull()
    },
  )

  it.each(['', '   ', null, undefined])('devuelve null para un valor vacío: %j', (value) => {
    expect(normalizeDateValue(value)).toBeNull()
  })

  it('conserva el relleno a dos dígitos en la fecha normalizada', () => {
    expect(normalizeDateValue('01/02/2026')).toBe('2026-02-01')
  })
})
