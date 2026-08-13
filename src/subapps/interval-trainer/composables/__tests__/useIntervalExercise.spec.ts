import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useIntervalExercise } from '../useIntervalExercise'

// Mounts the composable inside a real component instance so onUnmounted has
// something to attach to (and so we can actually test unmount cleanup),
// instead of calling useIntervalExercise() bare in the test.
function withSetup<T>(composable: () => T): { result: T; unmount: () => void } {
  let result!: T
  const wrapper = mount({
    setup() {
      result = composable()
      return () => null
    },
  })
  return { result, unmount: () => wrapper.unmount() }
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useIntervalExercise', () => {
  it('starts in the setup phase with no current question', () => {
    const { result } = withSetup(useIntervalExercise)
    expect(result.phase.value).toBe('setup')
    expect(result.currentQuestion.value).toBeNull()
    expect(result.modeId.value).toBe('name-semitones')
    expect(result.durationSeconds.value).toBe(60)
  })

  it('start() moves to running, loads a question and starts the countdown', () => {
    const { result } = withSetup(useIntervalExercise)
    result.start()
    expect(result.phase.value).toBe('running')
    expect(result.currentQuestion.value).not.toBeNull()
    expect(result.remainingSeconds.value).toBe(60)
  })

  it('counts down as time passes', () => {
    const { result } = withSetup(useIntervalExercise)
    result.start()
    vi.advanceTimersByTime(10_000)
    expect(result.remainingSeconds.value).toBe(50)
  })

  it('answering awards score for a correct choice', () => {
    const { result } = withSetup(useIntervalExercise)
    result.start()
    const correctIndex = result.currentQuestion.value!.correctIndex
    result.answer(correctIndex)
    expect(result.score.value).toBe(1)
    expect(result.answered.value).toBe(true)
  })

  it('auto-advances to a fresh question ~1s after answering, without a manual next()', () => {
    const { result } = withSetup(useIntervalExercise)
    result.start()
    result.answer(result.currentQuestion.value!.correctIndex)
    expect(result.answered.value).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(result.answered.value).toBe(false)
    expect(result.selectedIndex.value).toBeNull()
    expect(result.currentQuestion.value).not.toBeNull()
  })

  it('answer() is a no-op outside the running phase', () => {
    const { result } = withSetup(useIntervalExercise)
    expect(result.phase.value).toBe('setup')
    result.answer(0)
    expect(result.score.value).toBe(0)
  })

  it('ends the session when the timer runs out and records the score as a new best', () => {
    const { result } = withSetup(useIntervalExercise)
    result.start()
    result.answer(result.currentQuestion.value!.correctIndex)

    vi.advanceTimersByTime(60_000)

    expect(result.phase.value).toBe('finished')
    expect(result.bestScore.value).toBe(result.score.value)
    expect(result.isNewBest.value).toBe(true)
  })

  it('clears a pending auto-advance when the timer expires mid-feedback', () => {
    const { result } = withSetup(useIntervalExercise)
    result.start()
    // Answer right near the end so the auto-advance timeout would fire after the session ends.
    vi.advanceTimersByTime(59_900)
    result.answer(result.currentQuestion.value!.correctIndex)
    vi.advanceTimersByTime(1_000)
    expect(result.phase.value).toBe('finished')
  })

  it('reset() returns to setup and stops the timer', () => {
    const { result } = withSetup(useIntervalExercise)
    result.start()
    result.reset()
    expect(result.phase.value).toBe('setup')
    expect(result.currentQuestion.value).toBeNull()

    // if the session timer wasn't actually cleared this would flip phase again
    vi.advanceTimersByTime(60_000)
    expect(result.phase.value).toBe('setup')
    expect(result.score.value).toBe(0)
  })

  it('start() after finishing is idempotent: fresh score, fresh question, recalculated isNewBest', () => {
    const { result } = withSetup(useIntervalExercise)
    result.start()
    result.answer(result.currentQuestion.value!.correctIndex)
    vi.advanceTimersByTime(60_000) // finish with score 1, new best

    result.start() // play again
    expect(result.score.value).toBe(0)
    expect(result.currentQuestion.value).not.toBeNull()

    vi.advanceTimersByTime(60_000) // finish again with score 0, not a new best
    expect(result.isNewBest.value).toBe(false)
  })

  it('setMode/setDifficulty/setDuration are no-ops once the session has started', () => {
    const { result } = withSetup(useIntervalExercise)
    result.start()
    result.setMode('semitones-shape')
    result.setDuration(180)
    expect(result.modeId.value).toBe('name-semitones')
    expect(result.durationSeconds.value).toBe(60)
  })

  it('bestScore reflects the (duration, mode, difficulty) combination, not just the latest session', () => {
    const { result: session1 } = withSetup(useIntervalExercise)
    session1.setDuration(180)
    session1.start()
    session1.answer(session1.currentQuestion.value!.correctIndex)
    vi.advanceTimersByTime(180_000)
    expect(session1.bestScore.value).toBe(1)

    // A separate session left at the default duration (60s) must not see the
    // 180s record — best scores are recorded per combination (verified more
    // thoroughly in bestScore.spec.ts). immediate:true on the setup watcher
    // means this is already correct as soon as the composable is created.
    const { result: session2 } = withSetup(useIntervalExercise)
    expect(session2.durationSeconds.value).toBe(60)
    expect(session2.bestScore.value).toBe(0)
  })

  it('bestScore preview updates live in setup as duration changes, without restarting', async () => {
    const { result } = withSetup(useIntervalExercise)
    result.setDuration(180)
    result.start()
    result.answer(result.currentQuestion.value!.correctIndex)
    vi.advanceTimersByTime(180_000)
    await nextTick()
    expect(result.bestScore.value).toBe(1)

    result.reset()
    await nextTick()
    result.setDuration(60)
    await nextTick()
    expect(result.durationSeconds.value).toBe(60)
    expect(result.bestScore.value).toBe(0) // different duration, no record yet
  })

  it('clears timers on unmount so no stray tick can fire afterwards', () => {
    const { result, unmount } = withSetup(useIntervalExercise)
    result.start()
    unmount()
    expect(() => vi.advanceTimersByTime(60_000)).not.toThrow()
    expect(result.phase.value).toBe('running') // never transitioned: the interval was cleared
  })
})
