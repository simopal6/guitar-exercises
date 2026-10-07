import { computed, onUnmounted, ref, watch } from 'vue'
import { STANDARD_TUNING, SCALES } from '../../../theory'
import { clampBpm, useMetronome } from '../../../components/audio/useMetronome'
import { useWakeLock } from '../../../composables/useWakeLock'
import { PATTERNS } from '../patterns'
import { derivePatternNotes } from '../patternNotes'
import { buildUpDownSequence } from '../sequence'
import { getPatternTempo, setPatternTempo } from '../patternTempoStore'

const BPM_STEP = 5
const DEFAULT_BPM = 60

export type PracticePhase = 'setup' | 'running'

/**
 * No session timer, no score: this is a practice driver, not a timed/scored
 * exercise — it just loops the current pattern until the player stops it.
 */
export function useScalePractice() {
  const patternId = ref<string | null>(PATTERNS[0]?.id ?? null)
  const phase = ref<PracticePhase>('setup')
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
    return derivePatternNotes(pattern, scale, STANDARD_TUNING).sort((a, b) => a.midi - b.midi)
  })

  const sequence = computed(() => buildUpDownSequence(notes.value.length))
  const currentNoteIndex = computed<number | null>(() => {
    if (notes.value.length === 0) return null
    return sequence.value[currentStep.value % sequence.value.length] ?? null
  })

  const canStart = computed(() => notes.value.length > 0)
  const rootFret = computed(() => selectedPattern.value?.root.fret ?? 0)

  // Plain ref, refreshed explicitly rather than a computed() over
  // getPatternTempo(): a computed only re-runs when its *reactive* deps
  // change, and it has no way to notice that setPatternTempo() wrote to
  // localStorage (same issue as chord-trainer's bestScore preview).
  const patternBpmPreview = ref(DEFAULT_BPM)
  function refreshPatternBpmPreview() {
    patternBpmPreview.value = patternId.value ? (getPatternTempo(patternId.value) ?? DEFAULT_BPM) : DEFAULT_BPM
  }
  watch(patternId, refreshPatternBpmPreview, { immediate: true })

  async function start() {
    if (!canStart.value || !patternId.value) return
    currentStep.value = 0
    metronome.setBpm(getPatternTempo(patternId.value) ?? DEFAULT_BPM)
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
    if (!patternId.value) return
    const next = clampBpm(bpm.value + steps * BPM_STEP)
    metronome.setBpm(next)
    setPatternTempo(patternId.value, next)
    refreshPatternBpmPreview()
  }

  function selectPattern(id: string) {
    if (phase.value !== 'setup') return
    patternId.value = id
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
    notes,
    currentNoteIndex,
    rootFret,
    bpm,
    patternBpmPreview,
    canStart,
    start,
    stop,
    adjustBpm,
    selectPattern,
  }
}
