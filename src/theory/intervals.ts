/**
 * Every simple interval name, including the augmented/diminished spellings
 * that are enharmonically equivalent to a "plain" (major/minor/perfect) one
 * at the same semitone count (e.g. Minor Third === Augmented Second, both 3
 * semitones).
 */
export type IntervalName =
  | 'Unison'
  | 'Diminished Second'
  | 'Minor Second'
  | 'Augmented Unison'
  | 'Major Second'
  | 'Diminished Third'
  | 'Minor Third'
  | 'Augmented Second'
  | 'Major Third'
  | 'Diminished Fourth'
  | 'Perfect Fourth'
  | 'Augmented Third'
  | 'Tritone'
  | 'Augmented Fourth'
  | 'Diminished Fifth'
  | 'Perfect Fifth'
  | 'Diminished Sixth'
  | 'Minor Sixth'
  | 'Augmented Fifth'
  | 'Major Sixth'
  | 'Diminished Seventh'
  | 'Minor Seventh'
  | 'Augmented Sixth'
  | 'Major Seventh'
  | 'Diminished Octave'
  | 'Octave'
  | 'Augmented Seventh'

/**
 * Enharmonically equivalent names for each semitone count, index === semitone
 * count. The canonical (major/minor/perfect) name comes first in each group.
 */
export const INTERVAL_NAME_GROUPS: readonly (readonly IntervalName[])[] = [
  ['Unison', 'Diminished Second'],
  ['Minor Second', 'Augmented Unison'],
  ['Major Second', 'Diminished Third'],
  ['Minor Third', 'Augmented Second'],
  ['Major Third', 'Diminished Fourth'],
  ['Perfect Fourth', 'Augmented Third'],
  ['Tritone', 'Augmented Fourth', 'Diminished Fifth'],
  ['Perfect Fifth', 'Diminished Sixth'],
  ['Minor Sixth', 'Augmented Fifth'],
  ['Major Sixth', 'Diminished Seventh'],
  ['Minor Seventh', 'Augmented Sixth'],
  ['Major Seventh', 'Diminished Octave'],
  ['Octave', 'Augmented Seventh'],
]

function assertValidSemitones(semitones: number): void {
  if (!Number.isInteger(semitones) || semitones < 0 || semitones > 12) {
    throw new RangeError(`semitones must be an integer in [0, 12], got ${semitones}`)
  }
}

/** All enharmonically equivalent names for a semitone count (canonical name first). */
export function intervalNameVariants(semitones: number): readonly IntervalName[] {
  assertValidSemitones(semitones)
  return INTERVAL_NAME_GROUPS[semitones]
}

/** The canonical (major/minor/perfect) name for a semitone count. */
export function intervalName(semitones: number): IntervalName {
  return intervalNameVariants(semitones)[0]
}

/**
 * Picks a random enharmonically equivalent name for a semitone count, e.g.
 * "Minor Third" or "Augmented Second" for 3 semitones. Used wherever an
 * interval name is actually shown to the user, so both spellings get trained.
 */
export function randomIntervalName(semitones: number, rng: () => number = Math.random): IntervalName {
  const variants = intervalNameVariants(semitones)
  return variants[Math.floor(rng() * variants.length)]
}

export function intervalSemitones(name: IntervalName): number {
  const semitones = INTERVAL_NAME_GROUPS.findIndex((group) => group.includes(name))
  if (semitones === -1) {
    throw new RangeError(`unknown interval name: ${name}`)
  }
  return semitones
}
