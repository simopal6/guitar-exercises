import { describe, expect, it } from 'vitest'
import {
  INTERVAL_NAME_GROUPS,
  intervalName,
  intervalNameVariants,
  intervalSemitones,
  randomIntervalName,
} from '../intervals'

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

describe('intervals', () => {
  it('names the boundary intervals with their canonical name', () => {
    expect(intervalName(0)).toBe('Unison')
    expect(intervalName(6)).toBe('Tritone')
    expect(intervalName(12)).toBe('Octave')
  })

  it('round-trips canonical name <-> semitones for every simple interval', () => {
    for (let semitones = 0; semitones <= 12; semitones++) {
      expect(intervalSemitones(intervalName(semitones))).toBe(semitones)
    }
  })

  it('covers exactly 13 semitone counts (0-12), 27 names in total', () => {
    expect(INTERVAL_NAME_GROUPS).toHaveLength(13)
    expect(INTERVAL_NAME_GROUPS.flat()).toHaveLength(27)
  })

  it('rejects out-of-range semitone counts', () => {
    expect(() => intervalName(-1)).toThrow(RangeError)
    expect(() => intervalName(13)).toThrow(RangeError)
    expect(() => intervalName(1.5)).toThrow(RangeError)
  })

  it('treats minor third and augmented second as equivalent (3 semitones)', () => {
    expect(intervalNameVariants(3)).toEqual(['Minor Third', 'Augmented Second'])
    expect(intervalSemitones('Minor Third')).toBe(3)
    expect(intervalSemitones('Augmented Second')).toBe(3)
  })

  it('gives the tritone three equivalent names', () => {
    expect(intervalNameVariants(6)).toEqual(['Tritone', 'Augmented Fourth', 'Diminished Fifth'])
    for (const name of intervalNameVariants(6)) {
      expect(intervalSemitones(name)).toBe(6)
    }
  })

  it('round-trips every variant name <-> semitones, for every semitone count', () => {
    for (let semitones = 0; semitones <= 12; semitones++) {
      for (const name of intervalNameVariants(semitones)) {
        expect(intervalSemitones(name)).toBe(semitones)
      }
    }
  })

  it('rejects an unknown interval name', () => {
    expect(() => intervalSemitones('Not A Real Interval' as never)).toThrow(RangeError)
  })

  it('randomIntervalName only ever returns a valid variant for that semitone count', () => {
    const rng = seededRng(11)
    for (let semitones = 0; semitones <= 12; semitones++) {
      for (let i = 0; i < 30; i++) {
        expect(intervalNameVariants(semitones)).toContain(randomIntervalName(semitones, rng))
      }
    }
  })

  it('randomIntervalName eventually produces every variant, given enough draws', () => {
    const rng = seededRng(23)
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      seen.add(randomIntervalName(3, rng))
    }
    expect(seen).toEqual(new Set(['Minor Third', 'Augmented Second']))
  })
})
