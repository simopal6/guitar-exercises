import type { FretPosition, Tuning } from '../../theory'
import { STANDARD_TUNING, positionToNoteName } from '../../theory'

/** Numeric 1-4 for index/middle/ring/pinky; 'T' for thumb. */
export type FingerLabel = 1 | 2 | 3 | 4 | 'T'

/** 'x' = muted string; otherwise an absolute fret number (0 = open). */
export type StringFret = number | 'x'

export interface Barre {
  fret: number
  /** Guitar string NUMBERS, 6..1 (6 = low E, 1 = high e) — NOT array indices. */
  fromString: number
  toString: number
  finger?: FingerLabel
}

export interface Chord {
  id: string
  name: string
  variant?: string
  /** Array-INDEX convention: index 0..5 = string 6..1 (low E → high e), the
   *  same "index 0 = lowest string" convention as theory's Tuning/FretPosition. */
  strings?: readonly [StringFret, StringFret, StringFret, StringFret, StringFret, StringFret]
  /** 6 entries aligned to `strings` BY ARRAY INDEX, not by guitar string number. */
  fingers?: readonly [
    FingerLabel | null,
    FingerLabel | null,
    FingerLabel | null,
    FingerLabel | null,
    FingerLabel | null,
    FingerLabel | null,
  ]
  /** Purely graphical: never used to compute the sounding note. Absent = no barre. */
  barres?: Barre[]
}

export interface ChordList {
  id: string
  name: string
  chords: Chord[]
}

/**
 * Converts a 1-indexed, low-to-high-reversed guitar string number (6 = low E
 * ... 1 = high e, as printed on tab/chord charts) into the 0-indexed,
 * low-to-high array index used by `strings`/`fingers` (and FretPosition).
 * Use this ONLY when interpreting Barre.fromString/toString — every other
 * field in this module is already in array-index space.
 */
export function guitarStringNumberToIndex(stringNumber: number): number {
  return 6 - stringNumber
}

/** The barre is purely graphical: the sounding position is always strings[i], never the barre's fret. */
export function soundingPosition(chord: Chord, stringIndex: number): FretPosition | null {
  const fret = chord.strings?.[stringIndex]
  if (fret === undefined || fret === 'x') return null
  return { stringIndex, fret }
}

export function soundingNoteName(chord: Chord, stringIndex: number, tuning: Tuning = STANDARD_TUNING): string | null {
  const pos = soundingPosition(chord, stringIndex)
  return pos ? positionToNoteName(tuning, pos) : null
}
