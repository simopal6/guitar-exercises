import type { ScalePatternNote } from './pattern'

/** Root of the major scale's "E-shape" box: 6th string, 3rd fret (2nd finger). */
export const MAJOR_E_SHAPE_ROOT: ScalePatternNote = { string: 6, fret: 3 }

/** Every position of this shape — identical for every modal reading of it (Ionian, Dorian, Phrygian, ...), only the root (and so the degrees/colors) differs. */
export const MAJOR_E_SHAPE_NOTES: ScalePatternNote[] = [
  { string: 6, fret: 2 },
  { string: 6, fret: 3 },
  { string: 6, fret: 5 },
  { string: 5, fret: 2 },
  { string: 5, fret: 3 },
  { string: 5, fret: 5 },
  { string: 4, fret: 2 },
  { string: 4, fret: 4 },
  { string: 4, fret: 5 },
  { string: 3, fret: 2 },
  { string: 3, fret: 4 },
  { string: 3, fret: 5 },
  { string: 2, fret: 3 },
  { string: 2, fret: 5 },
  { string: 1, fret: 2 },
  { string: 1, fret: 3 },
  { string: 1, fret: 5 },
]
