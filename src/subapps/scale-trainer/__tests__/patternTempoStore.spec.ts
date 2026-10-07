import { beforeEach, describe, expect, it } from 'vitest'
import { getPatternTempo, setPatternTempo } from '../patternTempoStore'

beforeEach(() => {
  localStorage.clear()
})

describe('patternTempoStore', () => {
  it('returns undefined for a pattern that has never been recorded', () => {
    expect(getPatternTempo('major-e-shape')).toBeUndefined()
  })

  it('stores and retrieves the absolute bpm for a pattern', () => {
    setPatternTempo('major-e-shape', 65)
    expect(getPatternTempo('major-e-shape')).toBe(65)
  })

  it('overwrites the stored bpm on a later call (immediate persistence, no "only if higher" rule)', () => {
    setPatternTempo('major-e-shape', 65)
    setPatternTempo('major-e-shape', 40)
    expect(getPatternTempo('major-e-shape')).toBe(40)
  })

  it('keeps different patterns independent', () => {
    setPatternTempo('major-e-shape', 65)
    setPatternTempo('major-a-shape', 90)
    expect(getPatternTempo('major-e-shape')).toBe(65)
    expect(getPatternTempo('major-a-shape')).toBe(90)
  })

  it('does not throw on malformed JSON in localStorage', () => {
    localStorage.setItem('guitar-exercises.scale-trainer.pattern-tempos', '{not valid json')
    expect(getPatternTempo('major-e-shape')).toBeUndefined()
    expect(() => setPatternTempo('major-e-shape', 70)).not.toThrow()
    expect(getPatternTempo('major-e-shape')).toBe(70)
  })
})
