import type { GeneratedShape, IntervalName } from '../../theory'
import { STANDARD_TUNING, generateShape, randomIntervalName } from '../../theory'
import {
  generateNameDistractors,
  generateSemitoneDistractors,
  generateShapeDistractors,
  shuffle,
} from '../distractors'
import type { DifficultyLevel, ExerciseFace, FaceValue, ModeConfig, Question } from '../types'

const ALL_STRINGS = [0, 1, 2, 3, 4, 5]

function requireShape(shape: GeneratedShape | null): GeneratedShape {
  if (!shape) {
    throw new Error('generateIntervalQuestion: shape face requested but no shape was generated')
  }
  return shape
}

/**
 * Generic generator for every "pick two faces out of {name, semitones,
 * shape}" mode. Adding a new pair mode is a ModeConfig entry, not new
 * generator code — this single function drives name-semitones, name-shape
 * and semitones-shape alike.
 */
export function generateIntervalQuestion(
  mode: ModeConfig,
  difficulty: DifficultyLevel | null,
  rng: () => number,
): Question {
  const usesShape = mode.questionFace === 'shape' || mode.answerFace === 'shape'
  const semitoneRange = difficulty?.semitoneRange ?? [0, 12]
  const shapeOptions = {
    tuning: STANDARD_TUNING,
    allowedRootStrings: difficulty?.allowedRootStrings ?? ALL_STRINGS,
    allowedStringPairs: difficulty?.allowedStringPairs,
    maxFretSpan: difficulty?.maxFretSpan,
  }

  let semitones: number
  let name: IntervalName
  let correctShape: GeneratedShape | null = null

  if (usesShape) {
    // Let generateShape pick semitones freely within range: some exact
    // values are geometrically unreachable for a given difficulty (e.g. a
    // Unison at beginner level), so we never force semitoneRange to a
    // single point here.
    correctShape = generateShape({ ...shapeOptions, semitoneRange, rng })
    semitones = correctShape.semitones
    name = correctShape.intervalName
  } else {
    const [min, max] = semitoneRange
    semitones = min + Math.floor(rng() * (max - min + 1))
    name = randomIntervalName(semitones, rng)
  }

  const swap = Boolean(mode.randomizeDirection) && rng() < 0.5
  const questionFace: ExerciseFace = swap ? mode.answerFace : mode.questionFace
  const answerFace: ExerciseFace = swap ? mode.questionFace : mode.answerFace

  function valueFor(face: ExerciseFace): FaceValue {
    if (face === 'name') return { face: 'name', value: name }
    if (face === 'semitones') return { face: 'semitones', value: semitones }
    return { face: 'shape', value: requireShape(correctShape) }
  }

  const prompt = valueFor(questionFace)
  const correctAnswer = valueFor(answerFace)

  const choiceCount = mode.choiceCount ?? 4
  const distractorCount = choiceCount - 1

  let distractors: FaceValue[]
  if (answerFace === 'name') {
    distractors = generateNameDistractors(name, distractorCount, rng).map(
      (value) => ({ face: 'name', value }) as const,
    )
  } else if (answerFace === 'semitones') {
    distractors = generateSemitoneDistractors(semitones, distractorCount, rng).map(
      (value) => ({ face: 'semitones', value }) as const,
    )
  } else {
    distractors = generateShapeDistractors(semitones, distractorCount, shapeOptions, semitoneRange, rng).map(
      (value) => ({ face: 'shape', value }) as const,
    )
  }

  const choices = shuffle([correctAnswer, ...distractors], rng)
  const correctIndex = choices.indexOf(correctAnswer)

  return { semitones, intervalName: name, questionFace, answerFace, prompt, choices, correctIndex }
}
