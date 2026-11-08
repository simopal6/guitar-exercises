import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import {
  chordSymbol,
  diatonicTriad,
  majorKeyName,
  modeScale,
  romanNumeral,
  type DiatonicTriad,
} from '../../../theory'
import { useBackingTrack, type BackingSequence, type GuitarType } from '../../../components/audio/backing/useBackingTrack'
import { useWakeLock } from '../../../composables/useWakeLock'
import type { DerivedNote } from '../../../components/scale-box/patternNotes'
import { drawExtraction, type Extraction } from '../extraction'
import { KEY_ROOT_OFFSET_IN_BOX, keyBox, modeBoxNotes } from '../modeBox'
import { getModeImprovBpm, setModeImprovBpm } from '../bpmStore'

const BPM_STEP = 5
const DEFAULT_BPM = 80
export const BARS_PER_CHORD_OPTIONS = [1, 2, 4] as const
export type BarsPerChord = (typeof BARS_PER_CHORD_OPTIONS)[number]

export type ImprovPhase = 'setup' | 'running'

export interface ImprovChord {
  triad: DiatonicTriad
  /** e.g. "Am" */
  symbol: string
  /** e.g. "ii" */
  numeral: string
  /** e.g. "Dorian" */
  modeName: string
  /** The key's box, numbered and colored from this chord's root (its mode). */
  boxNotes: DerivedNote[]
}

export interface ImprovRound {
  extraction: Extraction
  keyName: string
  chords: ImprovChord[]
  /** Fret of the key's root on the 6th string — the diagram's box is anchored on it. */
  keyFret: number
  rootOffsetInBox: number
  sequence: BackingSequence
}

function buildRound(extraction: Extraction, barsPerChord: number): ImprovRound {
  const box = keyBox(extraction.key)
  const chords = extraction.degrees.map((degree) => {
    const triad = diatonicTriad(extraction.key, degree)
    return {
      triad,
      symbol: chordSymbol(extraction.key, triad),
      numeral: romanNumeral(degree, triad.quality),
      modeName: modeScale(degree).name,
      boxNotes: modeBoxNotes(box, degree, triad.root),
    }
  })
  return {
    extraction,
    keyName: majorKeyName(extraction.key),
    chords,
    keyFret: box.keyFret,
    rootOffsetInBox: KEY_ROOT_OFFSET_IN_BOX,
    sequence: { chords: chords.map((c) => ({ root: c.triad.root, quality: c.triad.quality })), barsPerChord },
  }
}

/**
 * Improvising with modes over two chords of a key: a random key and two
 * different degrees, a backing band looping the two chords, and the key's box
 * shown once per chord, colored from that chord's root. No timer and no
 * scoring — the player stops when they want, or asks for a new draw.
 */
export function useModeImprov() {
  const phase = ref<ImprovPhase>('setup')
  const barsPerChord = ref<BarsPerChord>(2)
  const backing = useBackingTrack(getModeImprovBpm() ?? DEFAULT_BPM)
  const wakeLock = useWakeLock()

  // The latest draw, and the one before it: after "Nuova estrazione" the old
  // chords keep playing until the next bar line, so the screen keeps showing
  // them until the band actually switches.
  const latest = shallowRef<ImprovRound | null>(null)
  const previous = shallowRef<ImprovRound | null>(null)

  const round = computed<ImprovRound | null>(() => {
    const playing = backing.playingSequence.value
    if (playing && previous.value?.sequence === playing) return previous.value
    return latest.value
  })
  /** Index of the chord being heard, or null before the first bar. */
  const activeChordIndex = computed(() =>
    round.value && backing.playingSequence.value === round.value.sequence ? backing.currentChordIndex.value : null,
  )

  function newRound(): void {
    const next = buildRound(drawExtraction(latest.value?.extraction ?? null), barsPerChord.value)
    previous.value = latest.value
    latest.value = next
    backing.setSequence(next.sequence)
  }

  function setBarsPerChord(bars: BarsPerChord): void {
    if (phase.value !== 'setup') return
    barsPerChord.value = bars
  }

  function setGuitarType(type: GuitarType): Promise<void> {
    return backing.setGuitarType(type)
  }

  const canStart = computed(() => !backing.isLoading.value && !backing.loadError.value)

  async function start(): Promise<void> {
    if (phase.value === 'running') return
    previous.value = null
    latest.value = null
    newRound()
    // iOS Safari only resumes the audio context if that happens with no other
    // awaited work in between it and the tap — so the band starts before the
    // (also async) wake lock request.
    await backing.start()
    if (!backing.isRunning.value) return // samples failed to load: loadError says why
    await wakeLock.request()
    phase.value = 'running'
  }

  function stop(): void {
    backing.stop()
    void wakeLock.release()
    phase.value = 'setup'
    previous.value = null
    latest.value = null
  }

  function nextRound(): void {
    if (phase.value !== 'running') return
    newRound()
  }

  function adjustBpm(steps: number): void {
    backing.setBpm(backing.bpm.value + steps * BPM_STEP)
    setModeImprovBpm(backing.bpm.value)
  }

  onMounted(() => {
    void backing.load()
  })
  onUnmounted(() => {
    backing.dispose()
    void wakeLock.release()
  })

  return {
    phase,
    barsPerChord,
    bpm: backing.bpm,
    guitarType: backing.guitarType,
    isLoading: backing.isLoading,
    loadError: backing.loadError,
    barInChord: backing.barInChord,
    round,
    activeChordIndex,
    canStart,
    setBarsPerChord,
    setGuitarType,
    start,
    stop,
    nextRound,
    adjustBpm,
  }
}
