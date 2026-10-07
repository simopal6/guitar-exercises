/**
 * Indices into a pitch-ordered note array, for ONE period of an up/down
 * ("sali e scendi") loop: up to the highest note, down to the lowest
 * EXCLUDING both repeated endpoints, so the loop never plays the same note
 * twice in a row at the seam when it repeats.
 *
 * This is the one thing to replace later for other traversal orders (groups
 * of 4, thirds, ...) — the practice composable only ever cycles through
 * whatever index list this returns, with no notion of how it was built.
 */
export function buildUpDownSequence(noteCount: number): number[] {
  if (noteCount <= 0) return []
  if (noteCount === 1) return [0]
  const up = Array.from({ length: noteCount }, (_, i) => i)
  const down = Array.from({ length: noteCount - 2 }, (_, i) => noteCount - 2 - i)
  return [...up, ...down]
}
