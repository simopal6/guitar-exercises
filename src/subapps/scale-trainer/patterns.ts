import { MAJOR_SCALE, STANDARD_TUNING } from '../../theory'
import { generateScaleBoxNotes } from './generateScaleBox'
import type { ScalePattern, ScalePatternNote } from './pattern'

const patternARoot: ScalePatternNote = { string: 6, fret: 3 }

/** First major scale position, root on the 6th string. Hand-written, as most patterns will be. */
const patternA: ScalePattern = {
  id: 'major-e-shape',
  scaleId: MAJOR_SCALE.id,
  label: 'Scala maggiore (1)',
  root: patternARoot,
  rootOffsetInBox: 1, // root is the box's 2nd fret (box = [2,5] for this root)
  notes: [
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
  ],
}

const patternBRoot: ScalePatternNote = { string: 5, fret: 7 }

/** Second major scale position, root on the 5th string — generated from the root + a fret window, to exercise generateScaleBoxNotes. */
const patternB: ScalePattern = {
  id: 'major-a-shape',
  scaleId: MAJOR_SCALE.id,
  label: 'Scala maggiore (2)',
  root: patternBRoot,
  rootOffsetInBox: 3, // root is the box's last (4th) fret, bordering the far margin (box = [4,7] for this root)
  // [boxStart-1, boxStart+4]: the full 6-fret window the diagram renders
  // (4-fret standard box + 1 margin fret on each side), kept in sync so the
  // whole window is populated instead of leaving a margin empty.
  notes: generateScaleBoxNotes(STANDARD_TUNING, MAJOR_SCALE, patternBRoot, 3, 8),
}

const patternCRoot: ScalePatternNote = { string: 6, fret: 4 }

/**
 * Third major scale position, root on the 6th string, box touching the nut.
 * Its standard box [1,4] is a fret away from a well-known standard-tuning
 * coincidence: strings 4 and 3 are a perfect fourth apart (5 frets), the same
 * distance as the box's far margin to its near margin — so the scale tone
 * that stretches past the box on one side (string 4) always reappears,
 * identical in pitch, stretching past it on the other side too (string 3).
 * Both are kept (see dropRedundantMarginNotes — it only drops a margin note
 * that duplicates one already inside the box, not margin-vs-margin).
 */
const patternC: ScalePattern = {
  id: 'major-scale-3',
  scaleId: MAJOR_SCALE.id,
  label: 'Scala maggiore (3)',
  root: patternCRoot,
  rootOffsetInBox: 3, // root is the box's last (4th) fret (box = [1,4] for this root)
  notes: generateScaleBoxNotes(STANDARD_TUNING, MAJOR_SCALE, patternCRoot, 0, 5),
}

/** Every pattern the app knows about — add new patterns here as they're written. */
export const PATTERNS: ScalePattern[] = [patternA, patternB, patternC]
