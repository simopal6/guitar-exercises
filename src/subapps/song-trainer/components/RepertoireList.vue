<script setup lang="ts">
import { ref } from 'vue'
import type { Song } from '../songs'

defineProps<{
  songs: Song[]
  reviewIds: string[]
  deepId: string | null
}>()

const open = ref(false)
</script>

<template>
  <div class="flex flex-col gap-3">
    <button
      type="button"
      class="text-left text-sm font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ open ? '▾' : '▸' }} Repertorio ({{ songs.length }})
    </button>

    <ol v-if="open" class="flex flex-col gap-1 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <li v-for="(song, i) in songs" :key="song.id" class="flex items-baseline gap-3 text-sm">
        <span class="w-6 text-right text-slate-400">{{ i + 1 }}.</span>
        <span
          class="flex-1"
          :class="reviewIds.includes(song.id) || song.id === deepId ? 'font-semibold' : 'text-slate-600 dark:text-slate-300'"
        >
          {{ song.title }}
          <span v-if="song.artist" class="font-normal text-slate-500 dark:text-slate-400">· {{ song.artist }}</span>
        </span>
        <span class="flex gap-1">
          <span
            v-if="reviewIds.includes(song.id)"
            class="rounded-full bg-indigo-100 px-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            title="Ripasso di oggi"
          >R</span>
          <span
            v-if="song.id === deepId"
            class="rounded-full bg-amber-100 px-2 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            title="Approfondimento di oggi"
          >A</span>
        </span>
      </li>
    </ol>
  </div>
</template>
