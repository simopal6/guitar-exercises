import { beforeEach, describe, expect, it } from 'vitest'
import {
  COMPLETE_SEMITONES,
  STANDARD_DEFAULT_SEMITONES,
  getActiveSemitones,
  getIntervalPreset,
  getStandardSemitones,
  resetStandardSemitones,
  setIntervalPreset,
  setStandardSemitones,
} from '../selectedIntervalsStore'

beforeEach(() => {
  localStorage.clear()
})

describe('selectedIntervalsStore', () => {
  it('defaults to the standard preset with the standard default semitones', () => {
    expect(getIntervalPreset()).toBe('standard')
    expect(getStandardSemitones()).toEqual(STANDARD_DEFAULT_SEMITONES)
    expect(getActiveSemitones()).toEqual(STANDARD_DEFAULT_SEMITONES)
  })

  it('persists a preset change', () => {
    setIntervalPreset('completa')
    expect(getIntervalPreset()).toBe('completa')
    expect(getActiveSemitones()).toEqual(COMPLETE_SEMITONES)
  })

  it('persists a customized standard set, independent of the preset choice', () => {
    setStandardSemitones([3, 4, 5, 7])
    expect(getStandardSemitones()).toEqual([3, 4, 5, 7])
    expect(getActiveSemitones()).toEqual([3, 4, 5, 7])
  })

  it('resetStandardSemitones restores the original default', () => {
    setStandardSemitones([3, 4])
    resetStandardSemitones()
    expect(getStandardSemitones()).toEqual(STANDARD_DEFAULT_SEMITONES)
  })

  it('completa is always the fixed full set, unaffected by standard customization', () => {
    setStandardSemitones([3, 4])
    setIntervalPreset('completa')
    expect(getActiveSemitones()).toEqual(COMPLETE_SEMITONES)
  })

  it('falls back to the default on malformed JSON', () => {
    localStorage.setItem('guitar-exercises.interval-trainer.standard-semitones', '{not json')
    expect(getStandardSemitones()).toEqual(STANDARD_DEFAULT_SEMITONES)
  })

  it('falls back to the default when the stored value is not a valid semitone list', () => {
    localStorage.setItem('guitar-exercises.interval-trainer.standard-semitones', JSON.stringify(['x', 99, -1]))
    expect(getStandardSemitones()).toEqual(STANDARD_DEFAULT_SEMITONES)
  })

  it('falls back to standard for an unrecognized preset value', () => {
    localStorage.setItem('guitar-exercises.interval-trainer.selected-preset', 'nonsense')
    expect(getIntervalPreset()).toBe('standard')
  })
})
