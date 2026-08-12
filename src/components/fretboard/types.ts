import type { FretPosition } from '../../theory'

export type HighlightRole = 'root' | 'target' | 'neutral' | 'selected' | 'correct' | 'incorrect'

export interface HighlightedPosition {
  position: FretPosition
  role: HighlightRole
  label?: string
}
