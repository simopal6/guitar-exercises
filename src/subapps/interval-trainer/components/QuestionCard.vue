<script setup lang="ts">
import type { FaceValue } from '../../../engine/types'
import { faceValueLabel } from '../format'
import ShapeFretboard from './ShapeFretboard.vue'

defineProps<{ prompt: FaceValue }>()

const FACE_LABELS: Record<FaceValue['face'], string> = {
  name: 'Nome intervallo',
  semitones: 'Numero di semitoni',
  shape: 'Forma sul manico',
}
</script>

<template>
  <div class="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-slate-900">
    <p class="text-sm uppercase tracking-wide text-slate-400">{{ FACE_LABELS[prompt.face] }}</p>
    <div v-if="prompt.face === 'shape'" class="mt-3 flex justify-center">
      <ShapeFretboard :shape="prompt.value" />
    </div>
    <p v-else class="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">{{ faceValueLabel(prompt) }}</p>
  </div>
</template>
