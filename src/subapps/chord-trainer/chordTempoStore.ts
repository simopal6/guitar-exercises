const STORAGE_KEY = 'guitar-exercises.chord-trainer.chord-tempos'

/** Superseded per-pair format (see git history) — not convertible to per-chord tempos, only purged. */
const LEGACY_STORAGE_KEY = 'guitar-exercises.chord-trainer.pair-tempos'

function readAll(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(tempos: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tempos))
  } catch {
    // localStorage unavailable (private browsing, quota, ...) — tempo just won't persist
  }
}

/** undefined = this chord has never been played before. */
export function getChordTempo(chordId: string): number | undefined {
  return readAll()[chordId]
}

/** Stores the absolute bpm for a single chord, independent of any base-bpm setting. Persists immediately. */
export function setChordTempo(chordId: string, bpm: number): void {
  const all = readAll()
  all[chordId] = bpm
  writeAll(all)
}

/**
 * One-time cleanup: the old per-pair tempo format has no meaningful mapping
 * to per-chord tempos, so instead of migrating it, it's just discarded —
 * players restart their recorded tempos once, under the new format.
 */
export function purgeLegacyPairTempoFormat(): void {
  try {
    if (localStorage.getItem(LEGACY_STORAGE_KEY) !== null) {
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    }
  } catch {
    // localStorage unavailable — nothing to purge
  }
}
