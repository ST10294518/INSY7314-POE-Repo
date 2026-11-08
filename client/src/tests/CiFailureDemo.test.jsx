import { expect, test } from 'vitest'

test('CI demonstration: a failed test blocks the build', () => {
  expect(1).toBe(2)
})
