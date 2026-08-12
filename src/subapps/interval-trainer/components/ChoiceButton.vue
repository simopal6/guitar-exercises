<script setup lang="ts">
import type { FaceValue } from '../../../engine/types'
import { faceValueLabel } from '../format'
import ShapeFretboard from './ShapeFretboard.vue'

withDefaults(
  defineProps<{
    choice: FaceValue
    state: 'idle' | 'selected' | 'correct' | 'incorrect'
    disabled?: boolean
  }>(),
  { disabled: false },
)
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="w-full rounded-xl border p-3 font-medium transition-colors disabled:cursor-default"
    :class="[
      choice.face === 'shape' ? 'flex justify-center' : 'text-left text-lg',
      {
        'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900':
          state === 'idle',
        'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950': state === 'selected',
        'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300':
          state === 'correct',
        'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300': state === 'incorrect',
      },
    ]"
  >
    <ShapeFretboard v-if="choice.face === 'shape'" :shape="choice.value" />
    <template v-else>{{ faceValueLabel(choice) }}</template>
  </button>
</template>
