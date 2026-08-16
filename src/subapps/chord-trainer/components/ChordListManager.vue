<script setup lang="ts">
import { ref } from 'vue'
import type { ChordList } from '../chord'
import { deleteChordFromList, deleteList, exportChordListJson, importChordList } from '../chordListsStore'

defineProps<{ lists: ChordList[] }>()
const emit = defineEmits<{ changed: [] }>()

const message = ref<{ text: string; kind: 'success' | 'error' } | null>(null)

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // allow re-importing the same file name later
  if (!file) return
  try {
    const text = await file.text()
    const json = JSON.parse(text)
    const result = importChordList(json)
    message.value = {
      kind: 'success',
      text: result.isNewList
        ? `Importata come lista nuova: "${result.list.name}"`
        : `Lista "${result.list.name}" aggiornata (${result.addedChordIds.length} aggiunti, ${result.updatedChordIds.length} aggiornati)`,
    }
    emit('changed')
  } catch (error) {
    message.value = { kind: 'error', text: error instanceof Error ? error.message : 'Import fallito' }
  }
}

function downloadList(list: ChordList) {
  const json = exportChordListJson(list)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${list.name.replace(/\s+/g, '-').toLowerCase()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function removeChord(listId: string, chordId: string) {
  deleteChordFromList(listId, chordId)
  emit('changed')
}

function removeList(listId: string) {
  deleteList(listId)
  emit('changed')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <label
        class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
      >
        Importa lista (JSON)
        <input type="file" accept="application/json" class="hidden" @change="onFileChange" />
      </label>
      <p
        v-if="message"
        class="mt-2 text-sm"
        :class="message.kind === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
      >
        {{ message.text }}
      </p>
    </div>

    <div v-for="list in lists" :key="list.id" class="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <p class="font-semibold text-slate-700 dark:text-slate-200">{{ list.name }}</p>
        <div class="flex gap-3">
          <button type="button" class="text-xs text-indigo-600 hover:underline dark:text-indigo-400" @click="downloadList(list)">
            Esporta
          </button>
          <button type="button" class="text-xs text-rose-600 hover:underline dark:text-rose-400" @click="removeList(list.id)">
            Elimina lista
          </button>
        </div>
      </div>
      <ul class="mt-2 flex flex-col gap-1">
        <li
          v-for="chord in list.chords"
          :key="chord.id"
          class="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300"
        >
          <span>{{ chord.name }}<span v-if="chord.variant" class="text-slate-400"> ({{ chord.variant }})</span></span>
          <button
            type="button"
            class="text-xs text-rose-600 hover:underline dark:text-rose-400"
            @click="removeChord(list.id, chord.id)"
          >
            Elimina
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
