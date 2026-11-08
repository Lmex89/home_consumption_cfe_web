import { useEffect, useRef, useState } from 'react'

/**
 * Tracks the rendered width of an element with a ResizeObserver.
 * Returns `[ref, width]`; width is 0 until the first measurement.
 *
 * Used by the dashboard charts to decide whether bar value labels fit
 * (canvas labels cannot be hidden with CSS media queries).
 */
export function useElementWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const observer = new ResizeObserver(() => {
      setWidth(element.getBoundingClientRect().width)
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
