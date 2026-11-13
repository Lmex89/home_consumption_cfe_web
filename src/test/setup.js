// Shared test setup: jest-dom matchers plus the browser APIs Ant Design expects in jsdom.
import '@testing-library/jest-dom/vitest'

if (typeof window !== 'undefined') window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
