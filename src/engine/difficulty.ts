import type { DifficultyLevel } from './types'

/**
 * Anchored progression: level 1 restricts the root note to the low-E/A
 * strings, later levels open up to the whole neck. Only affects the
 * shape-involving modes (no strings/frets involved in name-semitones).
 */
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { id: 1, label: 'Principiante', allowedRootStrings: [0, 1] },
  { id: 2, label: 'Intermedio', allowedRootStrings: [0, 1, 2, 3] },
  { id: 3, label: 'Avanzato', allowedRootStrings: [0, 1, 2, 3, 4, 5] },
]
