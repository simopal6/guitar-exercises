<script setup lang="ts">
import { PATTERNS } from '../patterns'
import { octaveLabel } from '../octaves'
import type { PracticeMode } from '../composables/useScalePractice'
import type { ScaleOctave } from '../octaves'

defineProps<{
  patternId: string | null
  mode: PracticeMode
  completeOctaves: ScaleOctave[]
  selectedOctaveIndex: number
  patternBpmPreview: number
  canStart: boolean
}>()

const emit = defineEmits<{
  'select-pattern': [id: string]
  'select-mode': [mode: PracticeMode]
  'select-octave': [index: number]
  start: []
}>()

function pillClass(active: boolean, disabled = false): string {
  if (disabled) return 'border-slate-200 bg-white text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-700'
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

    <div>
      <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Modalità</p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
          :class="pillClass(mode === 'forma')"
          @click="emit('select-mode', 'forma')"
        >
          Forma
        </button>
        <button
          type="button"
          :disabled="completeOctaves.length === 0"
          class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed"
          :class="pillClass(mode === 'scala', completeOctaves.length === 0)"
          @click="emit('select-mode', 'scala')"
        >
          Scala
        </button>
      </div>
    </div>

    <div v-if="mode === 'scala' && completeOctaves.length > 1">
      <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Ottava</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(octave, index) in completeOctaves"
          :key="`${octave.lowMidi}-${octave.highMidi}`"
          type="button"
          class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
          :class="pillClass(index === selectedOctaveIndex)"
          @click="emit('select-octave', index)"
        >
          {{ octaveLabel(index, completeOctaves.length) }}
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
