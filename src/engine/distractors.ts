import type { GeneratedShape, IntervalName, ShapeGenerationOptions } from '../theory'
import { generateShape, intervalSemitones, randomIntervalName } from '../theory'

export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Mix of "near" semitone counts (plausible near-misses) and uniformly random
 * remaining values from the full 0-12 set, deduplicated.
 */
export function generateSemitoneDistractors(
  correct: number,
  count: number,
  rng: () => number = Math.random,
): number[] {
  const near = shuffle([1, -1, 2, -2, 3, -3], rng)
    .map((delta) => correct + delta)
    .filter((candidate) => candidate >= 0 && candidate <= 12)

  const distractors = new Set<number>(near)

  const rest = shuffle(
    Array.from({ length: 13 }, (_, i) => i).filter((n) => n !== correct),
    rng,
  )
  for (const candidate of rest) {
    if (distractors.size >= count) break
    distractors.add(candidate)
  }

  return shuffle(Array.from(distractors), rng).slice(0, count)
}

export function generateNameDistractors(
  correct: IntervalName,
  count: number,
  rng: () => number = Math.random,
): IntervalName[] {
  const correctSemitones = intervalSemitones(correct)
  return generateSemitoneDistractors(correctSemitones, count, rng).map((s) => randomIntervalName(s, rng))
}

/**
 * Distinct playable shape distractors. Each candidate is a freely-generated
 * shape (never forced to an exact semitone count — some counts are
 * geometrically unreachable for a given difficulty, e.g. a Unison at
 * beginner level), resampled until `count` distinct-interval shapes are
 * found or the attempt budget runs out.
 */
export function generateShapeDistractors(
  correctSemitones: number,
  count: number,
  shapeOptions: Pick<ShapeGenerationOptions, 'tuning' | 'allowedRootStrings' | 'allowedStringPairs' | 'maxFretSpan'>,
  semitoneRange: [number, number],
  rng: () => number = Math.random,
): GeneratedShape[] {
  const results: GeneratedShape[] = []
  const usedSemitones = new Set<number>([correctSemitones])
  const maxAttempts = Math.max(count * 25, 100)

  for (let attempt = 0; attempt < maxAttempts && results.length < count; attempt++) {
    let shape: GeneratedShape
    try {
      shape = generateShape({ ...shapeOptions, semitoneRange, rng })
    } catch {
      continue
    }
    if (usedSemitones.has(shape.semitones)) continue
    usedSemitones.add(shape.semitones)
    results.push(shape)
  }

  if (results.length < count) {
    throw new Error(
      `generateShapeDistractors: found only ${results.length}/${count} distinct playable distractor shapes — the difficulty constraints may be too narrow`,
    )
  }

  return results
}
