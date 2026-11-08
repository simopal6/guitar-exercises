const STORAGE_KEY = 'guitar-exercises.mode-improv.bpm'

/** undefined = never saved. One value for the whole sub-app, not per key or pair. */
export function getModeImprovBpm(): number | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const value = raw === null ? NaN : Number(raw)
    return Number.isFinite(value) ? value : undefined
  } catch {
    return undefined
  }
}

export function setModeImprovBpm(bpm: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(bpm))
  } catch {
    // localStorage unavailable (private browsing, quota, ...) — tempo just won't persist
  }
}
