import { beforeEach, describe, expect, it } from 'vitest'
import { getBestScore, recordScore } from '../bestScore'

const BASE = { durationSeconds: 60, modeId: 'name-semitones', difficultyId: 1, usesShape: false }

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

  it('keeps separate records per duration/mode/difficulty combination', () => {
    recordScore({ ...BASE, durationSeconds: 60 }, 5)
    recordScore({ ...BASE, durationSeconds: 180 }, 12)
    recordScore({ ...BASE, modeId: 'name-shape', usesShape: true, difficultyId: 1 }, 3)
    recordScore({ ...BASE, modeId: 'name-shape', usesShape: true, difficultyId: 2 }, 8)

    expect(getBestScore({ ...BASE, durationSeconds: 60 })).toBe(5)
    expect(getBestScore({ ...BASE, durationSeconds: 180 })).toBe(12)
    expect(getBestScore({ ...BASE, modeId: 'name-shape', usesShape: true, difficultyId: 1 })).toBe(3)
    expect(getBestScore({ ...BASE, modeId: 'name-shape', usesShape: true, difficultyId: 2 })).toBe(8)
  })

  it('normalizes difficultyId out of the key for modes that do not use shape, avoiding lost scores', () => {
    // A "dirty" difficultyId left over from a previous shape-mode session
    // must not fragment the name-semitones record into a different slot.
    recordScore({ ...BASE, usesShape: false, difficultyId: 1 }, 9)
    expect(getBestScore({ ...BASE, usesShape: false, difficultyId: 2 })).toBe(9)
    expect(getBestScore({ ...BASE, usesShape: false, difficultyId: 3 })).toBe(9)
  })

  it('does not throw on malformed JSON in localStorage', () => {
    localStorage.setItem('guitar-exercises.interval-trainer.best-scores', '{not valid json')
    expect(getBestScore(BASE)).toBe(0)
    expect(() => recordScore(BASE, 4)).not.toThrow()
    expect(getBestScore(BASE)).toBe(4)
  })
})
