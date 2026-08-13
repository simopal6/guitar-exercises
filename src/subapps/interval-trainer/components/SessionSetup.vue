<script setup lang="ts">
import { DIFFICULTY_LEVELS } from '../../../engine/difficulty'
import { DURATIONS } from '../composables/useIntervalExercise'

defineProps<{
  modeId: string
  difficultyId: number
  durationSeconds: number
  usesShape: boolean
  bestScore: number
}>()

const emit = defineEmits<{
  'set-mode': [id: string]
  'set-difficulty': [id: number]
  'set-duration': [seconds: number]
  start: []
}>()

const MODE_LABELS: Record<string, string> = {
  'name-semitones': 'Nome ↔ Semitoni',
  'name-shape': 'Nome ↔ Forma',
  'semitones-shape': 'Semitoni ↔ Forma',
}
const MODE_IDS = Object.keys(MODE_LABELS)

const PILL_COLORS = {
  indigo: 'border-indigo-500 bg-indigo-500 text-white',
  emerald: 'border-emerald-500 bg-emerald-500 text-white',
  amber: 'border-amber-500 bg-amber-500 text-white',
} as const

function pillClass(active: boolean, activeColor: keyof typeof PILL_COLORS): string {
  if (!active) {
    return 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
  }
  return PILL_COLORS[activeColor]
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Modalità</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="id in MODE_IDS"
          :key="id"
          type="button"
          class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
          :class="pillClass(id === modeId, 'indigo')"
          @click="emit('set-mode', id)"
        >
          {{ MODE_LABELS[id] }}
        </button>
      </div>
    </div>

    <div v-if="usesShape">
      <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Difficoltà</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="level in DIFFICULTY_LEVELS"
          :key="level.id"
          type="button"
          class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
          :class="pillClass(level.id === difficultyId, 'emerald')"
          @click="emit('set-difficulty', level.id)"
        >
          {{ level.label }}
        </button>
      </div>
    </div>

    <div>
      <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Durata</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="d in DURATIONS"
          :key="d.seconds"
          type="button"
          class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
          :class="pillClass(d.seconds === durationSeconds, 'amber')"
          @click="emit('set-duration', d.seconds)"
        >
          {{ d.label }}
        </button>
      </div>
    </div>

    <p class="text-sm text-slate-500 dark:text-slate-400">
      Record attuale: <span class="font-semibold text-slate-800 dark:text-slate-100">{{ bestScore }}</span>
    </p>

    <button
      type="button"
      class="rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-500"
      @click="emit('start')"
    >
      Inizia
    </button>
  </div>
</template>
