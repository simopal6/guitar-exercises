<script setup lang="ts">
import type { GuitarType } from '../../../components/audio/backing/useBackingTrack'
import { BARS_PER_CHORD_OPTIONS, type BarsPerChord } from '../composables/useModeImprov'
import GuitarPicker from './GuitarPicker.vue'

defineProps<{
  barsPerChord: BarsPerChord
  guitarType: GuitarType
  bpm: number
  isLoading: boolean
  loadError: string | null
  canStart: boolean
}>()

const emit = defineEmits<{
  'set-bars': [bars: BarsPerChord]
  'set-guitar': [type: GuitarType]
  start: []
}>()

function pillClass(active: boolean): string {
  return [
    'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
    active
      ? 'border-indigo-500 bg-indigo-500 text-white'
      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  ].join(' ')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <p class="text-sm text-slate-600 dark:text-slate-300">
      Una chiave maggiore e due suoi accordi, scelti a caso. La base li suona in loop: su ogni accordo improvvisa con il
      modo del suo grado.
    </p>

    <div>
      <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Battute per accordo</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="bars in BARS_PER_CHORD_OPTIONS"
          :key="bars"
          type="button"
          :class="pillClass(bars === barsPerChord)"
          :aria-pressed="bars === barsPerChord"
          @click="emit('set-bars', bars)"
        >
          {{ bars }}
        </button>
      </div>
    </div>

    <GuitarPicker :guitar-type="guitarType" @select="emit('set-guitar', $event)" />

    <p class="text-sm text-slate-500 dark:text-slate-400">Tempo: {{ bpm }} bpm</p>

    <p v-if="loadError" class="text-sm text-red-600 dark:text-red-400">{{ loadError }}</p>
    <button
      type="button"
      class="rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
      :disabled="!canStart"
      @click="emit('start')"
    >
      {{ isLoading ? 'Carico i suoni…' : 'Inizia' }}
    </button>
  </div>
</template>
