/**
 * Chromatic pitch classes, 0 = C, using sharps only (no enharmonic spelling).
 */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export const NOTE_NAMES: readonly string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
]

/** A pitch class plus a scientific-pitch-notation octave (C4 = MIDI 60). */
export interface Pitch {
  pitchClass: PitchClass
  octave: number
}

export function pitchClassName(pitchClass: PitchClass): string {
  return NOTE_NAMES[pitchClass]
}

export function midiToPitch(midi: number): Pitch {
  const pitchClass = (((midi % 12) + 12) % 12) as PitchClass
  const octave = Math.floor(midi / 12) - 1
  return { pitchClass, octave }
}

export function pitchToMidi(pitch: Pitch): number {
  return (pitch.octave + 1) * 12 + pitch.pitchClass
}

/** e.g. "C#4" */
export function noteName(pitch: Pitch): string {
  return `${pitchClassName(pitch.pitchClass)}${pitch.octave}`
}

/** Inverse of noteName(); accepts sharps only (e.g. "C#4"), matching NOTE_NAMES. */
export function noteNameToPitch(name: string): Pitch {
  const match = /^([A-G]#?)(-?\d+)$/.exec(name)
  if (!match) throw new Error(`invalid note name: ${name}`)
  const [, letterAndSharp, octaveStr] = match
  const pitchClass = NOTE_NAMES.indexOf(letterAndSharp)
  if (pitchClass === -1) throw new Error(`invalid note name: ${name}`)
  return { pitchClass: pitchClass as PitchClass, octave: Number(octaveStr) }
}
