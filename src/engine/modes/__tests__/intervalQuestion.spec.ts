import { describe, expect, it } from 'vitest'
import { createExerciseEngine } from '../../engine'
import { MODE_CONFIGS } from '../index'
import { intervalName, intervalSemitones, randomIntervalName } from '../../../theory'

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
const ALL_SEMITONES = Array.from({ length: 12 }, (_, i) => i + 1) // 1-12, the app's default (no Unison)
const B_STRING_INDEX = 4

describe('generateIntervalQuestion — shape modes', () => {
  // Regression guard for the "unreachable semitone" bug: forcing an exact
  // semitone count onto generateShape can be geometrically impossible for
  // some tuning/fret-span combos. This must never throw across many draws.
  for (const modeId of SHAPE_MODE_IDS) {
    it(`never throws for mode "${modeId}", across many draws`, () => {
      const engine = createExerciseEngine(MODE_CONFIGS[modeId], ALL_SEMITONES, randomIntervalName, seededRng(42))
      for (let i = 0; i < 200; i++) {
        expect(() => engine.nextQuestion()).not.toThrow()
      }
    })
  }

  for (const modeId of SHAPE_MODE_IDS) {
    it(`mode "${modeId}" uses all 6 strings freely, including shapes that cross the B string`, () => {
      const engine = createExerciseEngine(MODE_CONFIGS[modeId], ALL_SEMITONES, randomIntervalName, seededRng(11))
      const stringsSeen = new Set<number>()
      let sawBStringInvolved = false
      for (let i = 0; i < 300; i++) {
        const q = engine.nextQuestion()
        const shapeValues = [q.prompt, ...q.choices].filter((f) => f.face === 'shape')
        for (const shapeValue of shapeValues) {
          stringsSeen.add(shapeValue.value.rootPosition.stringIndex)
          stringsSeen.add(shapeValue.value.targetPosition.stringIndex)
          if (
            shapeValue.value.rootPosition.stringIndex === B_STRING_INDEX ||
            shapeValue.value.targetPosition.stringIndex === B_STRING_INDEX
          ) {
            sawBStringInvolved = true
          }
        }
      }
      expect([...stringsSeen].sort()).toEqual([0, 1, 2, 3, 4, 5])
      expect(sawBStringInvolved).toBe(true)
    })
  }

  it('when answer choices are shapes, they have 4 distinct semitone counts', () => {
    // randomizeDirection means answerFace is 'shape' only about half the time
    // (the other half the question itself shows the shape) — only check the
    // invariant when it actually applies, over enough draws to hit both.
    const engine = createExerciseEngine(MODE_CONFIGS['semitones-shape'], ALL_SEMITONES, randomIntervalName, seededRng(13))
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
    const engine = createExerciseEngine(MODE_CONFIGS['name-shape'], ALL_SEMITONES, randomIntervalName, seededRng(17))
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

  for (const modeId of SHAPE_MODE_IDS) {
    it(`restricts mode "${modeId}" to a custom allowedSemitones set`, () => {
      const restricted = [3, 4, 5, 7]
      const engine = createExerciseEngine(MODE_CONFIGS[modeId], restricted, randomIntervalName, seededRng(37))
      for (let i = 0; i < 200; i++) {
        const q = engine.nextQuestion()
        expect(restricted).toContain(q.semitones)
        for (const choice of q.choices) {
          if (choice.face === 'semitones') expect(restricted).toContain(choice.value)
          if (choice.face === 'name') expect(restricted).toContain(intervalSemitones(choice.value))
          if (choice.face === 'shape') expect(restricted).toContain(choice.value.semitones)
        }
      }
    })
  }

  for (const modeId of SHAPE_MODE_IDS) {
    it(`never draws Unison for mode "${modeId}", in the question or in any choice`, () => {
      const engine = createExerciseEngine(MODE_CONFIGS[modeId], ALL_SEMITONES, randomIntervalName, seededRng(23))
      for (let i = 0; i < 200; i++) {
        const q = engine.nextQuestion()
        expect(q.semitones).not.toBe(0)
        expect(q.intervalName).not.toBe('Perfect Unison')
        for (const choice of q.choices) {
          if (choice.face === 'semitones') expect(choice.value).not.toBe(0)
          if (choice.face === 'name') expect(choice.value).not.toBe('Perfect Unison')
          if (choice.face === 'shape') expect(choice.value.semitones).not.toBe(0)
        }
      }
    })
  }

  for (const modeId of SHAPE_MODE_IDS) {
    it(`with nameSelector: intervalName (Standard), mode "${modeId}" never shows an enharmonic variant`, () => {
      const engine = createExerciseEngine(MODE_CONFIGS[modeId], ALL_SEMITONES, intervalName, seededRng(41))
      for (let i = 0; i < 200; i++) {
        const q = engine.nextQuestion()
        expect(q.intervalName).toBe(intervalName(q.semitones))
        for (const choice of q.choices) {
          if (choice.face === 'name') expect(choice.value).toBe(intervalName(intervalSemitones(choice.value)))
          if (choice.face === 'shape') expect(choice.value.intervalName).toBe(intervalName(choice.value.semitones))
        }
      }
    })
  }

  it('with nameSelector: randomIntervalName (Completa), name-shape still shows more than one spelling for the same semitone count', () => {
    const engine = createExerciseEngine(MODE_CONFIGS['name-shape'], ALL_SEMITONES, randomIntervalName, seededRng(43))
    const namesSeenPerSemitone = new Map<number, Set<string>>()
    for (let i = 0; i < 300; i++) {
      const q = engine.nextQuestion()
      const names = [q.prompt, ...q.choices].filter((f) => f.face === 'name')
      for (const n of names) {
        const semitones = intervalSemitones(n.value)
        const seen = namesSeenPerSemitone.get(semitones) ?? new Set<string>()
        seen.add(n.value)
        namesSeenPerSemitone.set(semitones, seen)
      }
    }
    expect([...namesSeenPerSemitone.values()].some((names) => names.size > 1)).toBe(true)
  })
})

describe('generateIntervalQuestion — name-semitones (unchanged from Fase 1)', () => {
  it('still produces well-formed name<->semitones questions', () => {
    const engine = createExerciseEngine(MODE_CONFIGS['name-semitones'], ALL_SEMITONES, randomIntervalName, seededRng(3))
    for (let i = 0; i < 50; i++) {
      const q = engine.nextQuestion()
      expect(q.choices).toHaveLength(4)
      expect(new Set([q.questionFace, q.answerFace])).toEqual(new Set(['name', 'semitones']))
      expect(q.choices.every((c) => c.face === 'name' || c.face === 'semitones')).toBe(true)
    }
  })

  it('never draws Unison, in the question or in any choice', () => {
    const engine = createExerciseEngine(MODE_CONFIGS['name-semitones'], ALL_SEMITONES, randomIntervalName, seededRng(29))
    for (let i = 0; i < 200; i++) {
      const q = engine.nextQuestion()
      expect(q.semitones).not.toBe(0)
      expect(q.intervalName).not.toBe('Perfect Unison')
      for (const choice of q.choices) {
        if (choice.face === 'semitones') expect(choice.value).not.toBe(0)
        if (choice.face === 'name') expect(choice.value).not.toBe('Perfect Unison')
      }
    }
  })

  it('restricts questions and choices to a custom allowedSemitones set', () => {
    const restricted = [3, 4, 5, 7]
    const engine = createExerciseEngine(MODE_CONFIGS['name-semitones'], restricted, randomIntervalName, seededRng(31))
    for (let i = 0; i < 200; i++) {
      const q = engine.nextQuestion()
      expect(restricted).toContain(q.semitones)
      for (const choice of q.choices) {
        if (choice.face === 'semitones') expect(restricted).toContain(choice.value)
        if (choice.face === 'name') expect(restricted).toContain(intervalSemitones(choice.value))
      }
    }
  })

  it('with nameSelector: intervalName (Standard), never shows an enharmonic variant, in the question or in any choice', () => {
    const engine = createExerciseEngine(MODE_CONFIGS['name-semitones'], ALL_SEMITONES, intervalName, seededRng(47))
    for (let i = 0; i < 200; i++) {
      const q = engine.nextQuestion()
      expect(q.intervalName).toBe(intervalName(q.semitones))
      for (const choice of q.choices) {
        if (choice.face === 'name') expect(choice.value).toBe(intervalName(intervalSemitones(choice.value)))
      }
    }
  })

  it('with nameSelector: intervalName, the tritone is always exactly "Tritone", never a variant', () => {
    const engine = createExerciseEngine(MODE_CONFIGS['name-semitones'], [6, 3, 4, 5], intervalName, seededRng(53))
    let sawTritone = false
    for (let i = 0; i < 200; i++) {
      const q = engine.nextQuestion()
      if (q.semitones === 6) {
        sawTritone = true
        expect(q.intervalName).toBe('Tritone')
      }
      for (const choice of q.choices) {
        if (choice.face === 'name' && intervalSemitones(choice.value) === 6) {
          expect(choice.value).toBe('Tritone')
        }
      }
    }
    expect(sawTritone).toBe(true)
  })

  it('with nameSelector: randomIntervalName (Completa), the tritone can show its variant names too', () => {
    const engine = createExerciseEngine(MODE_CONFIGS['name-semitones'], [6, 3, 4, 5], randomIntervalName, seededRng(59))
    const tritoneNamesSeen = new Set<string>()
    for (let i = 0; i < 200; i++) {
      const q = engine.nextQuestion()
      const names = [q.prompt, ...q.choices].filter((f) => f.face === 'name')
      for (const n of names) {
        if (intervalSemitones(n.value) === 6) tritoneNamesSeen.add(n.value)
      }
    }
    expect(tritoneNamesSeen.size).toBeGreaterThan(1)
  })
})
