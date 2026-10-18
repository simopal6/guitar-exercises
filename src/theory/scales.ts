export interface Scale {
  id: string
  name: string
  /** Semitones from the root, one entry per entry of `degrees`. Always includes 0. */
  formula: number[]
  /**
   * Degree number (1-based) for each entry of `formula`, in the same order.
   * For a full 7-note scale this is just [1, 2, 3, 4, 5, 6, 7], but a subset
   * scale like the pentatonic keeps the degree numbers of the scale it was
   * derived from (e.g. [1, 2, 3, 5, 6]), not its own 1..N position.
   */
  degrees: number[]
  /**
   * One entry per entry of `formula`/`degrees`: true where that degree sits a
   * semitone below the major scale's same-numbered degree (e.g. Dorian's b3
   * and b7) — shown in the UI as a "b" marker on top of the degree's usual
   * color, which stays keyed to the plain degree number regardless. Omitted
   * (or all-false) for a scale with no altered degrees, like the major scale
   * itself or the major pentatonic.
   */
  flats?: boolean[]
}

export const MAJOR_SCALE: Scale = {
  id: 'major',
  name: 'Ionian',
  formula: [0, 2, 4, 5, 7, 9, 11],
  degrees: [1, 2, 3, 4, 5, 6, 7],
}

export const MAJOR_PENTATONIC_SCALE: Scale = {
  id: 'major-pentatonic',
  name: 'Pentatonica',
  formula: [0, 2, 4, 7, 9], // major scale with the 4th and 7th degrees removed
  degrees: [1, 2, 3, 5, 6],
}

export const DORIAN_SCALE: Scale = {
  id: 'dorian',
  name: 'Dorian',
  // The major scale's own 2nd mode: same pitch classes as the major scale
  // rooted a whole step up, which is why degrees 3 and 7 land a semitone
  // below their major-scale counterparts (b3, b7) while the rest match.
  formula: [0, 2, 3, 5, 7, 9, 10],
  degrees: [1, 2, 3, 4, 5, 6, 7],
  flats: [false, false, true, false, false, false, true],
}

/** Every scale the app knows about — add new scales here as they're written. */
export const SCALES: Scale[] = [MAJOR_SCALE, MAJOR_PENTATONIC_SCALE, DORIAN_SCALE]

/** Shared by scaleDegree/scaleDegreeIsFlat: which formula entry a note's distance from the root matches. */
function formulaIndexOf(scale: Scale, semitonesFromRoot: number): number {
  const pitchClass = ((semitonesFromRoot % 12) + 12) % 12
  const index = scale.formula.indexOf(pitchClass)
  if (index === -1) {
    throw new RangeError(`${pitchClass} semitones from the root does not belong to the "${scale.name}" scale`)
  }
  return index
}

/**
 * Degree (1-based) of a note relative to the root, regardless of octave —
 * the distance is reduced mod 12 before matching the formula, so a note a
 * full octave above the root (or more) still collapses onto degree 1, with
 * no special-casing needed anywhere else.
 * Throws if the note doesn't belong to the scale (a bug in pattern data,
 * not a runtime condition to recover from).
 */
export function scaleDegree(scale: Scale, semitonesFromRoot: number): number {
  return scale.degrees[formulaIndexOf(scale, semitonesFromRoot)]
}

/** Whether the note at this distance from the root is a degree flattened relative to the major scale (e.g. Dorian's b3/b7) — see `Scale.flats`. */
export function scaleDegreeIsFlat(scale: Scale, semitonesFromRoot: number): boolean {
  return scale.flats?.[formulaIndexOf(scale, semitonesFromRoot)] ?? false
}
