import { beforeEach, describe, expect, it } from 'vitest'
import { getBestScore, recordScore } from '../bestScore'

const BASE = {
  durationSeconds: 60,
  modeId: 'name-semitones',
  intervalPreset: 'standard' as const,
}

beforeEach(() => {
  localStorage.clear()
})

describe('bestScore', () => {
  it('defaults to 0 when nothing is stored', () => {
    expect(getBestScore(BASE)).toBe(0)
  })

  it('records a score and reports it as a new best', () => {
    const result = recordScore(BASE, 5)
    expect(result).toEqual({ best: 5, isNewBest: true })
    expect(getBestScore(BASE)).toBe(5)
  })

  it('does not overwrite a higher existing best', () => {
    recordScore(BASE, 10)
    const result = recordScore(BASE, 7)
    expect(result).toEqual({ best: 10, isNewBest: false })
    expect(getBestScore(BASE)).toBe(10)
  })

  it('overwrites when the new score is strictly higher', () => {
    recordScore(BASE, 5)
    const result = recordScore(BASE, 6)
    expect(result).toEqual({ best: 6, isNewBest: true })
  })

  it('keeps separate records per duration/mode combination', () => {
    recordScore({ ...BASE, durationSeconds: 60 }, 5)
    recordScore({ ...BASE, durationSeconds: 180 }, 12)
    recordScore({ ...BASE, modeId: 'name-shape' }, 3)

    expect(getBestScore({ ...BASE, durationSeconds: 60 })).toBe(5)
    expect(getBestScore({ ...BASE, durationSeconds: 180 })).toBe(12)
    expect(getBestScore({ ...BASE, modeId: 'name-shape' })).toBe(3)
  })

  it('keeps standard and completa records separate for the same duration/mode', () => {
    recordScore({ ...BASE, intervalPreset: 'standard' }, 5)
    recordScore({ ...BASE, intervalPreset: 'completa' }, 9)

    expect(getBestScore({ ...BASE, intervalPreset: 'standard' })).toBe(5)
    expect(getBestScore({ ...BASE, intervalPreset: 'completa' })).toBe(9)
  })

  it('does not throw on malformed JSON in localStorage', () => {
    localStorage.setItem('guitar-exercises.interval-trainer.best-scores', '{not valid json')
    expect(getBestScore(BASE)).toBe(0)
    expect(() => recordScore(BASE, 4)).not.toThrow()
    expect(getBestScore(BASE)).toBe(4)
  })
})
