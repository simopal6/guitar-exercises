import { describe, expect, it } from 'vitest'
import { createExerciseEngine } from '../../engine'
import { MODE_CONFIGS } from '../index'
import { DIFFICULTY_LEVELS } from '../../difficulty'
import { intervalSemitones } from '../../../theory'

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

const SHAPE_MODE_IDS = ['name-shape', 'semitones-shape'] as const
const DIFFICULTIES: Array<(typeof DIFFICULTY_LEVELS)[number] | null> = [null, ...DIFFICULTY_LEVELS]

describe('generateIntervalQuestion — shape modes', () => {
  // Regression guard for the "unreachable semitone" bug: forcing an exact
  // semitone count onto generateShape can be geometrically impossible for
  // some difficulty/tuning combos (e.g. a Unison at beginner level). This
  // must never throw across every mode x difficulty combination.
  for (const modeId of SHAPE_MODE_IDS) {
    for (const difficulty of DIFFICULTIES) {
      const label = difficulty?.label ?? 'nessuna difficoltà'
      it(`never throws for mode "${modeId}" at difficulty "${label}", across many draws`, () => {
        const engine = createExerciseEngine(MODE_CONFIGS[modeId], difficulty, seededRng(42))
        for (let i = 0; i < 200; i++) {
          expect(() => engine.nextQuestion()).not.toThrow()
        }
      })
    }
  }

  it('respects allowedRootStrings from the difficulty level', () => {
    const beginner = DIFFICULTY_LEVELS[0]
    const engine = createExerciseEngine(MODE_CONFIGS['name-shape'], beginner, seededRng(11))
    for (let i = 0; i < 100; i++) {
      const q = engine.nextQuestion()
      const shapeValue = [q.prompt, ...q.choices].find((f) => f.face === 'shape')
      expect(shapeValue).toBeDefined()
      if (shapeValue?.face === 'shape') {
        expect(beginner.allowedRootStrings).toContain(shapeValue.value.rootPosition.stringIndex)
      }
    }
  })

  it('when answer choices are shapes, they have 4 distinct semitone counts', () => {
    // randomizeDirection means answerFace is 'shape' only about half the time
    // (the other half the question itself shows the shape) — only check the
    // invariant when it actually applies, over enough draws to hit both.
    const engine = createExerciseEngine(MODE_CONFIGS['semitones-shape'], null, seededRng(13))
    let shapeAnswerCount = 0
    for (let i = 0; i < 50; i++) {
      const q = engine.nextQuestion()
      expect(q.choices).toHaveLength(4)
      if (q.answerFace !== 'shape') continue
      shapeAnswerCount++
      const semitonesInChoices = q.choices.map((c) => (c.face === 'shape' ? c.value.semitones : undefined))
      expect(semitonesInChoices.every((s) => s !== undefined)).toBe(true)
      expect(new Set(semitonesInChoices).size).toBe(4)
    }
    expect(shapeAnswerCount).toBeGreaterThan(0)
  })

  it('the correct answer choice always matches the question interval, whichever face is shown', () => {
    const engine = createExerciseEngine(MODE_CONFIGS['name-shape'], null, seededRng(17))
    for (let i = 0; i < 50; i++) {
      const q = engine.nextQuestion()
      const correctChoice = q.choices[q.correctIndex]
      expect(correctChoice.face).toBe(q.answerFace)
      if (correctChoice.face === 'shape') {
        expect(correctChoice.value.semitones).toBe(q.semitones)
        expect(intervalSemitones(correctChoice.value.intervalName)).toBe(q.semitones)
      } else if (correctChoice.face === 'name') {
        expect(intervalSemitones(correctChoice.value)).toBe(q.semitones)
      }
    }
  })
})

describe('generateIntervalQuestion — name-semitones (unchanged from Fase 1)', () => {
  it('still produces well-formed name<->semitones questions', () => {
    const engine = createExerciseEngine(MODE_CONFIGS['name-semitones'], null, seededRng(3))
    for (let i = 0; i < 50; i++) {
      const q = engine.nextQuestion()
      expect(q.choices).toHaveLength(4)
      expect(new Set([q.questionFace, q.answerFace])).toEqual(new Set(['name', 'semitones']))
      expect(q.choices.every((c) => c.face === 'name' || c.face === 'semitones')).toBe(true)
    }
  })
})
