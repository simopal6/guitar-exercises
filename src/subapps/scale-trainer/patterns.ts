import { MAJOR_SCALE, MAJOR_PENTATONIC_SCALE, DORIAN_SCALE } from '../../theory'
import type { ScalePattern, ScalePatternNote } from './pattern'

const patternARoot: ScalePatternNote = { string: 6, fret: 3 }

/** Every position of this shape — identical for the Ionian and Dorian readings of it, only the root (and so the degrees/colors) differs. */
const shapeANotes: ScalePatternNote[] = [
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

/** First major scale position, root on the 6th string (2nd finger). Hand-written, as most patterns will be. */
const patternA: ScalePattern = {
  id: 'major-e-shape',
  shapeId: 'major-e-shape',
  scaleId: MAJOR_SCALE.id,
  label: 'Scala maggiore (1)',
  scaleLabel: 'Ionian (I)',
  root: patternARoot,
  rootOffsetInBox: 1, // root is the box's 2nd fret (box = [2,5] for this root)
  notes: shapeANotes,
}

/**
 * Same shape as "Scala maggiore (1)" (same 17 positions), read from its 2nd
 * degree instead (6th string, 4th finger) — the major scale's own Dorian
 * mode, so every note keeps its usual degree color, with degrees 3 and 7
 * marked flat (see Scale.flats on DORIAN_SCALE).
 */
const patternDorian: ScalePattern = {
  id: 'major-e-shape-dorian',
  shapeId: 'major-e-shape',
  scaleId: DORIAN_SCALE.id,
  label: 'Scala maggiore (1)',
  scaleLabel: 'Dorian (II)',
  root: { string: 6, fret: 5 },
  rootOffsetInBox: 3, // root is the box's 4th fret (box = [2,5] for this root)
  notes: shapeANotes,
}

/**
 * The same shape as "Scala maggiore (1)" (same root, same box), with the
 * notes that are only in the major scale (degrees 4 and 7) removed, since
 * the major pentatonic scale doesn't include them.
 */
const patternPentatonic: ScalePattern = {
  id: 'major-pentatonic',
  shapeId: 'major-pentatonic',
  scaleId: MAJOR_PENTATONIC_SCALE.id,
  label: 'Pentatonica',
  scaleLabel: 'Pentatonica maggiore',
  root: patternARoot,
  rootOffsetInBox: 1,
  notes: [
    { string: 6, fret: 3 },
    { string: 6, fret: 5 },
    { string: 5, fret: 2 },
    { string: 5, fret: 5 },
    { string: 4, fret: 2 },
    { string: 4, fret: 5 },
    { string: 3, fret: 2 },
    { string: 3, fret: 4 },
    { string: 2, fret: 3 },
    { string: 2, fret: 5 },
    { string: 1, fret: 3 },
    { string: 1, fret: 5 },
  ],
}

/** Every pattern the app knows about — add new patterns here as they're written. Order here is the order the "Scala" row lists them in. */
export const PATTERNS: ScalePattern[] = [patternA, patternDorian, patternPentatonic]

export interface ScaleShape {
  id: string
  label: string
}

/** Every distinct shape, derived from PATTERNS — a shape may offer more than one scale. */
export const SHAPES: ScaleShape[] = [
  ...new Map(PATTERNS.map((p) => [p.shapeId, { id: p.shapeId, label: p.label }])).values(),
]
