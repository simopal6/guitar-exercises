import { describe, expect, it } from 'vitest'
import { STANDARD_TUNING } from '../tuning'
import { computeInterval, computeTargetPosition, generateShape } from '../shapes'

// Deterministic PRNG (mulberry32) so generation tests are reproducible.
function seededRng(seed: number): () => number {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('shapes', () => {
  it('derives the G-B major-third offset purely from the tuning, with no hardcoded case', () => {
    // Same fret on G and B strings is a well-known exception: a major third, not a perfect fourth.
    const g = { stringIndex: 3, fret: 5 }
    const target = computeTargetPosition(STANDARD_TUNING, g, 4, 4)
    expect(target).toEqual({ stringIndex: 4, fret: 5 })
  })

  it('derives a normal adjacent-pair offset (D to G, perfect fourth) requiring +1 fret', () => {
    const d = { stringIndex: 2, fret: 5 }
    const target = computeTargetPosition(STANDARD_TUNING, d, 5, 3)
    expect(target).toEqual({ stringIndex: 3, fret: 5 })
  })

  it('handles a string-skipping pair (low E to D)', () => {
    const lowE = { stringIndex: 0, fret: 2 }
    const target = computeTargetPosition(STANDARD_TUNING, lowE, 10, 2)
    expect(target).toEqual({ stringIndex: 2, fret: 2 })
  })

  it('round-trips computeTargetPosition <-> computeInterval', () => {
    const rng = seededRng(1)
    for (let i = 0; i < 200; i++) {
      const rootString = Math.floor(rng() * 6)
      let targetString = Math.floor(rng() * 6)
      if (targetString === rootString) targetString = (targetString + 1) % 6
      const rootFret = Math.floor(rng() * 12)
      const semitones = Math.floor(rng() * 13)
      const root = { stringIndex: rootString, fret: rootFret }
      const target = computeTargetPosition(STANDARD_TUNING, root, semitones, targetString)
      expect(computeInterval(STANDARD_TUNING, root, target)).toBe(semitones)
    }
  })

  it('generateShape only produces playable shapes (non-negative frets, within span) across many draws', () => {
    const rng = seededRng(42)
    for (let i = 0; i < 500; i++) {
      const shape = generateShape({
        tuning: STANDARD_TUNING,
        allowedRootStrings: [0, 1],
        maxFretSpan: 4,
        rng,
      })
      expect(shape.rootPosition.fret).toBeGreaterThanOrEqual(0)
      expect(shape.targetPosition.fret).toBeGreaterThanOrEqual(0)
      expect(Math.abs(shape.targetPosition.fret - shape.rootPosition.fret)).toBeLessThanOrEqual(4)
      expect([0, 1]).toContain(shape.rootPosition.stringIndex)
      expect(shape.semitones).toBeGreaterThanOrEqual(0)
      expect(shape.semitones).toBeLessThanOrEqual(12)
    }
  })

  it('generateShape respects an explicit string-pair restriction', () => {
    const rng = seededRng(7)
    for (let i = 0; i < 50; i++) {
      const shape = generateShape({
        tuning: STANDARD_TUNING,
        allowedRootStrings: [0],
        allowedStringPairs: [[0, 1]],
        rng,
      })
      expect(shape.rootPosition.stringIndex).toBe(0)
      expect(shape.targetPosition.stringIndex).toBe(1)
    }
  })
})
