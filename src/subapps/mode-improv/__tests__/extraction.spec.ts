import { describe, expect, it } from 'vitest'
import { drawExtraction } from '../extraction'

/** Feeds a fixed list of values to drawExtraction, in order. */
function sequenceRng(values: number[]) {
  let i = 0
  return () => values[i++ % values.length]
}

describe('drawExtraction', () => {
  it('always draws two different degrees between 1 and 7 and a key between 0 and 11', () => {
    for (let i = 0; i < 500; i++) {
      const { key, degrees } = drawExtraction(null)
      expect(key).toBeGreaterThanOrEqual(0)
      expect(key).toBeLessThanOrEqual(11)
      expect(degrees[0]).not.toBe(degrees[1])
      for (const d of degrees) {
        expect(d).toBeGreaterThanOrEqual(1)
        expect(d).toBeLessThanOrEqual(7)
      }
    }
  })

  it('can draw every degree in both positions', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 2000; i++) seen.add(drawExtraction(null).degrees.join('-'))
    expect(seen.size).toBe(42) // 7 × 6 ordered pairs
  })

  it('never repeats the previous key with the same two degrees, even swapped', () => {
    // First draw: key 0, degrees 1 and 2; the rng then offers the same pair swapped, then something new
    const rng = sequenceRng([0, 1 / 7 + 0.01, 0, 0, 0, 0, 0.5, 0.5, 0.5])
    const previous = { key: 0 as const, degrees: [1, 2] as [number, number] }
    const next = drawExtraction(previous, rng)
    expect(next.key === 0 && new Set([...next.degrees, 1, 2]).size === 2).toBe(false)
  })
})
