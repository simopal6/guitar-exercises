const STORAGE_KEY = 'guitar-exercises.song-trainer.progress'

export type SequenceId = 'review' | 'deep'

/** Where a sequence currently is: the first song of today's batch, and how many times the list has been gone through. */
export interface SequenceProgress {
  songId: string
  lap: number
}

function isSequenceProgress(value: unknown): value is SequenceProgress {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.songId === 'string' && typeof v.lap === 'number' && Number.isInteger(v.lap) && v.lap >= 1
}

function readAll(): Partial<Record<SequenceId, unknown>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(progress: Partial<Record<SequenceId, unknown>>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // localStorage unavailable (private browsing, quota, ...) — progress just won't persist
  }
}

/** undefined = this sequence has never been advanced (or its saved value is unreadable). */
export function getSequenceProgress(sequence: SequenceId): SequenceProgress | undefined {
  const value = readAll()[sequence]
  return isSequenceProgress(value) ? value : undefined
}

/** Persists immediately; the other sequence is left untouched. */
export function setSequenceProgress(sequence: SequenceId, progress: SequenceProgress): void {
  const all = readAll()
  all[sequence] = progress
  writeAll(all)
}
