<script setup lang="ts">
import { PATTERNS } from '../patterns'

defineProps<{
  patternId: string | null
  patternBpmPreview: number
  canStart: boolean
}>()

const emit = defineEmits<{
  'select-pattern': [id: string]
  start: []
}>()

function pillClass(active: boolean): string {
  return active
    ? 'border-indigo-500 bg-indigo-500 text-white'
    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Posizione</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="pattern in PATTERNS"
          :key="pattern.id"
          type="button"
          class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
          :class="pillClass(pattern.id === patternId)"
          @click="emit('select-pattern', pattern.id)"
        >
          {{ pattern.label }}
        </button>
      </div>
    </div>

    <p class="text-sm text-slate-500 dark:text-slate-400">
      Tempo: <span class="font-semibold text-slate-800 dark:text-slate-100">{{ patternBpmPreview }} bpm</span>
    </p>

    <button
      type="button"
      :disabled="!canStart"
      class="rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
      @click="emit('start')"
    >
      Inizia
    </button>
  </div>
</template>
