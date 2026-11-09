// Documentation references added during final review (9 November 2026).
// VITEST: https://vitest.dev/guide/
// RTL: https://testing-library.com/docs/react-testing-library/intro/
// REACT: https://react.dev/reference/react
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
