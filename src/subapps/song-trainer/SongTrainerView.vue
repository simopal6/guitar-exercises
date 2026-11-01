<script setup lang="ts">
import { computed } from 'vue'
import { REVIEW_COUNT, useSongRotation } from './composables/useSongRotation'
import SongSequenceCard from './components/SongSequenceCard.vue'
import RepertoireList from './components/RepertoireList.vue'

const { songs, review, deep } = useSongRotation()

const reviewSongs = review.songs
const reviewPositions = review.positions
const reviewLap = review.lap
const deepSongs = deep.songs
const deepPositions = deep.positions
const deepLap = deep.lap

const reviewIds = computed(() => reviewSongs.value.map((s) => s.id))
const deepId = computed(() => deepSongs.value[0]?.id ?? null)
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-6 px-4 pb-8 pt-8">
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">Canzoni</h1>
    </header>

    <SongSequenceCard
      title="Ripasso di oggi"
      :songs="reviewSongs"
      :positions="reviewPositions"
      :total="songs.length"
      :lap="reviewLap"
      :advance-label="`Fatto → prossime ${REVIEW_COUNT}`"
      @advance="review.advance"
      @back="review.back"
    />

    <SongSequenceCard
      title="Approfondimento di oggi"
      :songs="deepSongs"
      :positions="deepPositions"
      :total="songs.length"
      :lap="deepLap"
      advance-label="Fatto → prossima"
      @advance="deep.advance"
      @back="deep.back"
    />

    <RepertoireList :songs="songs" :review-ids="reviewIds" :deep-id="deepId" />
  </div>
</template>
