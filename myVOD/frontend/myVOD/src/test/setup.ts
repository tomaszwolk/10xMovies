import '@testing-library/jest-dom'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock autoUpdate from @floating-ui/dom with proper implementation
vi.mock('@floating-ui/dom', () => ({
  autoUpdate: vi.fn().mockImplementation(() => {
    // Return a cleanup function
    return vi.fn();
  }),
}))

// Mock @floating-ui/react-dom
vi.mock('@floating-ui/react-dom', () => ({
  useFloating: vi.fn(() => ({
    x: 0,
    y: 0,
    strategy: 'absolute',
    refs: {
      setReference: vi.fn(),
      setFloating: vi.fn(),
      reference: null,
      floating: null,
    },
    update: vi.fn(),
  })),
  autoUpdate: vi.fn().mockImplementation(() => vi.fn()),
}))

// Mock @radix-ui/react-popper
vi.mock('@radix-ui/react-popper', () => ({
  Content: vi.fn(),
  Root: vi.fn(),
  whileElementsMounted: vi.fn(),
}))