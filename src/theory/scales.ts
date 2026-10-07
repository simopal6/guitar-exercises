export interface Scale {
  id: string
  name: string
  /** Semitones from the root, one entry per degree (index 0 = degree 1). Always includes 0. */
  formula: number[]
}

export const MAJOR_SCALE: Scale = {
  id: 'major',
  name: 'Maggiore',
  formula: [0, 2, 4, 5, 7, 9, 11],
}

/** Every scale the app knows about — add new scales here as they're written. */
export const SCALES: Scale[] = [MAJOR_SCALE]

/**
 * Degree (1-based) of a note relative to the root, regardless of octave —
 * the distance is reduced mod 12 before matching the formula, so a note a
 * full octave above the root (or more) still collapses onto degree 1, with
 * no special-casing needed anywhere else.
 * Throws if the note doesn't belong to the scale (a bug in pattern data,
 * not a runtime condition to recover from).
 */
export function scaleDegree(scale: Scale, semitonesFromRoot: number): number {
  const pitchClass = ((semitonesFromRoot % 12) + 12) % 12
  const index = scale.formula.indexOf(pitchClass)
  if (index === -1) {
    throw new RangeError(`${pitchClass} semitones from the root does not belong to the "${scale.name}" scale`)
  }
  return index + 1
}
