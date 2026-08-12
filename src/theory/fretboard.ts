import type { Tuning } from './tuning'
import type { Pitch } from './notes'
import { midiToPitch, noteName } from './notes'

/** stringIndex 0 = lowest-pitched string (matches Tuning index 0); fret 0 = open string. */
export interface FretPosition {
  stringIndex: number
  fret: number
}

export function positionToMidi(tuning: Tuning, pos: FretPosition): number {
  return tuning[pos.stringIndex] + pos.fret
}

export function positionToPitch(tuning: Tuning, pos: FretPosition): Pitch {
  return midiToPitch(positionToMidi(tuning, pos))
}

export function positionToNoteName(tuning: Tuning, pos: FretPosition): string {
  return noteName(positionToPitch(tuning, pos))
}

/** Signed semitone distance from `from` to `to` (positive when `to` is higher). */
export function semitoneDistance(tuning: Tuning, from: FretPosition, to: FretPosition): number {
  return positionToMidi(tuning, to) - positionToMidi(tuning, from)
}
