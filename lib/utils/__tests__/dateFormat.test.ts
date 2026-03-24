import { describe, it, expect } from '@jest/globals'
import { formatDate } from '../dateFormat'

describe('formatDate', () => {
  it('formats a standard ISO date string', () => {
    // Use a fixed date to avoid locale variance
    const result = formatDate('2024-01-15T10:00:00Z')
    // Should contain the year, month name, and day
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/January/)
    expect(result).toMatch(/15/)
  })

  it('formats date at start of year', () => {
    const result = formatDate('2024-01-01T00:00:00Z')
    expect(result).toMatch(/2024/)
    expect(result).toMatch(/January/)
  })

  it('formats date at end of year', () => {
    const result = formatDate('2023-12-31T23:59:59Z')
    expect(result).toMatch(/2023/)
    expect(result).toMatch(/December/)
    expect(result).toMatch(/31/)
  })

  it('returns a non-empty string', () => {
    const result = formatDate('2024-06-15T00:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('formats dates across different months', () => {
    const months = [
      ['2024-02-14', 'February'],
      ['2024-03-20', 'March'],
      ['2024-07-04', 'July'],
      ['2024-11-11', 'November'],
    ]
    months.forEach(([input, expectedMonth]) => {
      const result = formatDate(`${input}T00:00:00Z`)
      expect(result).toContain(expectedMonth)
    })
  })
})
