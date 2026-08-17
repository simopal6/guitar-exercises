<script setup lang="ts">
import { ref } from 'vue'
import type { ChordList } from '../chord'
import { deleteChordFromList, deleteList, exportChordListJson, importChordList } from '../chordListsStore'

defineProps<{ lists: ChordList[] }>()
const emit = defineEmits<{ changed: [] }>()

const message = ref<{ text: string; kind: 'success' | 'error' } | null>(null)
const pasteText = ref('')

function onImportClick() {
  try {
    const json = JSON.parse(pasteText.value)
    const result = importChordList(json)
    message.value = {
      kind: 'success',
      text: result.isNewList
        ? `Importata come lista nuova: "${result.list.name}"`
        : `Lista "${result.list.name}" aggiornata (${result.addedChordIds.length} aggiunti, ${result.updatedChordIds.length} aggiornati)`,
    }
    pasteText.value = '' // ready for the next paste, avoids re-importing the same content by accident
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
    <div class="flex flex-col gap-2">
      <label class="text-sm font-medium text-slate-500 dark:text-slate-400" for="chord-import-textarea">
        Incolla qui il JSON della lista
      </label>
      <textarea
        id="chord-import-textarea"
        v-model="pasteText"
        rows="6"
        placeholder='{"name": "Le mie forme", "chords": [...]}'
        class="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      ></textarea>
      <button
        type="button"
        :disabled="!pasteText.trim()"
        class="self-start rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
        @click="onImportClick"
      >
        Importa
      </button>
      <p
        v-if="message"
        class="text-sm"
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
