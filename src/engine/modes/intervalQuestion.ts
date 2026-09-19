import type { GeneratedShape, IntervalName } from '../../theory'
import { STANDARD_TUNING, generateShape } from '../../theory'
import {
  generateNameDistractors,
  generateSemitoneDistractors,
  generateShapeDistractors,
  shuffle,
} from '../distractors'
import type { DifficultyLevel, ExerciseFace, FaceValue, ModeConfig, NameSelector, Question } from '../types'

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
  allowedSemitones: number[],
  nameSelector: NameSelector,
  rng: () => number,
): Question {
  const usesShape = mode.questionFace === 'shape' || mode.answerFace === 'shape'
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
    // Let generateShape pick semitones freely within the allowed set: some
    // exact values can be geometrically unreachable for a given difficulty,
    // so we never force a single point here.
    correctShape = generateShape({ ...shapeOptions, allowedSemitones, nameSelector, rng })
    semitones = correctShape.semitones
    name = correctShape.intervalName
  } else {
    semitones = allowedSemitones[Math.floor(rng() * allowedSemitones.length)]
    name = nameSelector(semitones, rng)
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
    distractors = generateNameDistractors(name, distractorCount, allowedSemitones, nameSelector, rng).map(
      (value) => ({ face: 'name', value }) as const,
    )
  } else if (answerFace === 'semitones') {
    distractors = generateSemitoneDistractors(semitones, distractorCount, allowedSemitones, rng).map(
      (value) => ({ face: 'semitones', value }) as const,
    )
  } else {
    distractors = generateShapeDistractors(
      semitones,
      distractorCount,
      shapeOptions,
      allowedSemitones,
      nameSelector,
      rng,
    ).map((value) => ({ face: 'shape', value }) as const)
  }

  const choices = shuffle([correctAnswer, ...distractors], rng)
  const correctIndex = choices.indexOf(correctAnswer)

  return { semitones, intervalName: name, questionFace, answerFace, prompt, choices, correctIndex }
}
