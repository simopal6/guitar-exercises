import { computed, onUnmounted, ref, watch } from 'vue'
import { STANDARD_TUNING, SCALES } from '../../../theory'
import { clampBpm, useMetronome } from '../../../components/audio/useMetronome'
import { useWakeLock } from '../../../composables/useWakeLock'
import { PATTERNS } from '../patterns'
import { STANDARD_BOX_SIZE } from '../pattern'
import { derivePatternNotes, dropRedundantMarginNotes, rootMidiOf } from '../patternNotes'
import { findCompleteOctaves, type ScaleOctave } from '../octaves'
import { buildUpDownSequence } from '../sequence'
import { getPatternTempo, setPatternTempo } from '../patternTempoStore'

const BPM_STEP = 10
const DEFAULT_BPM = 80

export type PracticePhase = 'setup' | 'running'
/** "forma" = the whole box, up and down (today's only mode). "scala" = one root-to-root octave. */
export type PracticeMode = 'forma' | 'scala'

/**
 * No session timer, no score: this is a practice driver, not a timed/scored
 * exercise — it just loops the current pattern until the player stops it.
 */
export function useScalePractice() {
  const patternId = ref<string | null>(PATTERNS[0]?.id ?? null)
  const phase = ref<PracticePhase>('setup')
  const mode = ref<PracticeMode>('forma')
  const selectedOctaveIndex = ref(0)
  const currentStep = ref(0)

  const metronome = useMetronome(DEFAULT_BPM)
  const bpm = metronome.bpm
  const wakeLock = useWakeLock()
  let unsubscribeBeat: (() => void) | null = null

  const selectedPattern = computed(() => PATTERNS.find((p) => p.id === patternId.value) ?? null)

  const notes = computed(() => {
    const pattern = selectedPattern.value
    if (!pattern) return []
    const scale = SCALES.find((s) => s.id === pattern.scaleId)
    if (!scale) return []
    const derived = derivePatternNotes(pattern, scale, STANDARD_TUNING)
    const boxStart = pattern.root.fret - pattern.rootOffsetInBox
    const boxEnd = boxStart + STANDARD_BOX_SIZE - 1
    return dropRedundantMarginNotes(derived, boxStart, boxEnd).sort((a, b) => a.midi - b.midi)
  })

  // Distinct pitches, not notes: two dots can share the same pitch (see
  // dropRedundantMarginNotes) when a scale tone stretches past the standard
  // box on two different strings at once — that's still ONE step to the
  // metronome, highlighting every dot at that pitch together.
  const distinctMidis = computed(() => [...new Set(notes.value.map((n) => n.midi))])

  // Every root-to-root (12-semitone) span within the pattern where all 7
  // degrees are actually present — derived from the notes, never hand-written.
  const completeOctaves = computed<ScaleOctave[]>(() => {
    const pattern = selectedPattern.value
    const scale = pattern ? SCALES.find((s) => s.id === pattern.scaleId) : undefined
    if (!pattern || !scale) return []
    return findCompleteOctaves(distinctMidis.value, rootMidiOf(pattern, STANDARD_TUNING), scale.formula)
  })
  const selectedOctave = computed<ScaleOctave | null>(() => completeOctaves.value[selectedOctaveIndex.value] ?? null)

  // What one period of the up/down loop steps through: the whole box in
  // "forma" mode (today's only behavior, unchanged), or just the pitches
  // inside the chosen octave in "scala" mode — buildUpDownSequence itself
  // doesn't change, it only ever cycles through whatever list it's given.
  const stepMidis = computed(() => {
    if (mode.value !== 'scala') return distinctMidis.value
    const octave = selectedOctave.value
    if (!octave) return []
    return distinctMidis.value.filter((midi) => midi >= octave.lowMidi && midi <= octave.highMidi)
  })
  const sequence = computed(() => buildUpDownSequence(stepMidis.value.length))
  const currentMidi = computed<number | null>(() => {
    if (stepMidis.value.length === 0) return null
    const index = sequence.value[currentStep.value % sequence.value.length]
    return index === undefined ? null : (stepMidis.value[index] ?? null)
  })

  const canStart = computed(() => stepMidis.value.length > 0)
  const rootFret = computed(() => selectedPattern.value?.root.fret ?? 0)
  const rootOffsetInBox = computed(() => selectedPattern.value?.rootOffsetInBox ?? 0)

  // "Forma" and "Scala" (and each octave within "Scala") are different
  // exercises of different difficulty, so each remembers its own tempo.
  function tempoKey(): string | null {
    if (!patternId.value) return null
    if (mode.value === 'forma') return `${patternId.value}:forma`
    const octave = selectedOctave.value
    return octave ? `${patternId.value}:scala:${octave.lowMidi}-${octave.highMidi}` : null
  }

  // Plain ref, refreshed explicitly rather than a computed() over
  // getPatternTempo(): a computed only re-runs when its *reactive* deps
  // change, and it has no way to notice that setPatternTempo() wrote to
  // localStorage (same issue as chord-trainer's bestScore preview).
  const patternBpmPreview = ref(DEFAULT_BPM)
  function refreshPatternBpmPreview() {
    const key = tempoKey()
    patternBpmPreview.value = key ? (getPatternTempo(key) ?? DEFAULT_BPM) : DEFAULT_BPM
  }
  watch([patternId, mode, selectedOctaveIndex], refreshPatternBpmPreview, { immediate: true })

  async function start() {
    if (!canStart.value) return
    currentStep.value = 0
    const key = tempoKey()
    metronome.setBpm((key ? getPatternTempo(key) : undefined) ?? DEFAULT_BPM)
    await wakeLock.request() // same user gesture that unlocks the metronome's audio context
    await metronome.start()
    unsubscribeBeat = metronome.onBeat(() => {
      currentStep.value = (currentStep.value + 1) % sequence.value.length
    })
    phase.value = 'running'
  }

  function stop() {
    unsubscribeBeat?.()
    unsubscribeBeat = null
    metronome.stop()
    wakeLock.release()
    phase.value = 'setup'
  }

  function adjustBpm(steps: number) {
    const key = tempoKey()
    if (!key) return
    const next = clampBpm(bpm.value + steps * BPM_STEP)
    metronome.setBpm(next)
    setPatternTempo(key, next)
    refreshPatternBpmPreview()
  }

  function selectPattern(id: string) {
    if (phase.value !== 'setup') return
    patternId.value = id
    selectedOctaveIndex.value = 0 // a different pattern has a different set of octaves
  }

  function selectMode(next: PracticeMode) {
    if (phase.value !== 'setup') return
    mode.value = next
  }

  function selectOctave(index: number) {
    if (phase.value !== 'setup') return
    selectedOctaveIndex.value = index
  }

  onUnmounted(() => {
    unsubscribeBeat?.()
    metronome.dispose()
    wakeLock.release() // covers navigating away from the screen mid-practice
  })

  return {
    phase,
    patternId,
    selectedPattern,
    mode,
    completeOctaves,
    selectedOctaveIndex,
    notes,
    currentMidi,
    rootFret,
    rootOffsetInBox,
    bpm,
    patternBpmPreview,
    canStart,
    start,
    stop,
    adjustBpm,
    selectPattern,
    selectMode,
    selectOctave,
  }
}
