import type { FaceValue } from '../../engine/types'

export function faceValueLabel(value: FaceValue): string {
  if (value.face === 'name') return value.value
  if (value.face === 'semitones') return `${value.value} semitoni`
  return '' // 'shape' face not produced in this phase
}
