<script setup lang="ts">
import { useModeImprov } from './composables/useModeImprov'
import ImprovSetup from './components/ImprovSetup.vue'
import ChordModeCard from './components/ChordModeCard.vue'
import GuitarPicker from './components/GuitarPicker.vue'
import MetronomeControl from '../../components/audio/MetronomeControl.vue'

const {
  phase,
  barsPerChord,
  bpm,
  guitarType,
  isLoading,
  loadError,
  barInChord,
  round,
  activeChordIndex,
  canStart,
  setBarsPerChord,
  setGuitarType,
  start,
  stop,
  nextRound,
  adjustBpm,
} = useModeImprov()
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-6 px-4 pb-8 pt-8">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Improvvisazione con i modi</h1>
    </header>

    <ImprovSetup
      v-if="phase === 'setup'"
      :bars-per-chord="barsPerChord"
      :guitar-type="guitarType"
      :bpm="bpm"
      :is-loading="isLoading"
      :load-error="loadError"
      :can-start="canStart"
      @set-bars="setBarsPerChord"
      @set-guitar="setGuitarType"
      @start="start"
    />

    <template v-else-if="round">
      <p class="text-center text-lg">
        Chiave: <span class="font-semibold">{{ round.keyName }} maggiore</span>
      </p>

      <div class="grid grid-cols-2 gap-3">
        <ChordModeCard
          v-for="(chord, i) in round.chords"
          :key="`${round.keyName}-${chord.numeral}`"
          :chord="chord"
          :active="activeChordIndex === i"
          :key-fret="round.keyFret"
          :root-offset-in-box="round.rootOffsetInBox"
        />
      </div>

      <p v-if="activeChordIndex !== null" class="text-center text-sm text-slate-500 dark:text-slate-400">
        battuta {{ barInChord + 1 }} / {{ barsPerChord }}
      </p>

      <button
        type="button"
        class="rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-500"
        @click="nextRound"
      >
        Nuova estrazione
      </button>

      <MetronomeControl :bpm="bpm" @adjust="adjustBpm" />
      <GuitarPicker :guitar-type="guitarType" @select="setGuitarType" />

      <button
        type="button"
        class="mt-6 border-t border-slate-200 pt-6 text-center text-sm font-medium text-slate-500 underline-offset-2 hover:underline dark:border-slate-800 dark:text-slate-400"
        @click="stop"
      >
        Interrompi esercizio
      </button>
    </template>
  </div>
</template>
