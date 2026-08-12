import { MODE_GENERATORS } from './modes'
import type { DifficultyLevel, ModeConfig, Question } from './types'

export interface ExerciseEngine {
  nextQuestion(): Question
  submitAnswer(question: Question, choiceIndex: number): { correct: boolean; correctIndex: number }
}

export function createExerciseEngine(
  mode: ModeConfig,
  difficulty: DifficultyLevel | null = null,
  rng: () => number = Math.random,
): ExerciseEngine {
  const generator = MODE_GENERATORS[mode.id]
  if (!generator) {
    throw new Error(`unknown exercise mode: ${mode.id}`)
  }

  return {
    nextQuestion(): Question {
      return generator(mode, difficulty, rng)
    },
    submitAnswer(question: Question, choiceIndex: number) {
      return { correct: choiceIndex === question.correctIndex, correctIndex: question.correctIndex }
    },
  }
}
