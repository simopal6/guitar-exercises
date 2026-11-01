import { computed, ref, type ComputedRef } from 'vue'
import { SONGS, type Song } from '../songs'
import { getSequenceProgress, setSequenceProgress, type SequenceId, type SequenceProgress } from '../songProgressStore'

export const REVIEW_COUNT = 3

export interface SongSequence {
  /** Today's songs, in list order (wrapping past the end of the list). */
  songs: ComputedRef<Song[]>
  /** 1-based positions of today's songs in the list. */
  positions: ComputedRef<number[]>
  /** How many times the list has been gone through, starting at 1. */
  lap: ComputedRef<number>
  advance(): void
  back(): void
}

/**
 * Two independent bookmarks on the same repertoire: "review" moves by a
 * batch of REVIEW_COUNT songs, "deep" by one. Both only move when the user
 * says so — nothing advances on its own with the date.
 */
export function useSongRotation(songs: Song[] = SONGS) {
  function createSequence(id: SequenceId, batchSize: number): SongSequence {
    const size = Math.min(batchSize, songs.length)

    function resolve(saved: SequenceProgress | undefined): { index: number; lap: number } {
      const index = saved ? songs.findIndex((s) => s.id === saved.songId) : -1
      // An id that's no longer in the list (song removed or renamed) restarts from the top
      return index === -1 ? { index: 0, lap: 1 } : { index, lap: saved!.lap }
    }

    const state = ref(resolve(getSequenceProgress(id)))

    function save(index: number, lap: number) {
      state.value = { index, lap }
      setSequenceProgress(id, { songId: songs[index].id, lap })
    }

    const positions = computed(() =>
      Array.from({ length: size }, (_, i) => ((state.value.index + i) % songs.length) + 1),
    )

    return {
      songs: computed(() => positions.value.map((p) => songs[p - 1])),
      positions,
      lap: computed(() => state.value.lap),
      advance() {
        if (songs.length === 0) return
        const next = state.value.index + size
        save(next % songs.length, state.value.lap + (next >= songs.length ? 1 : 0))
      },
      back() {
        if (songs.length === 0) return
        const prev = state.value.index - size
        if (prev >= 0) save(prev, state.value.lap)
        else if (state.value.lap > 1) save(prev + songs.length, state.value.lap - 1)
        // already at the very start of the first lap: nothing to go back to
      },
    }
  }

  return {
    songs,
    review: createSequence('review', REVIEW_COUNT),
    deep: createSequence('deep', 1),
  }
}
