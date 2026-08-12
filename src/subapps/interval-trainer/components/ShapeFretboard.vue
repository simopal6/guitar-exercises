<script setup lang="ts">
import { computed } from 'vue'
import Fretboard from '../../../components/fretboard/Fretboard.vue'
import type { HighlightedPosition } from '../../../components/fretboard/types'
import type { GeneratedShape } from '../../../theory'
import { STANDARD_TUNING } from '../../../theory'

const props = defineProps<{ shape: GeneratedShape }>()

// Tight window around the shape, one fret of padding on each side, never negative.
const fretStart = computed(() =>
  Math.max(0, Math.min(props.shape.rootPosition.fret, props.shape.targetPosition.fret) - 1),
)
const fretEnd = computed(() => Math.max(props.shape.rootPosition.fret, props.shape.targetPosition.fret) + 1)

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
