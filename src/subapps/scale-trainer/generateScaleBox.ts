import type { Scale, Tuning } from '../../theory'
import { positionToMidi, scaleDegree } from '../../theory'
import { stringToIndex, type ScalePatternNote } from './pattern'

/**
 * Generates every note of `scale` that falls within a fret window
 * [fretStart, fretEnd] (inclusive, across all 6 strings), relative to a
 * given root. A convenience for WRITING a pattern faster — the result is
 * still a plain, static note list once generated, not computed at runtime
 * by the practice composable.
 */
export function generateScaleBoxNotes(
  tuning: Tuning,
  scale: Scale,
  root: ScalePatternNote,
  fretStart: number,
  fretEnd: number,
): ScalePatternNote[] {
  const rootMidi = positionToMidi(tuning, { stringIndex: stringToIndex(root.string), fret: root.fret })
  const notes: ScalePatternNote[] = []
  for (let guitarString = 6; guitarString >= 1; guitarString--) {
    const stringIndex = stringToIndex(guitarString)
    for (let fret = fretStart; fret <= fretEnd; fret++) {
      const midi = positionToMidi(tuning, { stringIndex, fret })
      if (isInScale(scale, midi - rootMidi)) notes.push({ string: guitarString, fret })
    }
  }
  return notes
}

function isInScale(scale: Scale, semitonesFromRoot: number): boolean {
  try {
    scaleDegree(scale, semitonesFromRoot)
    return true
  } catch {
    return false
  }
}
