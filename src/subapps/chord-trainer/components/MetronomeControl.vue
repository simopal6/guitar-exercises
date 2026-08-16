<script setup lang="ts">
defineProps<{ bpm: number }>()

const emit = defineEmits<{ adjust: [steps: number] }>()
</script>

<template>
  <div class="flex items-center justify-center gap-4">
    <button
      type="button"
      class="h-10 w-10 rounded-full border border-slate-200 text-lg font-semibold text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
      aria-label="Rallenta di 5 bpm"
      @click="emit('adjust', -1)"
    >
      −
    </button>
    <span class="text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-100">
      {{ bpm }} <span class="text-sm font-normal text-slate-400">bpm</span>
    </span>
    <button
      type="button"
      class="h-10 w-10 rounded-full border border-slate-200 text-lg font-semibold text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
      aria-label="Accelera di 5 bpm"
      @click="emit('adjust', 1)"
    >
      +
    </button>
  </div>
</template>
