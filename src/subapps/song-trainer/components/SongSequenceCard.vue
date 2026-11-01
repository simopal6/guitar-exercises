<script setup lang="ts">
import { computed } from 'vue'
import type { Song } from '../songs'

const props = defineProps<{
  title: string
  songs: Song[]
  positions: number[]
  total: number
  lap: number
  advanceLabel: string
}>()

const emit = defineEmits<{
  advance: []
  back: []
}>()

// "4–6" for a contiguous batch, "8, 1, 2" when it wraps past the end of the list
const positionText = computed(() => {
  const p = props.positions
  if (p.length === 0) return ''
  const contiguous = p.every((n, i) => i === 0 || n === p[i - 1] + 1)
  return contiguous && p.length > 1 ? `${p[0]}–${p[p.length - 1]}` : p.join(', ')
})
</script>

<template>
  <section class="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
    <div class="mb-4 flex items-baseline justify-between gap-3">
      <h2 class="font-semibold">{{ title }}</h2>
      <span v-if="total > 0" class="text-xs text-slate-500 dark:text-slate-400">
        giro {{ lap }} · {{ positionText }} di {{ total }}
      </span>
    </div>

    <p v-if="songs.length === 0" class="text-sm text-slate-500 dark:text-slate-400">Nessuna canzone nel repertorio.</p>
    <ol v-else class="mb-5 flex flex-col gap-2">
      <li v-for="(song, i) in songs" :key="song.id" class="flex items-baseline gap-3">
        <span v-if="songs.length > 1" class="w-5 text-sm font-medium text-slate-400">{{ i + 1 }}.</span>
        <span>
          <span class="text-lg font-medium">{{ song.title }}</span>
          <span v-if="song.artist" class="ml-2 text-sm text-slate-500 dark:text-slate-400">{{ song.artist }}</span>
        </span>
      </li>
    </ol>

    <div v-if="songs.length > 0" class="flex items-center justify-between gap-3">
      <button
        type="button"
        class="rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-500"
        @click="emit('advance')"
      >
        {{ advanceLabel }}
      </button>
      <button
        type="button"
        class="text-sm font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
        @click="emit('back')"
      >
        ← indietro
      </button>
    </div>
  </section>
</template>
