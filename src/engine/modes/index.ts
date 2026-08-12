import type { DifficultyLevel, ModeConfig, Question } from '../types'
import { generateIntervalQuestion } from './intervalQuestion'

export type QuestionGenerator = (
  mode: ModeConfig,
  difficulty: DifficultyLevel | null,
  rng: () => number,
) => Question

/** Registry of question generators, keyed by ModeConfig.id. */
export const MODE_GENERATORS: Record<string, QuestionGenerator> = {
  'name-semitones': generateIntervalQuestion,
  'name-shape': generateIntervalQuestion,
  'semitones-shape': generateIntervalQuestion,
}

/**
 * Concrete mode configurations. "name-semitones" (Fase 1), "name-shape" and
 * "semitones-shape" (Fase 2) are all wired up; a future "mixed" mode is
 * another entry here, not an engine change.
 */
export const MODE_CONFIGS: Record<string, ModeConfig> = {
  'name-semitones': {
    id: 'name-semitones',
    questionFace: 'name',
    answerFace: 'semitones',
    randomizeDirection: true,
    choiceCount: 4,
  },
  'name-shape': {
    id: 'name-shape',
    questionFace: 'name',
    answerFace: 'shape',
    randomizeDirection: true,
    choiceCount: 4,
  },
  'semitones-shape': {
    id: 'semitones-shape',
    questionFace: 'semitones',
    answerFace: 'shape',
    randomizeDirection: true,
    choiceCount: 4,
  },
}
