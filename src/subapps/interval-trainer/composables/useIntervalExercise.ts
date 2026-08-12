import { computed, ref, watch } from 'vue'
import { createExerciseEngine } from '../../../engine/engine'
import { DIFFICULTY_LEVELS } from '../../../engine/difficulty'
import { MODE_CONFIGS } from '../../../engine/modes'
import type { Question } from '../../../engine/types'

const MODE_IDS = Object.keys(MODE_CONFIGS)

export function useIntervalExercise() {
  const modeId = ref<string>(MODE_IDS[0])
  const difficultyId = ref<number>(DIFFICULTY_LEVELS[0].id)

  const mode = computed(() => MODE_CONFIGS[modeId.value])
  const difficulty = computed(() => DIFFICULTY_LEVELS.find((level) => level.id === difficultyId.value) ?? null)
  const usesShape = computed(() => mode.value.questionFace === 'shape' || mode.value.answerFace === 'shape')

  const engine = computed(() => createExerciseEngine(mode.value, difficulty.value))

  const currentQuestion = ref<Question>(engine.value.nextQuestion())
  const selectedIndex = ref<number | null>(null)
  const answered = ref(false)
  const score = ref(0)
  const streak = ref(0)

  function answer(choiceIndex: number) {
    if (answered.value) return
    selectedIndex.value = choiceIndex
    answered.value = true
    const result = engine.value.submitAnswer(currentQuestion.value, choiceIndex)
    if (result.correct) {
      score.value += 1
      streak.value += 1
    } else {
      streak.value = 0
    }
  }

  function next() {
    currentQuestion.value = engine.value.nextQuestion()
    selectedIndex.value = null
    answered.value = false
  }

  // Switching mode or difficulty mid-session generates a fresh question but
  // deliberately keeps score/streak running (not treated as a session reset).
  watch([modeId, difficultyId], next)

  function setMode(id: string) {
    modeId.value = id
  }

  function setDifficulty(id: number) {
    difficultyId.value = id
  }

  return {
    modeId,
    difficultyId,
    usesShape,
    currentQuestion,
    selectedIndex,
    answered,
    score,
    streak,
    answer,
    next,
    setMode,
    setDifficulty,
  }
}
