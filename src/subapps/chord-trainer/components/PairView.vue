<script setup lang="ts">
import ChordDiagram from './ChordDiagram.vue'
import type { Chord } from '../chord'

defineProps<{
  pair: [Chord, Chord]
  remainingSeconds: number
  turnState: 'active' | 'gap'
  fingeringRevealed: boolean
}>()

const emit = defineEmits<{
  skip: []
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <p class="text-sm text-slate-500 dark:text-slate-400">
      <span v-if="turnState === 'gap'">Prossima coppia tra</span>
      <span v-else>Tempo rimasto</span>
      <span class="ml-1 font-mono text-base font-semibold text-slate-800 dark:text-slate-100">{{ remainingSeconds }}s</span>
    </p>

    <button
      type="button"
      class="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      @click="emit('skip')"
    >
      Salta
    </button>

    <div class="grid w-full grid-cols-2 gap-4">
      <div v-for="chord in pair" :key="chord.id" class="flex items-center justify-center">
        <ChordDiagram v-if="chord.strings" :chord="chord" :revealed="fingeringRevealed" />
        <div
          v-else
          class="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700"
        >
          <p class="w-full text-center text-5xl font-extrabold text-slate-700 dark:text-slate-200">{{ chord.name }}</p>
          <p v-if="chord.variant" class="w-full text-center text-xl font-semibold text-slate-900 dark:text-white">{{ chord.variant }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
