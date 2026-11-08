import { MAJOR_SCALE, MAJOR_PENTATONIC_SCALE, DORIAN_SCALE, PHRYGIAN_SCALE, LYDIAN_SCALE, MIXOLYDIAN_SCALE, AEOLIAN_SCALE, LOCRIAN_SCALE, MINOR_PENTATONIC_SCALE } from '../../theory'
import type { ScalePattern } from './pattern'
import type { ScalePatternNote } from '../../components/scale-box/pattern'
import { MAJOR_E_SHAPE_NOTES, MAJOR_E_SHAPE_ROOT } from '../../components/scale-box/majorEShape'

const patternARoot = MAJOR_E_SHAPE_ROOT
const shapeANotes = MAJOR_E_SHAPE_NOTES

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
  scaleLabel: 'Dorian (ii)',
  root: { string: 6, fret: 5 },
  rootOffsetInBox: 3, // root is the box's 4th fret (box = [2,5] for this root)
  notes: shapeANotes,
}

/**
 * Same shape again, read from its 3rd degree (5th string, 1st finger) — the
 * major scale's Phrygian mode: degrees 2, 3, 6 and 7 marked flat.
 */
const patternPhrygian: ScalePattern = {
  id: 'major-e-shape-phrygian',
  shapeId: 'major-e-shape',
  scaleId: PHRYGIAN_SCALE.id,
  label: 'Scala maggiore (1)',
  scaleLabel: 'Phrygian (iii)',
  root: { string: 5, fret: 2 },
  rootOffsetInBox: 0, // root is the box's 1st fret (box = [2,5] for this root)
  notes: shapeANotes,
}

/**
 * The other four modes of the same shape, each read from its own root — the
 * lowest place that root falls inside the box: Lydian on the 5th string's 2nd
 * finger (#4 marked), Mixolydian on the 5th string's 4th finger (b7),
 * Aeolian on the 4th string's 1st finger (b3, b6, b7), Locrian on the 6th
 * string's 1st finger (b2, b3, b5, b6, b7).
 */
function eShapeMode(id: string, scaleId: string, scaleLabel: string, root: ScalePatternNote): ScalePattern {
  return {
    id: `major-e-shape-${id}`,
    shapeId: 'major-e-shape',
    scaleId,
    label: 'Scala maggiore (1)',
    scaleLabel,
    root,
    rootOffsetInBox: root.fret - 2, // box = [2,5], as for every reading of this shape
    notes: shapeANotes,
  }
}

const patternLydian = eShapeMode('lydian', LYDIAN_SCALE.id, 'Lydian (IV)', { string: 5, fret: 3 })
const patternMixolydian = eShapeMode('mixolydian', MIXOLYDIAN_SCALE.id, 'Mixolydian (V)', { string: 5, fret: 5 })
const patternAeolian = eShapeMode('aeolian', AEOLIAN_SCALE.id, 'Aeolian (vi)', { string: 4, fret: 2 })
const patternLocrian = eShapeMode('locrian', LOCRIAN_SCALE.id, 'Locrian (vii°)', { string: 6, fret: 2 })

/** Every position of the "Pentatonica" shape — shared by its major and minor readings. */
const pentatonicNotes: ScalePatternNote[] = [
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
]

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
  notes: pentatonicNotes,
}

/**
 * The "Pentatonica" shape again (same 12 positions), read from its relative
 * minor root (4th string, 1st finger): degrees 3 and 7 marked flat.
 */
const patternMinorPentatonic: ScalePattern = {
  id: 'minor-pentatonic',
  shapeId: 'major-pentatonic',
  scaleId: MINOR_PENTATONIC_SCALE.id,
  label: 'Pentatonica',
  scaleLabel: 'Pentatonica minore',
  root: { string: 4, fret: 2 },
  rootOffsetInBox: 0, // root is the box's 1st fret (box = [2,5] for this root)
  notes: pentatonicNotes,
}

/** Every pattern the app knows about — add new patterns here as they're written. Order here is the order the "Scala" row lists them in. */
export const PATTERNS: ScalePattern[] = [
  patternA,
  patternDorian,
  patternPhrygian,
  patternLydian,
  patternMixolydian,
  patternAeolian,
  patternLocrian,
  patternPentatonic,
  patternMinorPentatonic,
]

export interface ScaleShape {
  id: string
  label: string
}

/** Every distinct shape, derived from PATTERNS — a shape may offer more than one scale. */
export const SHAPES: ScaleShape[] = [
  ...new Map(PATTERNS.map((p) => [p.shapeId, { id: p.shapeId, label: p.label }])).values(),
]
