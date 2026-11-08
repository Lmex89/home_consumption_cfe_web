import { getSeriesColor, getTierColorByLevel } from './tierColors'

// Colores públicos que consumen el Desglose y las gráficas.
const BASICO = '#52c41a'
const INTERMEDIO = '#1890ff'
const INTERMEDIO2 = '#fa8c16'
const EXCEDENTE = '#f5222d'
const IVA = '#722ed1'
const DAP = '#eb2f96'
const NEUTRAL = '#8c8c8c'

describe('getTierColorByLevel — colores de los Rangos', () => {
  it('colorea el nivel 1 como Básico', () => {
    expect(getTierColorByLevel(1, 3)).toBe(BASICO)
  })

  it('colorea el nivel máximo como Excedente', () => {
    expect(getTierColorByLevel(3, 3)).toBe(EXCEDENTE)
    expect(getTierColorByLevel(4, 4)).toBe(EXCEDENTE)
  })

  it('da colores distintos a los Rangos intermedios de una tarifa de 4 niveles', () => {
    const intermedios = [getTierColorByLevel(2, 4), getTierColorByLevel(3, 4)]

    expect(intermedios[0]).toBe(INTERMEDIO)
    expect(intermedios[1]).toBe(INTERMEDIO2)
    expect(new Set(intermedios).size).toBe(2)
  })

  it.each([
    [1, BASICO],
    [2, INTERMEDIO],
    [3, EXCEDENTE],
  ])('asigna al nivel %i de una tarifa de 3 Rangos su color', (level, color) => {
    expect(getTierColorByLevel(level, 3)).toBe(color)
  })

  it.each([
    [1, BASICO],
    [2, INTERMEDIO],
    [3, INTERMEDIO2],
    [4, EXCEDENTE],
  ])('asigna al nivel %i de una tarifa de 4 Rangos su color', (level, color) => {
    expect(getTierColorByLevel(level, 4)).toBe(color)
  })

  it('usa el color de Básico cuando la tarifa tiene un solo Rango', () => {
    expect(getTierColorByLevel(1, 1)).toBe(BASICO)
  })

  it('reutiliza el último color intermedio cuando hay más Rangos que colores', () => {
    const maxLevel = 6

    expect(getTierColorByLevel(4, maxLevel)).toBe(INTERMEDIO2)
    expect(getTierColorByLevel(5, maxLevel)).toBe(INTERMEDIO2)
    expect(getTierColorByLevel(maxLevel, maxLevel)).toBe(EXCEDENTE)
  })
})

describe('getSeriesColor — colores del Desglose', () => {
  it('prioriza el nivel sobre el nombre cuando recibe tierLevel y maxLevel', () => {
    expect(getSeriesColor('Básico', 3, 4)).toBe(INTERMEDIO2)
    expect(getSeriesColor('Excedente', 2, 4)).toBe(INTERMEDIO)
  })

  it('usa el nombre cuando falta maxLevel', () => {
    expect(getSeriesColor('Básico', 3)).toBe(BASICO)
  })

  it.each([
    ['Básico', BASICO],
    ['Intermedio', INTERMEDIO],
    ['Intermedio2', INTERMEDIO2],
    ['Intermedio3', INTERMEDIO2],
    ['Excedente', EXCEDENTE],
    ['IVA', IVA],
    ['DAP', DAP],
  ])('colorea la serie %s por su nombre', (name, color) => {
    expect(getSeriesColor(name)).toBe(color)
  })

  it('devuelve el color neutro para un nombre de serie desconocido', () => {
    expect(getSeriesColor('Otro')).toBe(NEUTRAL)
  })

  it('devuelve el color neutro cuando no hay nombre de serie', () => {
    expect(getSeriesColor(undefined)).toBe(NEUTRAL)
    expect(getSeriesColor(null)).toBe(NEUTRAL)
  })

  it.fails('trata el nivel 0 del respaldo Subtotal como una serie sin Rango', () => {
    // Las gráficas llaman getSeriesColor('Subtotal', 0, 0) cuando la API no
    // trae Desglose por Rango; el respaldo no debe pintarse como Excedente.
    // Bug reportado en #31; si se corrige, este test.fails fallará y deberá volverse it.
    expect(getSeriesColor('Subtotal', 0, 0)).toBe(NEUTRAL)
  })
})
