<script setup lang="ts">
defineProps<{
  score: number
  bestScore: number
  isNewBest: boolean
}>()

const emit = defineEmits<{
  'play-again': []
  'change-settings': []
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-slate-900">
    <p class="text-sm uppercase tracking-wide text-slate-400">Tempo scaduto</p>
    <p class="text-4xl font-bold text-slate-900 dark:text-slate-50">{{ score }}</p>

    <p
      v-if="isNewBest"
      class="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-300"
    >
      Nuovo record!
    </p>
    <p v-else class="text-sm text-slate-500 dark:text-slate-400">
      Record: <span class="font-semibold text-slate-800 dark:text-slate-100">{{ bestScore }}</span>
    </p>

    <div class="mt-2 flex w-full flex-col gap-3">
      <button
        type="button"
        class="rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-500"
        @click="emit('play-again')"
      >
        Rigioca
      </button>
      <button
        type="button"
        class="rounded-xl border border-slate-200 px-4 py-3 text-center font-medium text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
        @click="emit('change-settings')"
      >
        Cambia impostazioni
      </button>
    </div>
  </div>
</template>
