const STORAGE_KEY = 'guitar-exercises.chord-trainer.pair-tempos'

/** Order-independent: C→G and G→C are the same pair. */
export function pairKey(chordIdA: string, chordIdB: string): string {
  return [chordIdA, chordIdB].sort().join('::')
}

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

/** undefined = this pair has never been played before. */
export function getPairTempo(chordIdA: string, chordIdB: string): number | undefined {
  return readAll()[pairKey(chordIdA, chordIdB)]
}

/** Stores the absolute bpm for a pair, independent of any base-bpm setting. Persists immediately. */
export function setPairTempo(chordIdA: string, chordIdB: string, bpm: number): void {
  const all = readAll()
  all[pairKey(chordIdA, chordIdB)] = bpm
  writeAll(all)
}
