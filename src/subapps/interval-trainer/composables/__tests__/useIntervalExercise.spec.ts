import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useIntervalExercise } from '../useIntervalExercise'

describe('useIntervalExercise', () => {
  it('starts in name-semitones mode with a well-formed question', () => {
    const { modeId, usesShape, currentQuestion } = useIntervalExercise()
    expect(modeId.value).toBe('name-semitones')
    expect(usesShape.value).toBe(false)
    expect(new Set([currentQuestion.value.questionFace, currentQuestion.value.answerFace])).toEqual(
      new Set(['name', 'semitones']),
    )
  })

  it('setMode regenerates the current question to match the new mode', async () => {
    const { setMode, currentQuestion, usesShape } = useIntervalExercise()
    setMode('name-shape')
    await nextTick()
    expect(usesShape.value).toBe(true)
    expect(new Set([currentQuestion.value.questionFace, currentQuestion.value.answerFace])).toEqual(
      new Set(['name', 'shape']),
    )
  })

  it('shows the difficulty selector as meaningful only for shape modes', async () => {
    const { setMode, usesShape } = useIntervalExercise()
    expect(usesShape.value).toBe(false)
    setMode('semitones-shape')
    await nextTick()
    expect(usesShape.value).toBe(true)
  })

  it('setDifficulty regenerates the current question without throwing, respecting the new level', async () => {
    const { setMode, setDifficulty, currentQuestion, difficultyId } = useIntervalExercise()
    setMode('semitones-shape')
    await nextTick()
    setDifficulty(1)
    await nextTick()
    expect(difficultyId.value).toBe(1)
    const q = currentQuestion.value
    expect(q.questionFace === 'shape' || q.answerFace === 'shape').toBe(true)
  })

  it('tracks score and streak across answers, without resetting on mode switch', async () => {
    const { currentQuestion, answer, score, streak, setMode } = useIntervalExercise()
    answer(currentQuestion.value.correctIndex)
    expect(score.value).toBe(1)
    expect(streak.value).toBe(1)

    setMode('name-shape')
    await nextTick()
    expect(score.value).toBe(1)
    expect(streak.value).toBe(1)
  })

  it('resets streak (not score) on a wrong answer', () => {
    const { currentQuestion, answer, score, streak } = useIntervalExercise()
    const wrongIndex = (currentQuestion.value.correctIndex + 1) % currentQuestion.value.choices.length
    answer(wrongIndex)
    expect(score.value).toBe(0)
    expect(streak.value).toBe(0)
  })
})
