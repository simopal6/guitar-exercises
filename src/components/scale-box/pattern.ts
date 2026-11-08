/** Number of frets in the "standard" (non-margin) box — shared by the diagram's layout and the margin-note filtering. */
export const STANDARD_BOX_SIZE = 4

export interface ScalePatternNote {
  /** Guitarist string number, 6..1 (6 = low E, 1 = high e) — same convention as
   *  Barre.fromString/toString in chord-trainer/chord.ts, so patterns can be
   *  copied straight from printed course material. */
  string: number
  /** Absolute fret (0 = open string). */
  fret: number
}

/** The minimum a box needs to be drawn: its positions, and which one is the root every degree is measured from. */
export interface BoxPattern {
  notes: ScalePatternNote[]
  /** Which position is the root — the reference pitch for degree calculation. Not necessarily listed first in `notes`. */
  root: ScalePatternNote
}

/**
 * 6..1 (guitarist numbering) -> 0..5 (array index, low E = 0) — the same
 * formula as guitarStringNumberToIndex in chord-trainer/chord.ts, duplicated
 * here (one line) rather than imported from a sub-app.
 */
export function stringToIndex(stringNumber: number): number {
  return 6 - stringNumber
}
