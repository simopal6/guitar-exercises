export interface ScalePatternNote {
  /** Guitarist string number, 6..1 (6 = low E, 1 = high e) — same convention as
   *  Barre.fromString/toString in chord-trainer/chord.ts, so patterns can be
   *  copied straight from printed course material. */
  string: number
  /** Absolute fret (0 = open string). */
  fret: number
}

export interface ScalePattern {
  id: string
  scaleId: string
  label: string
  notes: ScalePatternNote[]
  /** Which position is the root — the reference pitch for degree calculation. Not necessarily listed first in `notes`. */
  root: ScalePatternNote
}

/**
 * 6..1 (guitarist numbering) -> 0..5 (array index, low E = 0) — the same
 * formula as guitarStringNumberToIndex in chord-trainer/chord.ts, duplicated
 * here (one line) rather than imported across sub-apps (no sub-app in this
 * project imports from another; see src/shell/subapps.ts and project notes).
 */
export function stringToIndex(stringNumber: number): number {
  return 6 - stringNumber
}
