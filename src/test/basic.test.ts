import { describe, it, expect } from 'vitest'

describe('Basic Tests', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    expect('hello' + ' world').toBe('hello world')
  })

  it('should handle array operations', () => {
    const arr = [1, 2, 3]
    expect(arr.length).toBe(3)
    expect(arr[0]).toBe(1)
  })
}) 