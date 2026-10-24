import { readonly, ref, type Ref } from 'vue'

export interface Metronome {
  isRunning: Readonly<Ref<boolean>>
  bpm: Readonly<Ref<number>>
  /** Must be called from a user-gesture handler (Tone.start() requirement). */
  start(): Promise<void>
  stop(): void
  /** Live change, no restart, no audible glitch — Transport retimes future ticks on its own. */
  setBpm(bpm: number): void
  /** Subscribe to each click (the same Tone.Loop/Transport driving the audio — not a second clock). Returns an unsubscribe function. */
  onBeat(callback: () => void): () => void
  dispose(): void
}

const MIN_BPM = 20 // technical floor only, per spec — no pedagogical minimum/maximum

// "Legno": a short woodblock-like tok — a triangle wave with the highs
// rounded off by a lowpass filter. Fixed pitch and duration, so it sounds
// the same at every bpm.
const CLICK_NOTE = 'E5'
const CLICK_DURATION_SECONDS = 0.05
const CLICK_FILTER_HZ = 1800
const CLICK_VOLUME_DB = 2

/** Exported so per-item tempo persistence (chordTempoStore, patternTempoStore, ...) stays consistent with what the metronome can actually play. */
export function clampBpm(bpm: number): number {
  return Math.max(MIN_BPM, Math.round(bpm))
}

/**
 * Tone.Transport-backed click engine, kept separate from useAudioPlayer.ts
 * (different concern: a scheduled percussive loop, not a one-shot pitched
 * note) but following the same architectural pattern: Tone is dynamically
 * imported so it never enters the initial bundle, and audio only starts
 * from an explicit user gesture.
 *
 * Only ONE instance of this composable should exist per exercise session —
 * Tone.Transport is a singleton on the shared audio context, so a second
 * instance's Loop would double up the clicks rather than create an
 * independent metronome.
 */
export function useMetronome(initialBpm: number): Metronome {
  const isRunning = ref(false)
  const bpm = ref(clampBpm(initialBpm))
  const beatListeners = new Set<() => void>()

  let Tone: typeof import('tone') | null = null
  let synth: import('tone').Synth | null = null
  let filter: import('tone').Filter | null = null
  let loop: import('tone').Loop | null = null

  async function ensureEngine(): Promise<typeof import('tone')> {
    if (!Tone) Tone = await import('tone')
    await Tone.start() // no-op if the context is already running
    if (!synth) {
      filter = new Tone.Filter(CLICK_FILTER_HZ, 'lowpass').toDestination()
      synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.02 },
      }).connect(filter)
      synth.volume.value = CLICK_VOLUME_DB
    }
    if (!loop) {
      // Interval given in musical time ('4n' = one quarter note), not
      // milliseconds: Transport recomputes real-world tick times from its
      // own bpm, so the Loop callback never needs to know the current bpm.
      loop = new Tone.Loop((time) => {
        // Signature is (note, duration, time). `time` MUST be passed — without
        // it Tone plays the click whenever this callback happens to run,
        // quantized to the clock's update interval: audibly irregular at high bpm.
        synth?.triggerAttackRelease(CLICK_NOTE, CLICK_DURATION_SECONDS, time)
        for (const listener of beatListeners) listener()
      }, '4n')
    }
    Tone.Transport.bpm.value = bpm.value
    return Tone
  }

  async function start(): Promise<void> {
    const T = await ensureEngine()
    if (isRunning.value) return
    loop?.start(0)
    T.Transport.start()
    isRunning.value = true
  }

  function stop(): void {
    Tone?.Transport.stop()
    loop?.stop()
    isRunning.value = false
  }

  function setBpm(next: number): void {
    const clamped = clampBpm(next)
    bpm.value = clamped
    if (Tone) Tone.Transport.bpm.value = clamped
  }

  function onBeat(callback: () => void): () => void {
    beatListeners.add(callback)
    return () => beatListeners.delete(callback)
  }

  function dispose(): void {
    stop()
    loop?.dispose()
    synth?.dispose()
    filter?.dispose()
    loop = null
    synth = null
    filter = null
    Tone = null
    beatListeners.clear()
  }

  return {
    isRunning: readonly(isRunning),
    bpm: readonly(bpm),
    start,
    stop,
    setBpm,
    onBeat,
    dispose,
  }
}
