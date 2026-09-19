import { computed, onUnmounted, ref, watch } from 'vue'
import { createExerciseEngine } from '../../../engine/engine'
import { DIFFICULTY_LEVELS } from '../../../engine/difficulty'
import { MODE_CONFIGS } from '../../../engine/modes'
import type { Question } from '../../../engine/types'
import { intervalName, randomIntervalName } from '../../../theory'
import { getBestScore, recordScore } from '../bestScore'
import {
  COMPLETE_SEMITONES,
  MIN_SELECTED_SEMITONES,
  getIntervalPreset,
  getStandardSemitones,
  resetStandardSemitones as resetStandardSemitonesStore,
  setIntervalPreset as setIntervalPresetStore,
  setStandardSemitones as setStandardSemitonesStore,
  type IntervalPreset,
} from '../selectedIntervalsStore'

const MODE_IDS = Object.keys(MODE_CONFIGS)

export const DURATIONS = [
  { seconds: 60, label: '1 minuto' },
  { seconds: 180, label: '3 minuti' },
] as const

const CORRECT_ADVANCE_DELAY_MS = 1000
const INCORRECT_ADVANCE_DELAY_MS = 2500
const TIMER_TICK_MS = 250

export type SessionPhase = 'setup' | 'running' | 'finished'

export function useIntervalExercise() {
  const modeId = ref<string>(MODE_IDS[0])
  const difficultyId = ref<number>(DIFFICULTY_LEVELS[0].id)
  const durationSeconds = ref<number>(DURATIONS[0].seconds)
  const intervalPreset = ref<IntervalPreset>(getIntervalPreset())
  const standardSemitones = ref<number[]>(getStandardSemitones())

  const mode = computed(() => MODE_CONFIGS[modeId.value])
  const difficulty = computed(() => DIFFICULTY_LEVELS.find((level) => level.id === difficultyId.value) ?? null)
  const usesShape = computed(() => mode.value.questionFace === 'shape' || mode.value.answerFace === 'shape')
  const activeSemitones = computed(() =>
    intervalPreset.value === 'completa' ? COMPLETE_SEMITONES : standardSemitones.value,
  )
  const canStart = computed(() => activeSemitones.value.length >= MIN_SELECTED_SEMITONES)
  // Standard: one fixed canonical name per interval. Completa: the full set
  // of enharmonic variants, as before — this is the naming half of the
  // interval-selection preset, orthogonal to which semitones are allowed.
  const nameSelector = computed(() => (intervalPreset.value === 'completa' ? randomIntervalName : intervalName))
  const engine = computed(() =>
    createExerciseEngine(mode.value, difficulty.value, activeSemitones.value, nameSelector.value),
  )

  const phase = ref<SessionPhase>('setup')
  const remainingSeconds = ref(durationSeconds.value)
  const score = ref(0)
  const isNewBest = ref(false)

  // Plain ref, refreshed explicitly rather than a computed() over
  // getBestScore(): a computed only re-runs when its *reactive* deps change,
  // and it has no way to notice that recordScore() wrote to localStorage.
  const bestScore = ref(0)
  function refreshBestScore() {
    bestScore.value = getBestScore({
      durationSeconds: durationSeconds.value,
      modeId: modeId.value,
      difficultyId: difficultyId.value,
      usesShape: usesShape.value,
      intervalPreset: intervalPreset.value,
    })
  }
  watch([durationSeconds, modeId, difficultyId, intervalPreset], refreshBestScore, { immediate: true })

  const currentQuestion = ref<Question | null>(null)
  const selectedIndex = ref<number | null>(null)
  const answered = ref(false)

  let sessionTimer: ReturnType<typeof setInterval> | null = null
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null
  let endAt = 0

  function clearTimers() {
    if (sessionTimer !== null) {
      clearInterval(sessionTimer)
      sessionTimer = null
    }
    if (autoAdvanceTimer !== null) {
      clearTimeout(autoAdvanceTimer)
      autoAdvanceTimer = null
    }
  }

  function loadNextQuestion() {
    currentQuestion.value = engine.value.nextQuestion()
    selectedIndex.value = null
    answered.value = false
  }

  function tick() {
    // Re-derived from Date.now() rather than decremented, so a throttled
    // background tab never drifts — the countdown just looks "paused"
    // between ticks and snaps to the correct value when one fires.
    remainingSeconds.value = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
    if (endAt - Date.now() <= 0) finish()
  }

  function start() {
    if (!canStart.value) return
    clearTimers()
    score.value = 0
    isNewBest.value = false
    phase.value = 'running'
    remainingSeconds.value = durationSeconds.value
    endAt = Date.now() + durationSeconds.value * 1000
    loadNextQuestion()
    sessionTimer = setInterval(tick, TIMER_TICK_MS)
  }

  function finish() {
    if (phase.value !== 'running') return
    clearTimers()
    phase.value = 'finished'
    const result = recordScore(
      {
        durationSeconds: durationSeconds.value,
        modeId: modeId.value,
        difficultyId: difficultyId.value,
        usesShape: usesShape.value,
        intervalPreset: intervalPreset.value,
      },
      score.value,
    )
    bestScore.value = result.best
    isNewBest.value = result.isNewBest
  }

  function answer(choiceIndex: number) {
    if (phase.value !== 'running' || answered.value || !currentQuestion.value) return
    selectedIndex.value = choiceIndex
    answered.value = true
    const result = engine.value.submitAnswer(currentQuestion.value, choiceIndex)
    if (result.correct) score.value += 1
    const delay = result.correct ? CORRECT_ADVANCE_DELAY_MS : INCORRECT_ADVANCE_DELAY_MS
    autoAdvanceTimer = setTimeout(() => {
      if (phase.value === 'running') loadNextQuestion()
    }, delay)
  }

  function reset() {
    clearTimers()
    phase.value = 'setup'
    currentQuestion.value = null
  }

  function setMode(id: string) {
    if (phase.value !== 'setup') return
    modeId.value = id
  }

  function setDifficulty(id: number) {
    if (phase.value !== 'setup') return
    difficultyId.value = id
  }

  function setDuration(seconds: number) {
    if (phase.value !== 'setup') return
    durationSeconds.value = seconds
    remainingSeconds.value = seconds
  }

  function setIntervalPreset(preset: IntervalPreset) {
    if (phase.value !== 'setup') return
    intervalPreset.value = preset
    setIntervalPresetStore(preset)
  }

  function toggleStandardSemitone(semitones: number) {
    if (phase.value !== 'setup') return
    const next = standardSemitones.value.includes(semitones)
      ? standardSemitones.value.filter((s) => s !== semitones)
      : [...standardSemitones.value, semitones]
    standardSemitones.value = next
    setStandardSemitonesStore(next)
  }

  function resetStandardSemitones() {
    if (phase.value !== 'setup') return
    resetStandardSemitonesStore()
    standardSemitones.value = getStandardSemitones()
  }

  onUnmounted(clearTimers)

  return {
    modeId,
    difficultyId,
    durationSeconds,
    usesShape,
    intervalPreset,
    standardSemitones,
    canStart,
    phase,
    remainingSeconds,
    score,
    bestScore,
    isNewBest,
    currentQuestion,
    selectedIndex,
    answered,
    setMode,
    setDifficulty,
    setDuration,
    setIntervalPreset,
    toggleStandardSemitone,
    resetStandardSemitones,
    start,
    answer,
    reset,
  }
}
