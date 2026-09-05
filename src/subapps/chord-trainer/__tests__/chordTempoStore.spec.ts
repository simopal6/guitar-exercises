import { beforeEach, describe, expect, it } from 'vitest'
import { getChordTempo, purgeLegacyPairTempoFormat, setChordTempo } from '../chordTempoStore'

beforeEach(() => {
  localStorage.clear()
})

describe('chordTempoStore', () => {
  it('returns undefined for a chord that has never been recorded', () => {
    expect(getChordTempo('c-open')).toBeUndefined()
  })

  it('stores and retrieves the absolute bpm for a chord', () => {
    setChordTempo('c-open', 65)
    expect(getChordTempo('c-open')).toBe(65)
  })

  it('overwrites the stored bpm on a later call (immediate persistence, no "only if higher" rule)', () => {
    setChordTempo('c-open', 65)
    setChordTempo('c-open', 40) // a lower value must still overwrite — tempo is not a "best score"
    expect(getChordTempo('c-open')).toBe(40)
  })

  it('keeps different chords independent', () => {
    setChordTempo('c-open', 65)
    setChordTempo('g-open', 90)
    expect(getChordTempo('c-open')).toBe(65)
    expect(getChordTempo('g-open')).toBe(90)
  })
})

describe('purgeLegacyPairTempoFormat', () => {
  const LEGACY_KEY = 'guitar-exercises.chord-trainer.pair-tempos'

  it('removes the old per-pair storage key if present', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ 'c-open::g-open': 90 }))
    purgeLegacyPairTempoFormat()
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('is a no-op when there is nothing to purge', () => {
    expect(() => purgeLegacyPairTempoFormat()).not.toThrow()
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('does not touch the new per-chord storage', () => {
    setChordTempo('c-open', 65)
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ 'c-open::g-open': 90 }))
    purgeLegacyPairTempoFormat()
    expect(getChordTempo('c-open')).toBe(65)
  })
})
