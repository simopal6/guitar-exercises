const PRESET_STORAGE_KEY = 'guitar-exercises.interval-trainer.selected-preset'
const STANDARD_STORAGE_KEY = 'guitar-exercises.interval-trainer.standard-semitones'

export type IntervalPreset = 'standard' | 'completa'

/** The "building block" intervals: what constructs chords/scales/arpeggios. */
export const STANDARD_DEFAULT_SEMITONES: number[] = [3, 4, 5, 7, 9, 10, 11, 12]

/** Every interval except Unison (excluded everywhere, see intervalQuestion.ts). */
export const COMPLETE_SEMITONES: number[] = Array.from({ length: 12 }, (_, i) => i + 1)

/** Below this, there aren't enough distinct semitone values to fill the 4 answer choices. */
export const MIN_SELECTED_SEMITONES = 4

function isValidSemitoneList(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((n) => Number.isInteger(n) && n >= 1 && n <= 12)
  )
}

export function getIntervalPreset(): IntervalPreset {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY)
    return raw === 'completa' ? 'completa' : 'standard'
  } catch {
    return 'standard'
  }
}

export function setIntervalPreset(preset: IntervalPreset): void {
  try {
    localStorage.setItem(PRESET_STORAGE_KEY, preset)
  } catch {
    // localStorage unavailable (private browsing, quota, ...) — preset just won't persist
  }
}

export function getStandardSemitones(): number[] {
  try {
    const raw = localStorage.getItem(STANDARD_STORAGE_KEY)
    if (!raw) return STANDARD_DEFAULT_SEMITONES
    const parsed = JSON.parse(raw)
    return isValidSemitoneList(parsed) ? parsed : STANDARD_DEFAULT_SEMITONES
  } catch {
    return STANDARD_DEFAULT_SEMITONES
  }
}

export function setStandardSemitones(semitones: number[]): void {
  try {
    localStorage.setItem(STANDARD_STORAGE_KEY, JSON.stringify(semitones))
  } catch {
    // localStorage unavailable — customization just won't persist
  }
}

export function resetStandardSemitones(): void {
  setStandardSemitones(STANDARD_DEFAULT_SEMITONES)
}

/** The semitone set actually used by the exercise right now. */
export function getActiveSemitones(): number[] {
  return getIntervalPreset() === 'completa' ? COMPLETE_SEMITONES : getStandardSemitones()
}
