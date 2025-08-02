import { describe, test, expect } from 'vitest'

describe('Simple Math', () => {
  test('adds two numbers', () => {
    expect(2 + 2).toBe(4)
  })

  test('multiplies two numbers', () => {
    expect(3 * 4).toBe(12)
  })
})
