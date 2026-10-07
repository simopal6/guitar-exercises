<script setup lang="ts">
import { useScalePractice } from './composables/useScalePractice'
import PatternSetup from './components/PatternSetup.vue'
import ScalePatternDiagram from './components/ScalePatternDiagram.vue'
import MetronomeControl from '../../components/audio/MetronomeControl.vue'

const {
  phase,
  patternId,
  notes,
  currentNoteIndex,
  rootFret,
  bpm,
  patternBpmPreview,
  canStart,
  start,
  stop,
  adjustBpm,
  selectPattern,
} = useScalePractice()
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-6 px-4 pb-8 pt-8">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Pratica scale</h1>
    </header>

    <PatternSetup
      v-if="phase === 'setup'"
      :pattern-id="patternId"
      :pattern-bpm-preview="patternBpmPreview"
      :can-start="canStart"
      @select-pattern="selectPattern"
      @start="start"
    />

    <template v-else>
      <ScalePatternDiagram :notes="notes" :current-index="currentNoteIndex" :root-fret="rootFret" />
      <MetronomeControl :bpm="bpm" @adjust="adjustBpm" />
      <button
        type="button"
        class="mt-6 border-t border-slate-200 pt-6 text-center text-sm font-medium text-slate-500 underline-offset-2 hover:underline dark:border-slate-800 dark:text-slate-400"
        @click="stop"
      >
        Interrompi pratica
      </button>
    </template>
  </div>
</template>
