import { describe, expect, it } from 'vitest'
import { generateNameDistractors, generateSemitoneDistractors, generateShapeDistractors } from '../distractors'
import { INTERVAL_NAME_GROUPS, STANDARD_TUNING } from '../../theory'

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

describe('distractors', () => {
  it('generates the requested number of unique semitone distractors, excluding the correct answer', () => {
    const rng = seededRng(1)
    for (let correct = 0; correct <= 12; correct++) {
      const distractors = generateSemitoneDistractors(correct, 3, rng)
      expect(distractors).toHaveLength(3)
      expect(new Set(distractors).size).toBe(3)
      expect(distractors).not.toContain(correct)
      for (const d of distractors) {
        expect(d).toBeGreaterThanOrEqual(0)
        expect(d).toBeLessThanOrEqual(12)
      }
    }
  })

  it('generates unique name distractors, allowing augmented/diminished variants', () => {
    const rng = seededRng(2)
    const distractors = generateNameDistractors('Major Third', 3, rng)
    expect(distractors).toHaveLength(3)
    expect(new Set(distractors).size).toBe(3)
    expect(distractors).not.toContain('Major Third')
    const allNames = new Set(INTERVAL_NAME_GROUPS.flat())
    for (const d of distractors) {
      expect(allNames).toContain(d)
    }
  })

  it('never picks a distractor name equivalent to the correct answer (e.g. Augmented Second for Minor Third)', () => {
    const rng = seededRng(5)
    for (let i = 0; i < 50; i++) {
      const distractors = generateNameDistractors('Minor Third', 3, rng)
      expect(distractors).not.toContain('Minor Third')
      expect(distractors).not.toContain('Augmented Second')
    }
  })

  describe('generateShapeDistractors', () => {
    const beginnerOptions = { tuning: STANDARD_TUNING, allowedRootStrings: [0, 1] }

    it('finds distinct playable shape distractors, none matching the correct semitone count', () => {
      const rng = seededRng(6)
      for (let i = 0; i < 30; i++) {
        const distractors = generateShapeDistractors(4, 3, beginnerOptions, [0, 12], rng)
        expect(distractors).toHaveLength(3)
        const semitonesUsed = distractors.map((d) => d.semitones)
        expect(new Set(semitonesUsed).size).toBe(3)
        expect(semitonesUsed).not.toContain(4)
        for (const shape of distractors) {
          expect([0, 1]).toContain(shape.rootPosition.stringIndex)
          expect(shape.rootPosition.fret).toBeGreaterThanOrEqual(0)
          expect(shape.targetPosition.fret).toBeGreaterThanOrEqual(0)
        }
      }
    })

    it('never returns the geometrically-unreachable Unison at beginner difficulty', () => {
      const rng = seededRng(7)
      for (let i = 0; i < 30; i++) {
        const distractors = generateShapeDistractors(4, 3, beginnerOptions, [0, 12], rng)
        expect(distractors.map((d) => d.semitones)).not.toContain(0)
      }
    })
  })
})
