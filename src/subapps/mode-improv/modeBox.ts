import { modeScale, positionToMidi, STANDARD_TUNING, type PitchClass } from '../../theory'
import { MAJOR_E_SHAPE_NOTES, MAJOR_E_SHAPE_ROOT } from '../../components/scale-box/majorEShape'
import { STANDARD_BOX_SIZE, stringToIndex, type ScalePatternNote } from '../../components/scale-box/pattern'
import { derivePatternNotes, dropRedundantMarginNotes, type DerivedNote } from '../../components/scale-box/patternNotes'

/** Lowest fret the key's root may take on the 6th string: below this the box (which reaches a fret lower) would touch the nut. */
const LOWEST_KEY_FRET = 3

export interface KeyBox {
  /** Fret of the key's root on the 6th string, always 3..14. */
  keyFret: number
  /** The major scale's E-shape box, moved so its root is the key's. */
  notes: ScalePatternNote[]
}

/** The E-shape box (root on the 6th string, 3rd fret = G) moved to `keyRoot`, kept between the 3rd and 14th fret so it never touches the nut. */
export function keyBox(keyRoot: PitchClass): KeyBox {
  const lowEPitchClass = STANDARD_TUNING[0] % 12
  let keyFret = (keyRoot - lowEPitchClass + 12) % 12
  if (keyFret < LOWEST_KEY_FRET) keyFret += 12
  const shift = keyFret - MAJOR_E_SHAPE_ROOT.fret
  return { keyFret, notes: MAJOR_E_SHAPE_NOTES.map((n) => ({ string: n.string, fret: n.fret + shift })) }
}

/** Where the standard 4-fret box starts: the key's root sits on its 2nd fret, as in the untransposed shape. */
export const KEY_ROOT_OFFSET_IN_BOX = 1

/**
 * The same box, read as the mode on `degree`: degree 1 (red) is the chord's
 * root, not the key's, and every other note is numbered and marked (b/#)
 * relative to that mode.
 */
export function modeBoxNotes(box: KeyBox, degree: number, chordRoot: PitchClass): DerivedNote[] {
  const root = box.notes.find((n) => positionToMidi(STANDARD_TUNING, { stringIndex: stringToIndex(n.string), fret: n.fret }) % 12 === chordRoot)
  if (!root) throw new RangeError(`chord root ${chordRoot} is not in the key's box`)
  const derived = derivePatternNotes({ notes: box.notes, root }, modeScale(degree), STANDARD_TUNING)
  const boxStart = box.keyFret - KEY_ROOT_OFFSET_IN_BOX
  return dropRedundantMarginNotes(derived, boxStart, boxStart + STANDARD_BOX_SIZE - 1)
}
