<script setup lang="ts">
import { computed } from 'vue'
import { useIntervalExercise } from './composables/useIntervalExercise'
import QuestionCard from './components/QuestionCard.vue'
import ChoiceButton from './components/ChoiceButton.vue'
import SessionSetup from './components/SessionSetup.vue'
import SessionResult from './components/SessionResult.vue'

const {
  modeId,
  difficultyId,
  durationSeconds,
  usesShape,
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
  start,
  answer,
  reset,
} = useIntervalExercise()

function choiceState(index: number): 'idle' | 'selected' | 'correct' | 'incorrect' {
  if (!currentQuestion.value || !answered.value) return 'idle'
  if (index === currentQuestion.value.correctIndex) return 'correct'
  if (index === selectedIndex.value) return 'incorrect'
  return 'idle'
}

const choicesLayoutClass = computed(() =>
  currentQuestion.value?.answerFace === 'shape' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3',
)

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-6 px-4 pb-8 pt-8">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Allenamento intervalli</h1>
      <div v-if="phase === 'running'" class="text-sm text-slate-500 dark:text-slate-400">
        <span class="font-mono text-base font-semibold text-slate-800 dark:text-slate-100">{{
          formatTime(remainingSeconds)
        }}</span>
        · Punteggio <span class="font-semibold text-slate-800 dark:text-slate-100">{{ score }}</span>
      </div>
    </header>

    <SessionSetup
      v-if="phase === 'setup'"
      :mode-id="modeId"
      :difficulty-id="difficultyId"
      :duration-seconds="durationSeconds"
      :uses-shape="usesShape"
      :best-score="bestScore"
      @set-mode="setMode"
      @set-difficulty="setDifficulty"
      @set-duration="setDuration"
      @start="start"
    />

    <template v-else-if="phase === 'running' && currentQuestion">
      <QuestionCard :prompt="currentQuestion.prompt" />

      <div :class="choicesLayoutClass">
        <ChoiceButton
          v-for="(choice, index) in currentQuestion.choices"
          :key="index"
          :choice="choice"
          :state="choiceState(index)"
          :disabled="answered"
          @click="answer(index)"
        />
      </div>
    </template>

    <SessionResult
      v-else-if="phase === 'finished'"
      :score="score"
      :best-score="bestScore"
      :is-new-best="isNewBest"
      @play-again="start"
      @change-settings="reset"
    />
  </div>
</template>
