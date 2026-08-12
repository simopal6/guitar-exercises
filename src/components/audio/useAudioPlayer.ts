import type { Pitch } from '../../theory'
import { noteNameToPitch, pitchToMidi } from '../../theory'

export type NoteInput = number | Pitch | string

export interface AudioPlayer {
  /** Plays a single note, given a MIDI number, a Pitch, or a note name like "C#4". */
  playNote(note: NoteInput, durationSeconds?: number): Promise<void>
  dispose(): void
}

function resolveMidi(note: NoteInput): number {
  if (typeof note === 'number') return note
  if (typeof note === 'string') return pitchToMidi(noteNameToPitch(note))
  return pitchToMidi(note)
}

/**
 * Minimal Tone.js-backed audio player, kept intentionally thin: no sub-app
 * uses it yet, but the interval-recognition and audio-based sub-apps planned
 * for later will build on this. Tone is dynamically imported inside
 * playNote() so it never enters the initial bundle until actually used.
 */
export function useAudioPlayer(): AudioPlayer {
  let synth: import('tone').Synth | null = null

  async function ensureSynth() {
    const Tone = await import('tone')
    await Tone.start() // must run from a user gesture (e.g. a click handler)
    if (!synth) {
      synth = new Tone.Synth().toDestination()
    }
    return { Tone, synth }
  }

  async function playNote(note: NoteInput, durationSeconds = 0.8): Promise<void> {
    const { Tone, synth: activeSynth } = await ensureSynth()
    const frequency = Tone.Frequency(resolveMidi(note), 'midi').toFrequency()
    activeSynth.triggerAttackRelease(frequency, durationSeconds)
  }

  function dispose(): void {
    synth?.dispose()
    synth = null
  }

  return { playNote, dispose }
}
