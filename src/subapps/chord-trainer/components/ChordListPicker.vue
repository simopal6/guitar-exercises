<script setup lang="ts">
import type { ChordList } from '../chord'

defineProps<{
  lists: ChordList[]
  selectedListId: string | null
  turnDurationSeconds: number
  baseBpm: number
  canStart: boolean
}>()

const emit = defineEmits<{
  'select-list': [id: string]
  'set-duration': [seconds: number]
  'set-base-bpm': [value: number]
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
      <p class="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Lista</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="list in lists"
          :key="list.id"
          type="button"
          class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
          :class="pillClass(list.id === selectedListId)"
          @click="emit('select-list', list.id)"
        >
          {{ list.name }} ({{ list.chords.length }})
        </button>
      </div>
      <p v-if="lists.length === 0" class="mt-2 text-sm text-slate-400">
        Nessuna lista disponibile — importane una qui sotto.
      </p>
    </div>

    <label class="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
      <span>Durata turno (secondi)</span>
      <input
        type="number"
        min="5"
        step="5"
        :value="turnDurationSeconds"
        class="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        @change="emit('set-duration', Number(($event.target as HTMLInputElement).value))"
      />
    </label>

    <label class="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
      <span>Bpm base (per coppie nuove)</span>
      <input
        type="number"
        min="20"
        step="5"
        :value="baseBpm"
        class="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        @change="emit('set-base-bpm', Number(($event.target as HTMLInputElement).value))"
      />
    </label>

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
