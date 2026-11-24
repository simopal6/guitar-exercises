import type { ScalePatternNote } from './pattern'

/** Root of the major scale's "A-shape" box: 5th string, 5th fret (4th finger, the box's last fret). */
export const MAJOR_A_SHAPE_ROOT: ScalePatternNote = { string: 5, fret: 5 }

/** Every position of this shape — identical for every modal reading of it, only the root (and so the degrees/colors) differs. */
export const MAJOR_A_SHAPE_NOTES: ScalePatternNote[] = [
  { string: 6, fret: 2 },
  { string: 6, fret: 3 },
  { string: 6, fret: 5 },
  { string: 5, fret: 2 },
  { string: 5, fret: 4 },
  { string: 5, fret: 5 },
  { string: 4, fret: 2 },
  { string: 4, fret: 4 },
  { string: 4, fret: 5 },
  { string: 3, fret: 2 },
  { string: 3, fret: 4 },
  { string: 2, fret: 2 },
  { string: 2, fret: 3 },
  { string: 2, fret: 5 },
  { string: 1, fret: 2 },
  { string: 1, fret: 3 },
  { string: 1, fret: 5 },
]
