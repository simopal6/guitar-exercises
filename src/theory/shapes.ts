import type { Tuning } from './tuning'
import type { FretPosition } from './fretboard'
import { semitoneDistance } from './fretboard'
import { randomIntervalName, type IntervalName } from './intervals'

/**
 * A shape's fret offset depends only on the open-string semitone gap between
 * the two strings involved (read from the tuning) — never hardcoded per string
 * pair, so the G–B major-third gap in standard tuning falls out automatically.
 */
export function computeTargetPosition(
  tuning: Tuning,
  rootPosition: FretPosition,
  semitones: number,
  targetString: number,
): FretPosition {
  const openStringGap = tuning[targetString] - tuning[rootPosition.stringIndex]
  return { stringIndex: targetString, fret: rootPosition.fret + semitones - openStringGap }
}

/** Inverse of computeTargetPosition: signed semitone distance from root to target. */
export function computeInterval(tuning: Tuning, rootPosition: FretPosition, targetPosition: FretPosition): number {
  return semitoneDistance(tuning, rootPosition, targetPosition)
}

const DEFAULT_SEMITONE_RANGE: [number, number] = [0, 12]
const DEFAULT_MAX_FRET_SPAN = 4
const DEFAULT_ROOT_FRET_RANGE: [number, number] = [0, 12]
const MAX_NECK_FRET = 20
const MAX_ATTEMPTS = 50

export interface ShapeGenerationOptions {
  tuning: Tuning
  /** Strings the root (lower) note is allowed to sit on — this is what difficulty levels restrict. */
  allowedRootStrings: number[]
  /** Restrict which [rootString, targetString] combinations may be generated. Overrides free target-string pick. */
  allowedStringPairs?: Array<[number, number]>
  semitoneRange?: [number, number]
  maxFretSpan?: number
  rootFretRange?: [number, number]
  rng?: () => number
}

export interface GeneratedShape {
  rootPosition: FretPosition
  targetPosition: FretPosition
  semitones: number
  intervalName: IntervalName
}

function randomInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function pickStringPair(
  tuning: Tuning,
  allowedRootStrings: number[],
  allowedStringPairs: Array<[number, number]> | undefined,
  rng: () => number,
): [number, number] {
  if (allowedStringPairs && allowedStringPairs.length > 0) {
    return allowedStringPairs[randomInt(rng, 0, allowedStringPairs.length - 1)]
  }
  const rootString = allowedRootStrings[randomInt(rng, 0, allowedRootStrings.length - 1)]
  let targetString: number
  do {
    targetString = randomInt(rng, 0, tuning.length - 1)
  } while (targetString === rootString)
  return [rootString, targetString]
}

/**
 * Generates a playable interval shape: root is always the lower-pitched note
 * (no inversions yet, per design), target is root + semitones, both frets
 * kept within maxFretSpan of each other and inside a realistic neck range.
 * Retries internally until the constraints are satisfied.
 */
export function generateShape(opts: ShapeGenerationOptions): GeneratedShape {
  const {
    tuning,
    allowedRootStrings,
    allowedStringPairs,
    semitoneRange = DEFAULT_SEMITONE_RANGE,
    maxFretSpan = DEFAULT_MAX_FRET_SPAN,
    rootFretRange = DEFAULT_ROOT_FRET_RANGE,
    rng = Math.random,
  } = opts

  const [minSemitones, maxSemitones] = semitoneRange
  const [minRootFret, maxRootFret] = rootFretRange

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const [rootString, targetString] = pickStringPair(tuning, allowedRootStrings, allowedStringPairs, rng)
    const semitones = randomInt(rng, minSemitones, maxSemitones)
    const rootPosition: FretPosition = { stringIndex: rootString, fret: randomInt(rng, minRootFret, maxRootFret) }
    const targetPosition = computeTargetPosition(tuning, rootPosition, semitones, targetString)

    const playable =
      targetPosition.fret >= 0 &&
      targetPosition.fret <= MAX_NECK_FRET &&
      Math.abs(targetPosition.fret - rootPosition.fret) <= maxFretSpan

    if (playable) {
      return { rootPosition, targetPosition, semitones, intervalName: randomIntervalName(semitones, rng) }
    }
  }

  throw new Error(`generateShape: no playable shape found within the given constraints after ${MAX_ATTEMPTS} attempts`)
}
