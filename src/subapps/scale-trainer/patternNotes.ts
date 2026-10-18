import type { FretPosition, Scale, Tuning } from '../../theory'
import { positionToMidi, positionToNoteName, scaleDegree, scaleDegreeIsFlat } from '../../theory'
import { stringToIndex, type ScalePattern } from './pattern'
import { colorForDegree } from './degreeColors'

export interface DerivedNote {
  stringIndex: number // 0..5, array index (low E = 0), the theory/engine convention
  fret: number
  noteName: string
  degree: number // 1..7
  /** True for a degree flattened relative to the major scale (e.g. Dorian's b3/b7) — shown as a "b" marker, the color itself still follows the plain degree. */
  flat: boolean
  color: string
  midi: number // used to order notes by pitch and to compute degree
}

function toPosition(note: { string: number; fret: number }): FretPosition {
  return { stringIndex: stringToIndex(note.string), fret: note.fret }
}

/** The pattern's declared root, as a MIDI pitch — the reference every degree/octave calculation is anchored to. */
export function rootMidiOf(pattern: ScalePattern, tuning: Tuning): number {
  return positionToMidi(tuning, toPosition(pattern.root))
}

/** Derives note name, scale degree and color for every note of a pattern — the only thing a pattern's author provides is positions + which one is the root + which scale. */
export function derivePatternNotes(pattern: ScalePattern, scale: Scale, tuning: Tuning): DerivedNote[] {
  const rootMidi = rootMidiOf(pattern, tuning)
  return pattern.notes.map((note) => {
    const position = toPosition(note)
    const midi = positionToMidi(tuning, position)
    const degree = scaleDegree(scale, midi - rootMidi)
    return {
      stringIndex: position.stringIndex,
      fret: position.fret,
      noteName: positionToNoteName(tuning, position),
      degree,
      flat: scaleDegreeIsFlat(scale, midi - rootMidi),
      color: colorForDegree(degree),
      midi,
    }
  })
}

/**
 * A margin note (outside [boxStart, boxEnd]) is only meant to show a genuine
 * "stretch" pitch not reachable inside the standard box. Standard guitar
 * tuning means the same pitch often also appears on another string within
 * the box — when it does, the margin copy adds nothing but clutter, so it's
 * dropped (the pitch is already fully represented by its box occurrence).
 */
export function dropRedundantMarginNotes(notes: DerivedNote[], boxStart: number, boxEnd: number): DerivedNote[] {
  const isInBox = (note: DerivedNote) => note.fret >= boxStart && note.fret <= boxEnd
  const midisInBox = new Set(notes.filter(isInBox).map((note) => note.midi))
  return notes.filter((note) => isInBox(note) || !midisInBox.has(note.midi))
}
