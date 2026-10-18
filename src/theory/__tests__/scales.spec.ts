import { describe, expect, it } from 'vitest'
import { DORIAN_SCALE, MAJOR_SCALE, scaleDegree, scaleDegreeIsFlat } from '../scales'

describe('scaleDegree', () => {
  it('maps every semitone of the major scale formula to its 1-based degree', () => {
    expect(scaleDegree(MAJOR_SCALE, 0)).toBe(1)
    expect(scaleDegree(MAJOR_SCALE, 2)).toBe(2)
    expect(scaleDegree(MAJOR_SCALE, 4)).toBe(3)
    expect(scaleDegree(MAJOR_SCALE, 5)).toBe(4)
    expect(scaleDegree(MAJOR_SCALE, 7)).toBe(5)
    expect(scaleDegree(MAJOR_SCALE, 9)).toBe(6)
    expect(scaleDegree(MAJOR_SCALE, 11)).toBe(7)
  })

  it('wraps a note an octave (or more) above the root onto the same degree', () => {
    expect(scaleDegree(MAJOR_SCALE, 12)).toBe(1) // octave
    expect(scaleDegree(MAJOR_SCALE, 14)).toBe(2) // 9th -> degree 2
    expect(scaleDegree(MAJOR_SCALE, 24)).toBe(1) // two octaves up
  })

  it('wraps a note below the root (negative distance) correctly too', () => {
    expect(scaleDegree(MAJOR_SCALE, -12)).toBe(1)
    expect(scaleDegree(MAJOR_SCALE, -5)).toBe(scaleDegree(MAJOR_SCALE, 7)) // -5 mod 12 == 7
  })

  it('throws for a note that does not belong to the scale', () => {
    expect(() => scaleDegree(MAJOR_SCALE, 1)).toThrow(RangeError) // minor second, not in major scale
    expect(() => scaleDegree(MAJOR_SCALE, 6)).toThrow(RangeError) // tritone, not in major scale
  })
})

describe('scaleDegreeIsFlat', () => {
  it('is false for every degree of the major scale, which has no flats', () => {
    for (const semitones of MAJOR_SCALE.formula) {
      expect(scaleDegreeIsFlat(MAJOR_SCALE, semitones)).toBe(false)
    }
  })

  it('marks the Dorian 3rd and 7th as flat, matching its b3/b7 relative to the major scale', () => {
    expect(scaleDegree(DORIAN_SCALE, 3)).toBe(3)
    expect(scaleDegreeIsFlat(DORIAN_SCALE, 3)).toBe(true) // b3: minor third (3 semitones) vs major's 4

    expect(scaleDegree(DORIAN_SCALE, 10)).toBe(7)
    expect(scaleDegreeIsFlat(DORIAN_SCALE, 10)).toBe(true) // b7: minor seventh (10 semitones) vs major's 11
  })

  it('leaves the other Dorian degrees (shared with the major scale) unflagged', () => {
    for (const semitones of [0, 2, 5, 7, 9]) {
      expect(scaleDegreeIsFlat(DORIAN_SCALE, semitones)).toBe(false)
    }
  })

  it('wraps octaves the same way scaleDegree does', () => {
    expect(scaleDegreeIsFlat(DORIAN_SCALE, 3 + 12)).toBe(true)
    expect(scaleDegreeIsFlat(DORIAN_SCALE, 0 - 12)).toBe(false)
  })
})
