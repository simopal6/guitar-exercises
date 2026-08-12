<script setup lang="ts">
import { computed } from 'vue'
import { useIntervalExercise } from './composables/useIntervalExercise'
import { DIFFICULTY_LEVELS } from '../../engine/difficulty'
import QuestionCard from './components/QuestionCard.vue'
import ChoiceButton from './components/ChoiceButton.vue'

const MODE_LABELS: Record<string, string> = {
  'name-semitones': 'Nome ↔ Semitoni',
  'name-shape': 'Nome ↔ Forma',
  'semitones-shape': 'Semitoni ↔ Forma',
}
const MODE_IDS = Object.keys(MODE_LABELS)

const {
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
} = useIntervalExercise()

function choiceState(index: number): 'idle' | 'selected' | 'correct' | 'incorrect' {
  if (!answered.value) return 'idle'
  if (index === currentQuestion.value.correctIndex) return 'correct'
  if (index === selectedIndex.value) return 'incorrect'
  return 'idle'
}

const choicesLayoutClass = computed(() =>
  currentQuestion.value.answerFace === 'shape' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3',
)

function pillClass(active: boolean, activeColor: 'indigo' | 'emerald'): string {
  if (!active) {
    return 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
  }
  return activeColor === 'indigo'
    ? 'border-indigo-500 bg-indigo-500 text-white'
    : 'border-emerald-500 bg-emerald-500 text-white'
}
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-6 px-4 pb-8 pt-8">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Allenamento intervalli</h1>
      <div class="text-sm text-slate-500 dark:text-slate-400">
        Punteggio <span class="font-semibold text-slate-800 dark:text-slate-100">{{ score }}</span>
        · Serie <span class="font-semibold text-slate-800 dark:text-slate-100">{{ streak }}</span>
      </div>
    </header>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="id in MODE_IDS"
        :key="id"
        type="button"
        class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
        :class="pillClass(id === modeId, 'indigo')"
        @click="setMode(id)"
      >
        {{ MODE_LABELS[id] }}
      </button>
    </div>

    <div v-if="usesShape" class="flex flex-wrap gap-2">
      <button
        v-for="level in DIFFICULTY_LEVELS"
        :key="level.id"
        type="button"
        class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
        :class="pillClass(level.id === difficultyId, 'emerald')"
        @click="setDifficulty(level.id)"
      >
        {{ level.label }}
      </button>
    </div>

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

    <button
      v-if="answered"
      type="button"
      class="rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-500"
      @click="next"
    >
      Prossima domanda
    </button>
  </div>
</template>
