import type { GeneratedShape, IntervalName } from '../theory'

/** The three "faces" of an interval that the trainer can quiz on. */
export type ExerciseFace = 'name' | 'semitones' | 'shape'

/**
 * Decides which name to use for a given semitone count — `intervalName`
 * (fixed, canonical) for the Standard interval preset, `randomIntervalName`
 * (enharmonic variants, e.g. Augmented Second for a Minor Third) for
 * Completa. Threaded through the generator like `allowedSemitones`, chosen
 * once per exercise session by the interval preset, not per mode.
 */
export type NameSelector = (semitones: number, rng: () => number) => IntervalName

/**
 * A mode is purely configuration: which face is asked, which face is
 * answered, whether direction is randomized per question, and how many
 * choices to offer. Adding name<->shape, semitones<->shape, or a "mixed"
 * mode later means adding a ModeConfig + registering a generator — never
 * touching the engine itself.
 */
export interface ModeConfig {
  id: string
  questionFace: ExerciseFace
  answerFace: ExerciseFace
  randomizeDirection?: boolean
  choiceCount?: number
}

export type FaceValue =
  | { face: 'name'; value: IntervalName }
  | { face: 'semitones'; value: number }
  | { face: 'shape'; value: GeneratedShape } // reserved: not produced in this phase

export interface Question {
  semitones: number
  intervalName: IntervalName
  questionFace: ExerciseFace
  answerFace: ExerciseFace
  prompt: FaceValue
  choices: FaceValue[]
  correctIndex: number
}

export interface DifficultyLevel {
  id: number
  label: string
  /** Strings the root (lower) note may sit on — the "anchored root" constraint for early levels. */
  allowedRootStrings: number[]
  allowedStringPairs?: Array<[number, number]>
  maxFretSpan?: number
}
