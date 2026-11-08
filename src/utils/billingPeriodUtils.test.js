import {
  addDays,
  daysBetween,
  formatFullReadingDate,
  formatReadingDate,
  generateYearPeriods,
  getLatestPeriod,
  getPeriodDurationDays,
  getSuggestedNextPeriod,
  periodsOverlap,
} from './billingPeriodUtils'

describe('formatReadingDate', () => {
  it('formatea una fecha YYYY-MM-DD sin desplazar el día', () => {
    expect(formatReadingDate('2026-01-01')).toBe('01-ene')
  })

  it('formatea una fecha ISO con hora sin desplazar el día', () => {
    expect(formatReadingDate('2026-01-01T00:00:00Z')).toBe('01-ene')
  })

  it('devuelve una cadena vacía para un valor vacío', () => {
    expect(formatReadingDate('')).toBe('')
    expect(formatReadingDate(null)).toBe('')
  })
})

describe('formatFullReadingDate', () => {
  it('incluye día, mes y año sin desplazar el día', () => {
    expect(formatFullReadingDate('2026-11-07')).toBe('07 nov 2026')
    expect(formatFullReadingDate('2026-11-07T00:00:00Z')).toBe('07 nov 2026')
  })
})

describe('addDays', () => {
  it('cruza el fin de mes', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('cruza el fin de año', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('retrocede un día cruzando el inicio de mes', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('devuelve null para una fecha inválida', () => {
    expect(addDays('no-es-fecha', 1)).toBeNull()
    expect(addDays('', 1)).toBeNull()
  })
})

describe('daysBetween', () => {
  it('devuelve 0 para el mismo día', () => {
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0)
  })

  it('cuenta los días entre dos fechas del mismo periodo', () => {
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30)
  })

  it('cuenta los días entre fechas de meses distintos', () => {
    expect(daysBetween('2026-01-01', '2026-03-01')).toBe(59)
  })

  it('devuelve 0 cuando alguna fecha es inválida', () => {
    expect(daysBetween('', '2026-01-31')).toBe(0)
    expect(daysBetween('2026-01-01', '31/01/2026')).toBe(0)
  })
})

describe('periodsOverlap', () => {
  const existingPeriods = [
    { start_date: '2026-01-01', end_date: '2026-03-01' },
    { start_date: '2026-05-01', end_date: '2026-06-30' },
  ]

  it('detecta un traslape que empieza dentro de un periodo existente', () => {
    expect(periodsOverlap('2026-02-01', '2026-04-01', existingPeriods)).toBe(true)
  })

  it('detecta el traslape cuando las fechas solo se tocan en los bordes', () => {
    expect(periodsOverlap('2026-03-01', '2026-04-30', existingPeriods)).toBe(true)
    expect(periodsOverlap('2025-12-01', '2026-01-01', existingPeriods)).toBe(true)
  })

  it('no detecta traslape entre periodos separados', () => {
    expect(periodsOverlap('2026-03-02', '2026-04-30', existingPeriods)).toBe(false)
  })

  it('devuelve false con una lista vacía', () => {
    expect(periodsOverlap('2026-01-01', '2026-01-31', [])).toBe(false)
  })

  it('devuelve false cuando alguna fecha es inválida', () => {
    expect(periodsOverlap('', '2026-01-31', existingPeriods)).toBe(false)
    expect(periodsOverlap('2026-01-01', '2026-01-31', [{ start_date: '', end_date: '' }])).toBe(
      false,
    )
  })
})

describe('getLatestPeriod', () => {
  it('devuelve null con una lista vacía', () => {
    expect(getLatestPeriod([])).toBeNull()
  })

  it('devuelve el periodo con el fin más reciente sin importar el orden', () => {
    const periods = [
      { start_date: '2026-01-01', end_date: '2026-03-01' },
      { start_date: '2026-07-01', end_date: '2026-08-30' },
      { start_date: '2026-05-01', end_date: '2026-06-30' },
    ]

    expect(getLatestPeriod(periods)).toEqual(periods[1])
  })
})

describe('getPeriodDurationDays', () => {
  it('devuelve 0 cuando faltan fechas', () => {
    expect(getPeriodDurationDays()).toBe(0)
    expect(getPeriodDurationDays({})).toBe(0)
    expect(getPeriodDurationDays({ start_date: '2026-01-01' })).toBe(0)
  })

  it('devuelve la duración en días del periodo', () => {
    expect(getPeriodDurationDays({ start_date: '2026-01-01', end_date: '2026-03-01' })).toBe(59)
  })
})

describe('getSuggestedNextPeriod', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sugiere el periodo siguiente al último periodo existente', () => {
    const periods = [
      { start_date: '2026-09-01', end_date: '2026-10-30' },
      { start_date: '2026-10-31', end_date: '2026-11-30' },
    ]

    expect(getSuggestedNextPeriod(periods)).toEqual({
      startDate: '2026-12-01',
      endDate: '2027-01-30',
      basedOnExisting: true,
    })
  })

  it('sugiere un periodo desde hoy cuando no hay periodos', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 7))

    expect(getSuggestedNextPeriod([])).toEqual({
      startDate: '2026-11-07',
      endDate: '2027-01-06',
      basedOnExisting: false,
    })
  })
})

describe('generateYearPeriods', () => {
  it('genera periodos contiguos que cubren el año completo', () => {
    const periods = generateYearPeriods(2026, 59)

    expect(periods[0].start_date).toBe('2026-01-01')
    expect(periods.at(-1).end_date >= '2026-12-31').toBe(true)

    periods.slice(1).forEach((period, index) => {
      expect(period.start_date).toBe(addDays(periods[index].end_date, 1))
    })
  })

  it.each([
    ['sin año', null, 59],
    ['con año cero', 0, 59],
    ['con duración cero', 2026, 0],
    ['con duración no numérica', 2026, Number.NaN],
  ])('no genera periodos %s', (_label, year, durationDays) => {
    expect(generateYearPeriods(year, durationDays)).toEqual([])
  })
})
