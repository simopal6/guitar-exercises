import { triadFifth, type PitchClass, type TriadQuality } from '../../../theory'

/** One bar of 4/4 in eighth notes: every pattern below is indexed by this step (0..7). */
export const STEPS_PER_BAR = 8

export interface DrumHit {
  drum: 'kick' | 'snare' | 'hihat'
  velocity: number
}

/** Plain rock beat: kick on 1 and 3 (plus a ghost on the "and" of 3), snare on 2 and 4, hi-hat on every eighth, accented on the beat. */
export function drumHits(step: number): DrumHit[] {
  const hits: DrumHit[] = []
  if (step === 0 || step === 4) hits.push({ drum: 'kick', velocity: 1 })
  if (step === 5) hits.push({ drum: 'kick', velocity: 0.55 })
  if (step === 2 || step === 6) hits.push({ drum: 'snare', velocity: 0.95 })
  hits.push({ drum: 'hihat', velocity: step % 2 === 0 ? 0.7 : 0.4 })
  return hits
}

/** Lowest bass root: E1. Every root lands in E1..D#2, like the prototype. */
const BASS_LOW_E = 28

/**
 * Eighth-note bass line per bar: root ×4, fifth ×2, octave, root. The fifth
 * follows the chord (a diminished triad has a diminished fifth, 6 semitones)
 * so the bass never clashes with the guitar.
 */
export function bassNote(step: number, root: PitchClass, quality: TriadQuality): { midi: number; velocity: number } {
  const rootMidi = BASS_LOW_E + ((root - 4 + 12) % 12)
  const fifth = rootMidi + triadFifth(quality)
  const line = [rootMidi, rootMidi, rootMidi, rootMidi, fifth, fifth, rootMidi + 12, rootMidi]
  return { midi: line[step], velocity: step === 0 || step === 4 ? 0.95 : 0.75 }
}

export type StrumDirection = 'down' | 'up'

/** Guitar rhythm on the eighths: down, –, down-up, –, up-down-up. */
const STRUM: (StrumDirection | null)[] = ['down', null, 'down', 'up', null, 'up', 'down', 'up']

export function strumAt(step: number): StrumDirection | null {
  return STRUM[step]
}
