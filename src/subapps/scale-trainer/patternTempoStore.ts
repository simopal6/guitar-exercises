const STORAGE_KEY = 'guitar-exercises.scale-trainer.pattern-tempos'

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

/** undefined = this pattern has never been practiced before. */
export function getPatternTempo(patternId: string): number | undefined {
  return readAll()[patternId]
}

/** Stores the absolute bpm for a single pattern. Persists immediately. */
export function setPatternTempo(patternId: string, bpm: number): void {
  const all = readAll()
  all[patternId] = bpm
  writeAll(all)
}
