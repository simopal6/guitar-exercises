<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useChordPairExercise } from './composables/useChordPairExercise'
import { getAllLists } from './chordListsStore'
import { seedCagedListIfNeeded } from './seedCaged'
import PairView from './components/PairView.vue'
import MetronomeControl from './components/MetronomeControl.vue'
import ChordListPicker from './components/ChordListPicker.vue'
import ChordListManager from './components/ChordListManager.vue'
import ChordFormatHelp from './components/ChordFormatHelp.vue'
import type { ChordList } from './chord'

const {
  phase,
  turnState,
  selectedList,
  currentPair,
  remainingSeconds,
  bpm,
  turnDurationSeconds,
  baseBpm,
  canStart,
  setSelectedList,
  setTurnDuration,
  setBaseBpm,
  start,
  stop,
  adjustBpm,
} = useChordPairExercise()

const lists = ref<ChordList[]>([])
const showManager = ref(false)
const showHelp = ref(false)

function refreshLists() {
  lists.value = getAllLists()
  // keep the current selection valid if the selected list was edited/removed
  if (selectedList.value) {
    const stillThere = lists.value.find((l) => l.id === selectedList.value!.id)
    setSelectedList(stillThere ?? null)
  }
}

onMounted(() => {
  seedCagedListIfNeeded()
  refreshLists()
})

function onSelectList(id: string) {
  setSelectedList(lists.value.find((l) => l.id === id) ?? null)
}
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-6 px-4 pb-8 pt-8">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Allenamento accordi</h1>
    </header>

    <template v-if="phase === 'setup'">
      <ChordListPicker
        :lists="lists"
        :selected-list-id="selectedList?.id ?? null"
        :turn-duration-seconds="turnDurationSeconds"
        :base-bpm="baseBpm"
        :can-start="canStart"
        @select-list="onSelectList"
        @set-duration="setTurnDuration"
        @set-base-bpm="setBaseBpm"
        @start="start"
      />

      <button
        type="button"
        class="text-left text-sm font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
        @click="showManager = !showManager"
      >
        {{ showManager ? 'Nascondi gestione liste' : 'Gestisci liste (importa / esporta / elimina)' }}
      </button>
      <ChordListManager v-if="showManager" :lists="lists" @changed="refreshLists" />

      <button
        type="button"
        class="text-left text-sm font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
        @click="showHelp = !showHelp"
      >
        {{ showHelp ? 'Nascondi formato JSON' : 'Formato JSON degli accordi' }}
      </button>
      <ChordFormatHelp v-if="showHelp" />
    </template>

    <template v-else-if="phase === 'running' && currentPair">
      <PairView :pair="currentPair" :remaining-seconds="remainingSeconds" :turn-state="turnState" />
      <MetronomeControl :bpm="bpm" @adjust="adjustBpm" />
      <button
        type="button"
        class="text-center text-sm font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
        @click="stop"
      >
        Interrompi esercizio
      </button>
    </template>
  </div>
</template>
