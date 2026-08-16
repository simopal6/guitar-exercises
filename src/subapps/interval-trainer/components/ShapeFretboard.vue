<script setup lang="ts">
import { computed } from 'vue'
import Fretboard from '../../../components/fretboard/Fretboard.vue'
import type { HighlightedPosition } from '../../../components/fretboard/types'
import type { GeneratedShape } from '../../../theory'
import { STANDARD_TUNING } from '../../../theory'

const props = defineProps<{ shape: GeneratedShape }>()

// Fixed-width window so every shape (and, later, every chord) renders at the
// same zoom level — varying it by span made intervals look inconsistent.
const WINDOW_SIZE = 5

const minFret = computed(() => Math.min(props.shape.rootPosition.fret, props.shape.targetPosition.fret))
const maxFret = computed(() => Math.max(props.shape.rootPosition.fret, props.shape.targetPosition.fret))

// Centers the shape in the window when possible; pushes all the slack to the
// right once the left edge would go below fret 0. Width is always exactly
// WINDOW_SIZE frets — fretEnd is never recomputed from maxFret.
const fretStart = computed(() => {
  const span = maxFret.value - minFret.value
  const totalPadding = WINDOW_SIZE - 1 - span
  const leftPadding = Math.floor(totalPadding / 2)
  return Math.max(0, minFret.value - leftPadding)
})
const fretEnd = computed(() => fretStart.value + WINDOW_SIZE - 1)

const highlights = computed<HighlightedPosition[]>(() => [
  { position: props.shape.rootPosition, role: 'root' },
  { position: props.shape.targetPosition, role: 'target' },
])
</script>

<template>
  <Fretboard
    :tuning="STANDARD_TUNING"
    :fret-start="fretStart"
    :fret-end="fretEnd"
    :highlights="highlights"
    :show-open-string-labels="false"
  />
</template>
