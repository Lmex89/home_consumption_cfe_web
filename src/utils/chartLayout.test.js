import { hasRoomForBarLabels } from './chartLayout'

// Ancho mínimo documentado para que quepa la etiqueta de una Lectura.
const SLOT = 72

describe('hasRoomForBarLabels — etiquetas de las Lecturas', () => {
  it.each([
    ['sin medir el contenedor', undefined],
    ['con ancho cero', 0],
    ['con ancho nulo', null],
  ])('no muestra etiquetas %s', (_label, containerWidth) => {
    expect(hasRoomForBarLabels({ containerWidth, readingCount: 4, yAxisReserve: 100 })).toBe(false)
  })

  it.each([0, 1])('no muestra etiquetas con %i Lecturas aunque sobre espacio', (readingCount) => {
    expect(
      hasRoomForBarLabels({ containerWidth: 1200, readingCount, yAxisReserve: 100 }),
    ).toBe(false)
  })

  it('muestra etiquetas justo en el límite de 72px por Lectura', () => {
    expect(
      hasRoomForBarLabels({
        containerWidth: 100 + 4 * SLOT,
        readingCount: 4,
        yAxisReserve: 100,
      }),
    ).toBe(true)
  })

  it('no muestra etiquetas justo por debajo del límite', () => {
    expect(
      hasRoomForBarLabels({
        containerWidth: 100 + 4 * SLOT - 1,
        readingCount: 4,
        yAxisReserve: 100,
      }),
    ).toBe(false)
  })

  it('muestra etiquetas justo por encima del límite', () => {
    expect(
      hasRoomForBarLabels({
        containerWidth: 100 + 4 * SLOT + 1,
        readingCount: 4,
        yAxisReserve: 100,
      }),
    ).toBe(true)
  })

  it('muestra etiquetas con un contenedor amplio y muchas Lecturas', () => {
    expect(
      hasRoomForBarLabels({ containerWidth: 1200, readingCount: 12, yAxisReserve: 100 }),
    ).toBe(true)
  })

  it('descuenta el espacio del eje Y antes de decidir', () => {
    const readingCount = 4
    const containerWidth = 500

    expect(hasRoomForBarLabels({ containerWidth, readingCount, yAxisReserve: 0 })).toBe(true)
    expect(hasRoomForBarLabels({ containerWidth, readingCount, yAxisReserve: 220 })).toBe(false)
  })
})
