import { describe, expect, it } from 'vitest'
import { createExerciseEngine } from '../engine'
import { MODE_CONFIGS } from '../modes'
import { intervalName, intervalSemitones } from '../../theory'

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

describe('createExerciseEngine (name-semitones)', () => {
  it('produces well-formed questions with exactly one correct choice among 4', () => {
    const engine = createExerciseEngine(MODE_CONFIGS['name-semitones'], null, seededRng(3))
    for (let i = 0; i < 100; i++) {
      const q = engine.nextQuestion()
      expect(q.choices).toHaveLength(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
      expect(intervalSemitones(intervalName(q.semitones))).toBe(q.semitones)
      // q.intervalName may be an augmented/diminished variant, not just the canonical name
      expect(intervalSemitones(q.intervalName)).toBe(q.semitones)

      const correctChoice = q.choices[q.correctIndex]
      expect(correctChoice.face).toBe(q.answerFace)
      if (correctChoice.face === 'semitones') {
        expect(correctChoice.value).toBe(q.semitones)
      } else if (correctChoice.face === 'name') {
        expect(correctChoice.value).toBe(q.intervalName)
      }

      // question and answer faces are always the two configured faces, possibly swapped
      expect(new Set([q.questionFace, q.answerFace])).toEqual(new Set(['name', 'semitones']))
    }
  })

  it('validates answers against the recorded correct index', () => {
    const engine = createExerciseEngine(MODE_CONFIGS['name-semitones'], null, seededRng(4))
    const q = engine.nextQuestion()
    expect(engine.submitAnswer(q, q.correctIndex)).toEqual({ correct: true, correctIndex: q.correctIndex })
    const wrongIndex = (q.correctIndex + 1) % q.choices.length
    expect(engine.submitAnswer(q, wrongIndex)).toEqual({ correct: false, correctIndex: q.correctIndex })
  })

  it('throws for an unregistered mode id', () => {
    expect(() => createExerciseEngine({ id: 'nope', questionFace: 'name', answerFace: 'semitones' })).toThrow()
  })
})
