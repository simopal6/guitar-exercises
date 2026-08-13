const STORAGE_KEY = 'guitar-exercises.interval-trainer.best-scores'

export interface BestScoreRecord {
  durationSeconds: number
  modeId: string
  difficultyId: number
  /** Difficulty only matters for shape-involving modes; ignored in the key otherwise. */
  usesShape: boolean
}

function keyFor({ durationSeconds, modeId, difficultyId, usesShape }: BestScoreRecord): string {
  return `${durationSeconds}:${modeId}:${usesShape ? difficultyId : 'na'}`
}

function readAll(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(scores: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
  } catch {
    // localStorage unavailable (private browsing, quota, ...) — best score just won't persist
  }
}

export function getBestScore(record: BestScoreRecord): number {
  return readAll()[keyFor(record)] ?? 0
}

export function recordScore(record: BestScoreRecord, score: number): { best: number; isNewBest: boolean } {
  const all = readAll()
  const key = keyFor(record)
  const previous = all[key] ?? 0
  if (score > previous) {
    all[key] = score
    writeAll(all)
    return { best: score, isNewBest: true }
  }
  return { best: previous, isNewBest: false }
}
