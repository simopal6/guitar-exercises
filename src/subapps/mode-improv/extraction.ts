import type { PitchClass } from '../../theory'

export interface Extraction {
  key: PitchClass
  /** Two different degrees (1..7) of the key, in the order they're played. */
  degrees: [number, number]
}

function randomInt(max: number, rng: () => number): number {
  return Math.floor(rng() * max)
}

/** A random major key and two different degrees of it — never the exact same key and pair as `previous`. */
export function drawExtraction(previous: Extraction | null, rng: () => number = Math.random): Extraction {
  for (;;) {
    const key = randomInt(12, rng) as PitchClass
    const first = randomInt(7, rng) + 1
    let second = randomInt(6, rng) + 1
    if (second >= first) second++ // 6 choices left once `first` is taken
    const next: Extraction = { key, degrees: [first, second] }
    const samePair = previous && previous.key === key && new Set([...previous.degrees, first, second]).size === 2
    if (!samePair) return next
  }
}
