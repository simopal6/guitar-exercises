import { readonly, ref, type Ref } from 'vue'

export interface Metronome {
  isRunning: Readonly<Ref<boolean>>
  bpm: Readonly<Ref<number>>
  /** Must be called from a user-gesture handler (Tone.start() requirement). */
  start(): Promise<void>
  stop(): void
  /** Live change, no restart, no audible glitch — Transport retimes future ticks on its own. */
  setBpm(bpm: number): void
  dispose(): void
}

const MIN_BPM = 20 // technical floor only, per spec — no pedagogical minimum/maximum

function clampBpm(bpm: number): number {
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

  let Tone: typeof import('tone') | null = null
  let synth: import('tone').MembraneSynth | null = null
  let loop: import('tone').Loop | null = null

  async function ensureEngine(): Promise<typeof import('tone')> {
    if (!Tone) Tone = await import('tone')
    await Tone.start() // no-op if the context is already running
    if (!synth) {
      // Short, percussive, no samples: fast pitch decay + zero sustain reads as a click, not a tone.
      synth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
      }).toDestination()
    }
    if (!loop) {
      // Interval given in musical time ('4n' = one quarter note), not
      // milliseconds: Transport recomputes real-world tick times from its
      // own bpm, so the Loop callback never needs to know the current bpm.
      loop = new Tone.Loop((time) => {
        synth?.triggerAttackRelease('C2', '16n', time)
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

  function dispose(): void {
    stop()
    loop?.dispose()
    synth?.dispose()
    loop = null
    synth = null
    Tone = null
  }

  return {
    isRunning: readonly(isRunning),
    bpm: readonly(bpm),
    start,
    stop,
    setBpm,
    dispose,
  }
}
