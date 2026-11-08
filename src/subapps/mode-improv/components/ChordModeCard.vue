<script setup lang="ts">
import ScalePatternDiagram from '../../../components/scale-box/ScalePatternDiagram.vue'
import type { ImprovChord } from '../composables/useModeImprov'

defineProps<{
  chord: ImprovChord
  active: boolean
  keyFret: number
  rootOffsetInBox: number
}>()
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm ring-2 transition dark:bg-slate-900"
    :class="active ? 'ring-indigo-500' : 'opacity-50 ring-transparent'"
    :aria-current="active ? 'true' : undefined"
  >
    <div class="text-center">
      <p class="text-3xl font-bold">{{ chord.symbol }}</p>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        <span class="font-semibold">{{ chord.numeral }}</span> · {{ chord.modeName }}
      </p>
    </div>
    <ScalePatternDiagram
      :notes="chord.boxNotes"
      :current-midi="null"
      :root-fret="keyFret"
      :root-offset-in-box="rootOffsetInBox"
      show-fret-number
    />
  </section>
</template>
