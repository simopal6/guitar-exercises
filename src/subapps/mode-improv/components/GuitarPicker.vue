<script setup lang="ts">
import type { GuitarType } from '../../../components/audio/backing/useBackingTrack'

defineProps<{ guitarType: GuitarType }>()
const emit = defineEmits<{ select: [type: GuitarType] }>()

const OPTIONS: { type: GuitarType; label: string }[] = [
  { type: 'acoustic', label: 'Acustica' },
  { type: 'electric', label: 'Elettrica pulita' },
]

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
  <div>
    <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Chitarra</p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in OPTIONS"
        :key="option.type"
        type="button"
        :class="pillClass(option.type === guitarType)"
        :aria-pressed="option.type === guitarType"
        @click="emit('select', option.type)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
