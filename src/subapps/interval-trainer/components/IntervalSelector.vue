<script setup lang="ts">
import { intervalName } from '../../../theory'
import type { IntervalPreset } from '../selectedIntervalsStore'

defineProps<{
  intervalPreset: IntervalPreset
  standardSemitones: number[]
}>()

const emit = defineEmits<{
  'set-interval-preset': [preset: IntervalPreset]
  'toggle-standard-semitone': [semitones: number]
  'reset-standard-semitones': []
}>()

// 1-12: Unison is deliberately never offered, see engine/modes/intervalQuestion.ts
const ALL_SEMITONES = Array.from({ length: 12 }, (_, i) => i + 1)

const PRESET_LABELS: Record<IntervalPreset, string> = {
  standard: 'Standard',
  completa: 'Completa',
}
const PRESET_IDS: IntervalPreset[] = ['standard', 'completa']
</script>

<template>
  <div>
    <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Intervalli</p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="preset in PRESET_IDS"
        :key="preset"
        type="button"
        class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
        :class="
          preset === intervalPreset
            ? 'border-sky-500 bg-sky-500 text-white'
            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
        "
        @click="emit('set-interval-preset', preset)"
      >
        {{ PRESET_LABELS[preset] }}
      </button>
    </div>

    <div v-if="intervalPreset === 'standard'" class="mt-3">
      <div class="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <label
          v-for="semitones in ALL_SEMITONES"
          :key="semitones"
          class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
        >
          <input
            type="checkbox"
            :checked="standardSemitones.includes(semitones)"
            @change="emit('toggle-standard-semitone', semitones)"
          />
          {{ intervalName(semitones) }}
        </label>
      </div>
      <button
        type="button"
        class="mt-2 text-left text-sm font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
        @click="emit('reset-standard-semitones')"
      >
        Ripristina default
      </button>
    </div>
  </div>
</template>
