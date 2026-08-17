import { computed, onUnmounted, ref } from 'vue'
import { useWakeLock } from '../../../composables/useWakeLock'
import type { Chord, ChordList } from '../chord'
import { getPairTempo, setPairTempo } from '../pairTempoStore'
import { useMetronome } from './useMetronome'

export type ExercisePhase = 'setup' | 'running'
export type TurnState = 'active' | 'gap'

export interface ChordPairExerciseOptions {
  turnDurationSeconds?: number
  gapSeconds?: number
  baseBpm?: number
}

const TICK_MS = 250
const BPM_STEP = 5
const DEFAULT_TURN_SECONDS = 60
const DEFAULT_GAP_SECONDS = 2
const DEFAULT_BASE_BPM = 50

function buildPairPool(ids: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j]])
  }
  return pairs
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * No "finished" phase here: unlike the timed, scored interval exercise, this
 * one has nothing to summarize — it just cycles turns until the player
 * explicitly stops, so there are only 'setup' and 'running'.
 */
export function useChordPairExercise(options: ChordPairExerciseOptions = {}) {
  const turnDurationSeconds = ref(options.turnDurationSeconds ?? DEFAULT_TURN_SECONDS)
  const gapSeconds = options.gapSeconds ?? DEFAULT_GAP_SECONDS
  const baseBpm = ref(options.baseBpm ?? DEFAULT_BASE_BPM)

  const phase = ref<ExercisePhase>('setup')
  const turnState = ref<TurnState>('active')
  const selectedList = ref<ChordList | null>(null)
  const currentPair = ref<[Chord, Chord] | null>(null)
  const remainingSeconds = ref(turnDurationSeconds.value)

  const metronome = useMetronome(baseBpm.value)
  const bpm = metronome.bpm // single source of truth for the live tempo value
  const wakeLock = useWakeLock()

  const canStart = computed(() => (selectedList.value?.chords.length ?? 0) >= 2)

  let bag: Array<[string, string]> = []
  let timer: ReturnType<typeof setInterval> | null = null
  let endAt = 0

  function clearTimer() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function drawNextPairIds(): [string, string] {
    if (bag.length === 0) {
      const ids = (selectedList.value?.chords ?? []).map((c) => c.id)
      bag = shuffle(buildPairPool(ids)) // fresh reshuffle once the bag is exhausted
    }
    return bag.pop()!
  }

  function chordById(id: string): Chord | undefined {
    return selectedList.value?.chords.find((c) => c.id === id)
  }

  function startTurn() {
    const [idA, idB] = drawNextPairIds()
    const a = chordById(idA)
    const b = chordById(idB)
    if (!a || !b) return // defensive: selectedList is locked during 'running', ids always resolve
    currentPair.value = [a, b]

    const stored = getPairTempo(idA, idB)
    const resolvedBpm = stored ?? baseBpm.value
    if (stored === undefined) setPairTempo(idA, idB, resolvedBpm) // baseline established the first time this pair is seen
    metronome.setBpm(resolvedBpm)

    turnState.value = 'active'
    endAt = Date.now() + turnDurationSeconds.value * 1000
  }

  function startGap() {
    turnState.value = 'gap'
    endAt = Date.now() + gapSeconds * 1000
    // metronome deliberately keeps clicking through the gap, as a count-in
  }

  function tick() {
    const msLeft = endAt - Date.now()
    remainingSeconds.value = Math.max(0, Math.ceil(msLeft / 1000))
    if (msLeft > 0) return
    if (turnState.value === 'active') startGap()
    else startTurn()
  }

  async function start() {
    if (!canStart.value) return
    bag = []
    await wakeLock.request() // same user gesture that unlocks the metronome's audio context
    await metronome.start()
    phase.value = 'running'
    startTurn()
    clearTimer()
    timer = setInterval(tick, TICK_MS)
  }

  function stop() {
    clearTimer()
    metronome.stop()
    wakeLock.release()
    phase.value = 'setup'
    currentPair.value = null
  }

  function adjustBpm(steps: number) {
    if (!currentPair.value) return
    metronome.setBpm(bpm.value + steps * BPM_STEP)
    const [a, b] = currentPair.value
    setPairTempo(a.id, b.id, bpm.value) // persists the clamped value, immediately
  }

  function setSelectedList(list: ChordList | null) {
    if (phase.value !== 'setup') return
    selectedList.value = list
  }

  function setTurnDuration(seconds: number) {
    if (phase.value !== 'setup') return
    turnDurationSeconds.value = seconds
  }

  function setBaseBpm(value: number) {
    if (phase.value !== 'setup') return
    baseBpm.value = Math.max(1, value)
  }

  onUnmounted(() => {
    clearTimer()
    metronome.dispose()
    wakeLock.release() // covers navigating away from the screen mid-exercise
  })

  return {
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
  }
}
