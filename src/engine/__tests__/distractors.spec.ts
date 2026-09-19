import { describe, expect, it } from 'vitest'
import { generateNameDistractors, generateSemitoneDistractors, generateShapeDistractors } from '../distractors'
import { INTERVAL_NAME_GROUPS, STANDARD_TUNING, intervalName, intervalSemitones, randomIntervalName } from '../../theory'

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

const ALL_SEMITONES = Array.from({ length: 12 }, (_, i) => i + 1) // 1-12, matching the app's default (no Unison)
const FULL_RANGE_WITH_UNISON = Array.from({ length: 13 }, (_, i) => i) // 0-12, the theory-layer default

describe('distractors', () => {
  it('generates the requested number of unique semitone distractors, excluding the correct answer', () => {
    const rng = seededRng(1)
    for (let correct = 1; correct <= 12; correct++) {
      const distractors = generateSemitoneDistractors(correct, 3, ALL_SEMITONES, rng)
      expect(distractors).toHaveLength(3)
      expect(new Set(distractors).size).toBe(3)
      expect(distractors).not.toContain(correct)
      for (const d of distractors) {
        expect(d).toBeGreaterThanOrEqual(1)
        expect(d).toBeLessThanOrEqual(12)
      }
    }
  })

  it('never includes Unison (0 semitones) as a distractor', () => {
    const rng = seededRng(9)
    for (let correct = 1; correct <= 12; correct++) {
      for (let i = 0; i < 20; i++) {
        const distractors = generateSemitoneDistractors(correct, 3, ALL_SEMITONES, rng)
        expect(distractors).not.toContain(0)
      }
    }
  })

  it('only draws distractors from a restricted allowedSemitones set', () => {
    const rng = seededRng(11)
    const restricted = [3, 4, 5, 7]
    for (let i = 0; i < 50; i++) {
      const distractors = generateSemitoneDistractors(3, 3, restricted, rng)
      expect(distractors).toHaveLength(3)
      for (const d of distractors) {
        expect(restricted).toContain(d)
      }
    }
  })

  it('generates unique name distractors, allowing augmented/diminished variants (Completa: randomIntervalName)', () => {
    const rng = seededRng(2)
    const distractors = generateNameDistractors('Major Third', 3, ALL_SEMITONES, randomIntervalName, rng)
    expect(distractors).toHaveLength(3)
    expect(new Set(distractors).size).toBe(3)
    expect(distractors).not.toContain('Major Third')
    const allNames = new Set(INTERVAL_NAME_GROUPS.flat())
    for (const d of distractors) {
      expect(allNames).toContain(d)
    }
  })

  it('never picks a distractor whose semitone count equals the correct answer', () => {
    const rng = seededRng(5)
    for (let i = 0; i < 50; i++) {
      const distractors = generateNameDistractors('Minor Third', 3, ALL_SEMITONES, randomIntervalName, rng)
      for (const d of distractors) {
        expect(intervalSemitones(d)).not.toBe(3)
      }
    }
  })

  it('with nameSelector: intervalName (Standard), every distractor is the exact canonical name — never a variant', () => {
    const rng = seededRng(17)
    for (let i = 0; i < 50; i++) {
      const distractors = generateNameDistractors('Minor Third', 3, ALL_SEMITONES, intervalName, rng)
      for (const d of distractors) {
        expect(d).toBe(intervalName(intervalSemitones(d)))
      }
    }
  })

  describe('generateShapeDistractors', () => {
    const beginnerOptions = { tuning: STANDARD_TUNING, allowedRootStrings: [0, 1] }

    it('finds distinct playable shape distractors, none matching the correct semitone count', () => {
      const rng = seededRng(6)
      for (let i = 0; i < 30; i++) {
        const distractors = generateShapeDistractors(4, 3, beginnerOptions, FULL_RANGE_WITH_UNISON, randomIntervalName, rng)
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
        const distractors = generateShapeDistractors(4, 3, beginnerOptions, FULL_RANGE_WITH_UNISON, randomIntervalName, rng)
        expect(distractors.map((d) => d.semitones)).not.toContain(0)
      }
    })

    it('only draws distractor shapes from a restricted allowedSemitones set', () => {
      const rng = seededRng(13)
      const restricted = [3, 4, 5, 7]
      for (let i = 0; i < 30; i++) {
        const distractors = generateShapeDistractors(3, 3, beginnerOptions, restricted, randomIntervalName, rng)
        expect(distractors).toHaveLength(3)
        for (const shape of distractors) {
          expect(restricted).toContain(shape.semitones)
        }
      }
    })

    it('with nameSelector: intervalName, every distractor shape carries the exact canonical name', () => {
      const rng = seededRng(19)
      for (let i = 0; i < 30; i++) {
        const distractors = generateShapeDistractors(4, 3, beginnerOptions, FULL_RANGE_WITH_UNISON, intervalName, rng)
        for (const shape of distractors) {
          expect(shape.intervalName).toBe(intervalName(shape.semitones))
        }
      }
    })
  })
})
