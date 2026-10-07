import type { FretPosition, Scale, Tuning } from '../../theory'
import { positionToMidi, positionToNoteName, scaleDegree } from '../../theory'
import { stringToIndex, type ScalePattern } from './pattern'
import { colorForDegree } from './degreeColors'

export interface DerivedNote {
  stringIndex: number // 0..5, array index (low E = 0), the theory/engine convention
  fret: number
  noteName: string
  degree: number // 1..7
  color: string
  midi: number // used to order notes by pitch and to compute degree
}

function toPosition(note: { string: number; fret: number }): FretPosition {
  return { stringIndex: stringToIndex(note.string), fret: note.fret }
}

/** Derives note name, scale degree and color for every note of a pattern — the only thing a pattern's author provides is positions + which one is the root + which scale. */
export function derivePatternNotes(pattern: ScalePattern, scale: Scale, tuning: Tuning): DerivedNote[] {
  const rootMidi = positionToMidi(tuning, toPosition(pattern.root))
  return pattern.notes.map((note) => {
    const position = toPosition(note)
    const midi = positionToMidi(tuning, position)
    const degree = scaleDegree(scale, midi - rootMidi)
    return {
      stringIndex: position.stringIndex,
      fret: position.fret,
      noteName: positionToNoteName(tuning, position),
      degree,
      color: colorForDegree(degree),
      midi,
    }
  })
}
