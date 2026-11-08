import { describe, expect, it } from 'vitest'
import { bassNote, drumHits, strumAt, STEPS_PER_BAR } from '../patterns'

const steps = Array.from({ length: STEPS_PER_BAR }, (_, i) => i)

describe('drumHits', () => {
  it('plays kick on 1 and 3 (plus a softer one on the "and" of 3), snare on 2 and 4, hi-hat on every eighth', () => {
    const kicks = steps.filter((s) => drumHits(s).some((h) => h.drum === 'kick'))
    const snares = steps.filter((s) => drumHits(s).some((h) => h.drum === 'snare'))
    expect(kicks).toEqual([0, 4, 5])
    expect(snares).toEqual([2, 6])
    expect(steps.every((s) => drumHits(s).some((h) => h.drum === 'hihat'))).toBe(true)
  })
})

describe('bassNote', () => {
  it('plays root ×4, fifth ×2, octave, root', () => {
    // A (pitch class 9) → A1 = 33
    expect(steps.map((s) => bassNote(s, 9, 'min').midi)).toEqual([33, 33, 33, 33, 40, 40, 45, 33])
  })

  it('uses a diminished fifth on a diminished chord', () => {
    // B (11) → B1 = 35; fifth F2 = 41, not F#2
    expect(bassNote(4, 11, 'dim').midi).toBe(41)
    expect(bassNote(4, 11, 'maj').midi).toBe(42)
  })

  it('keeps every root between E1 and D#2', () => {
    for (let root = 0; root < 12; root++) {
      const midi = bassNote(0, root as never, 'maj').midi
      expect(midi).toBeGreaterThanOrEqual(28)
      expect(midi).toBeLessThanOrEqual(39)
    }
  })
})

describe('strumAt', () => {
  it('strums down, –, down-up, –, up-down-up', () => {
    expect(steps.map(strumAt)).toEqual(['down', null, 'down', 'up', null, 'up', 'down', 'up'])
  })
})
