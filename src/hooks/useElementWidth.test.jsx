import { act, render, screen } from '@testing-library/react'
import { useElementWidth } from './useElementWidth'

const originalResizeObserver = globalThis.ResizeObserver

function installResizeObserverMock() {
  const observers = []

  class ResizeObserverMock {
    constructor(callback) {
      this.callback = callback
      this.observe = vi.fn()
      this.disconnect = vi.fn()
      observers.push(this)
    }
  }

  globalThis.ResizeObserver = ResizeObserverMock
  return observers
}

function measureWidth(observer, width) {
  const element = observer.observe.mock.calls[0][0]
  element.getBoundingClientRect = () => ({ width })
  act(() => observer.callback())
}

function WidthProbe() {
  const [ref, width] = useElementWidth()

  return (
    <div ref={ref} data-testid="probe">
      {width}
    </div>
  )
}

function DetachedProbe() {
  useElementWidth()
  return null
}

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver
})

describe('useElementWidth en las gráficas del Dashboard', () => {
  it('inicia en ancho 0 antes de la primera medición', () => {
    installResizeObserverMock()

    render(<WidthProbe />)

    expect(screen.getByTestId('probe')).toHaveTextContent('0')
  })

  it('refleja el ancho del elemento tras la primera medición del observer', () => {
    const observers = installResizeObserverMock()
    render(<WidthProbe />)

    measureWidth(observers[0], 640)

    expect(screen.getByTestId('probe')).toHaveTextContent('640')
  })

  it('se actualiza cuando el elemento cambia de tamaño', () => {
    const observers = installResizeObserverMock()
    render(<WidthProbe />)

    measureWidth(observers[0], 640)
    measureWidth(observers[0], 320)

    expect(screen.getByTestId('probe')).toHaveTextContent('320')
  })

  it('desconecta el observer al desmontar', () => {
    const observers = installResizeObserverMock()
    const { unmount } = render(<WidthProbe />)

    unmount()

    expect(observers[0].disconnect).toHaveBeenCalledTimes(1)
  })

  it('no crea un observer si la referencia no está adjunta al DOM', () => {
    const observers = installResizeObserverMock()

    render(<DetachedProbe />)

    expect(observers).toHaveLength(0)
  })
})
