<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { formatElapsed } from './elapsedTime'

// Counts from mount: views render it only while an exercise is running, so it
// starts with the exercise and disappears when it stops. Elapsed time comes
// from the wall clock, not from counting ticks, so throttled timers (locked
// screen, background tab) don't make it drift.
const startedAt = Date.now()
const elapsedSeconds = ref(0)
let intervalId: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  intervalId = setInterval(() => {
    elapsedSeconds.value = Math.floor((Date.now() - startedAt) / 1000)
  }, 1000)
})
onUnmounted(() => clearInterval(intervalId))

const label = computed(() => formatElapsed(elapsedSeconds.value))
</script>

<template>
  <span
    data-testid="elapsed-time"
    aria-label="Tempo trascorso"
    class="text-lg font-semibold tabular-nums text-slate-500 dark:text-slate-400"
  >
    {{ label }}
  </span>
</template>
