import type { ChordList } from './chord'
import { getList, saveList } from './chordListsStore'

const SEED_FLAG_KEY = 'guitar-exercises.chord-trainer.caged-seeded'

export const CAGED_LIST: ChordList = {
  id: 'caged',
  name: 'CAGED (accordi maggiori aperti)',
  chords: [
    { id: 'caged-c', name: 'C', variant: 'open', strings: ['x', 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null], barres: [] },
    { id: 'caged-a', name: 'A', variant: 'open', strings: ['x', 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null], barres: [] },
    { id: 'caged-g', name: 'G', variant: 'open', strings: [3, 2, 0, 0, 0, 3], fingers: [2, 1, null, null, null, 3], barres: [] },
    { id: 'caged-e', name: 'E', variant: 'open', strings: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null], barres: [] },
    { id: 'caged-d', name: 'D', variant: 'open', strings: ['x', 'x', 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2], barres: [] },
  ],
}

/**
 * Seeds the CAGED list exactly once, ever. Checks ONLY the one-time flag —
 * never "is storage empty?" — so the list does not resurrect after the user
 * explicitly deletes it.
 */
export function seedCagedListIfNeeded(): void {
  try {
    if (localStorage.getItem(SEED_FLAG_KEY)) return
    if (!getList(CAGED_LIST.id)) saveList(CAGED_LIST)
    localStorage.setItem(SEED_FLAG_KEY, 'true')
  } catch {
    // localStorage unavailable: skip silently, nothing was persisted, a retry next load is fine
  }
}
