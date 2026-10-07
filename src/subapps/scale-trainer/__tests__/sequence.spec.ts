import { describe, expect, it } from 'vitest'
import { buildUpDownSequence } from '../sequence'

describe('buildUpDownSequence', () => {
  it('returns an empty sequence for 0 notes', () => {
    expect(buildUpDownSequence(0)).toEqual([])
  })

  it('returns a single-index loop for 1 note', () => {
    expect(buildUpDownSequence(1)).toEqual([0])
  })

  it('bounces back and forth for 2 notes', () => {
    expect(buildUpDownSequence(2)).toEqual([0, 1])
  })

  it('goes up then down, excluding both endpoints on the way down, for N notes', () => {
    expect(buildUpDownSequence(4)).toEqual([0, 1, 2, 3, 2, 1])
    expect(buildUpDownSequence(5)).toEqual([0, 1, 2, 3, 4, 3, 2, 1])
  })

  it('never repeats the same index twice in a row, including across the loop seam', () => {
    for (const n of [1, 2, 3, 4, 5, 8]) {
      const seq = buildUpDownSequence(n)
      for (let i = 0; i < seq.length; i++) {
        const next = seq[(i + 1) % seq.length]
        if (seq.length > 1) expect(next).not.toBe(seq[i])
      }
    }
  })

  it('every index from 0..N-1 appears at least once', () => {
    const n = 6
    const seq = buildUpDownSequence(n)
    const seen = new Set(seq)
    for (let i = 0; i < n; i++) expect(seen).toContain(i)
  })
})
