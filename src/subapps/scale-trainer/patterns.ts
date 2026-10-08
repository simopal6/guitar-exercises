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

const patternBRoot: ScalePatternNote = { string: 5, fret: 5 }

/** Second major scale position, root on the 5th string — generated from the root + a fret window, to exercise generateScaleBoxNotes. */
const patternB: ScalePattern = {
  id: 'major-a-shape',
  scaleId: MAJOR_SCALE.id,
  label: 'Scala maggiore (2)',
  root: patternBRoot,
  // [rootFret-2, rootFret+3]: the full 6-fret window the diagram renders
  // (4-fret standard box + 1 margin fret on each side), kept in sync so the
  // whole window is populated instead of leaving the top margin empty.
  notes: generateScaleBoxNotes(STANDARD_TUNING, MAJOR_SCALE, patternBRoot, 3, 8),
}

/** Every pattern the app knows about — add new patterns here as they're written. */
export const PATTERNS: ScalePattern[] = [patternA, patternB]
