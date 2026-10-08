/** Number of frets in the "standard" (non-margin) box — shared by the diagram's layout and the margin-note filtering in useScalePractice. */
export const STANDARD_BOX_SIZE = 4

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
  /**
   * Where the root sits within the 4-fret standard box, as a row offset from
   * the box's lowest fret: 0 = root is the box's first (lowest) fret, 3 =
   * root is the box's last (highest) fret. This is a property of the shape
   * itself (which finger naturally lands on the root), NOT something
   * derivable from the root fret alone — e.g. an "E-shape" box typically has
   * the root on row 2, while an "A-shape" box has it on row 4.
   */
  rootOffsetInBox: number
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
