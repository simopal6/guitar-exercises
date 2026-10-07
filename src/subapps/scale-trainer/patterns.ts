import { MAJOR_SCALE, STANDARD_TUNING } from '../../theory'
import { generateScaleBoxNotes } from './generateScaleBox'
import type { ScalePattern, ScalePatternNote } from './pattern'

const patternARoot: ScalePatternNote = { string: 6, fret: 3 }

/** "E-shape" major scale box, root on the 6th string. Hand-written, as most patterns will be. */
const patternA: ScalePattern = {
  id: 'major-e-shape',
  scaleId: MAJOR_SCALE.id,
  label: 'Forma di E (fondamentale 6ª corda)',
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

const patternBRoot: ScalePatternNote = { string: 5, fret: 4 }

/** "A-shape" major scale box, root on the 5th string — generated from the root + a fret window, to exercise generateScaleBoxNotes. */
const patternB: ScalePattern = {
  id: 'major-a-shape',
  scaleId: MAJOR_SCALE.id,
  label: 'Forma di A (fondamentale 5ª corda)',
  root: patternBRoot,
  notes: generateScaleBoxNotes(STANDARD_TUNING, MAJOR_SCALE, patternBRoot, 2, 6),
}

/** Every pattern the app knows about — add new patterns here as they're written. */
export const PATTERNS: ScalePattern[] = [patternA, patternB]
