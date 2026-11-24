import { modeScale, positionToMidi, STANDARD_TUNING, type PitchClass } from '../../theory'
import { MAJOR_E_SHAPE_NOTES, MAJOR_E_SHAPE_ROOT } from '../../components/scale-box/majorEShape'
import { MAJOR_A_SHAPE_NOTES, MAJOR_A_SHAPE_ROOT } from '../../components/scale-box/majorAShape'
import { STANDARD_BOX_SIZE, stringToIndex, type ScalePatternNote } from '../../components/scale-box/pattern'
import { derivePatternNotes, dropRedundantMarginNotes, type DerivedNote } from '../../components/scale-box/patternNotes'

export type MajorShapeId = 'e' | 'a'

export interface MajorShape {
  id: MajorShapeId
  label: string
  /** Where the shape is written: the key's root, at this position. */
  root: ScalePatternNote
  notes: ScalePatternNote[]
  /** The root's row within the 4-fret box (0 = first fret). */
  rootOffsetInBox: number
}

/** The major scale shapes this exercise can use, in setup order. Both are written in a box starting at the 2nd fret. */
export const MAJOR_SHAPES: MajorShape[] = [
  { id: 'e', label: 'Scala maggiore (3)', root: MAJOR_E_SHAPE_ROOT, notes: MAJOR_E_SHAPE_NOTES, rootOffsetInBox: 1 },
  { id: 'a', label: 'Scala maggiore (10)', root: MAJOR_A_SHAPE_ROOT, notes: MAJOR_A_SHAPE_NOTES, rootOffsetInBox: 3 },
]

/** Lowest fret a box may start on: any lower and it would touch the nut. */
const LOWEST_BOX_START = 2

export interface KeyBox {
  /** Fret of the key's root on the shape's root string: 3..14 for the E-shape (6th string), 5..16 for the A-shape (5th string). */
  keyFret: number
  /** The key's root row within the 4-fret box. */
  rootOffsetInBox: number
  /** The shape's box, moved so its root is the key's. */
  notes: ScalePatternNote[]
}

/** The chosen shape's box moved to `keyRoot`, so that it starts between the 2nd and 13th fret and never touches the nut. */
export function keyBox(keyRoot: PitchClass, shapeId: MajorShapeId = 'e'): KeyBox {
  const shape = MAJOR_SHAPES.find((s) => s.id === shapeId)!
  const openPitchClass = STANDARD_TUNING[stringToIndex(shape.root.string)] % 12
  let keyFret = (keyRoot - openPitchClass + 12) % 12
  if (keyFret < LOWEST_BOX_START + shape.rootOffsetInBox) keyFret += 12
  const shift = keyFret - shape.root.fret
  return {
    keyFret,
    rootOffsetInBox: shape.rootOffsetInBox,
    notes: shape.notes.map((n) => ({ string: n.string, fret: n.fret + shift })),
  }
}

/**
 * The same box, read as the mode on `degree`: degree 1 (red) is the chord's
 * root, not the key's, and every other note is numbered and marked (b/#)
 * relative to that mode.
 */
export function modeBoxNotes(box: KeyBox, degree: number, chordRoot: PitchClass): DerivedNote[] {
  const root = box.notes.find((n) => positionToMidi(STANDARD_TUNING, { stringIndex: stringToIndex(n.string), fret: n.fret }) % 12 === chordRoot)
  if (!root) throw new RangeError(`chord root ${chordRoot} is not in the key's box`)
  const derived = derivePatternNotes({ notes: box.notes, root }, modeScale(degree), STANDARD_TUNING)
  const boxStart = box.keyFret - box.rootOffsetInBox
  return dropRedundantMarginNotes(derived, boxStart, boxStart + STANDARD_BOX_SIZE - 1)
}
