import { beforeEach, describe, expect, it } from 'vitest'
import {
  deleteChordFromList,
  deleteList,
  exportChordListJson,
  getAllLists,
  getList,
  importChordList,
  saveList,
} from '../chordListsStore'
import type { ChordList } from '../chord'

beforeEach(() => {
  localStorage.clear()
})

const openC = { id: 'c-open', name: 'C', variant: 'open', strings: ['x', 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null] }
const openA = { id: 'a-open', name: 'A', variant: 'open', strings: ['x', 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null] }

describe('chordListsStore: basic CRUD', () => {
  it('saves and retrieves a list', () => {
    const list: ChordList = { id: 'l1', name: 'Test', chords: [openC as never] }
    saveList(list)
    expect(getList('l1')).toEqual(list)
    expect(getAllLists()).toEqual([list])
  })

  it('deletes a whole list', () => {
    saveList({ id: 'l1', name: 'Test', chords: [] })
    deleteList('l1')
    expect(getList('l1')).toBeUndefined()
  })

  it('deletes a single chord from a list without touching the rest', () => {
    saveList({ id: 'l1', name: 'Test', chords: [openC as never, openA as never] })
    deleteChordFromList('l1', 'c-open')
    expect(getList('l1')?.chords.map((c) => c.id)).toEqual(['a-open'])
  })

  it('exports a list as pretty JSON including ids', () => {
    const list: ChordList = { id: 'l1', name: 'Test', chords: [openC as never] }
    const json = exportChordListJson(list)
    expect(JSON.parse(json)).toEqual(list)
    expect(json).toContain('\n') // pretty-printed
  })
})

describe('chordListsStore: importChordList', () => {
  it('creates a brand-new list when the file has no id, and flags it as new', () => {
    const result = importChordList({ name: 'Imported', chords: [openC] })
    expect(result.isNewList).toBe(true)
    expect(result.list.name).toBe('Imported')
    expect(result.list.chords).toHaveLength(1)
    expect(result.addedChordIds).toEqual(['c-open'])
  })

  it('creates a new list when the file id does not match any local list', () => {
    const result = importChordList({ id: 'unknown-list', name: 'X', chords: [] })
    expect(result.isNewList).toBe(true)
    expect(getList('unknown-list')).toBeDefined()
  })

  it('merges into an existing list by id: updates known chord ids, adds new ones', () => {
    saveList({ id: 'l1', name: 'Original', chords: [openC as never] })
    const updatedC = { ...openC, variant: 'jazz voicing' }
    const result = importChordList({ id: 'l1', name: 'Original', chords: [updatedC, openA] })

    expect(result.isNewList).toBe(false)
    expect(result.updatedChordIds).toEqual(['c-open'])
    expect(result.addedChordIds).toEqual(['a-open'])
    const stored = getList('l1')!
    expect(stored.chords.find((c) => c.id === 'c-open')?.variant).toBe('jazz voicing')
    expect(stored.chords.map((c) => c.id).sort()).toEqual(['a-open', 'c-open'])
  })

  it('never removes chords that are present locally but absent from the imported file', () => {
    saveList({ id: 'l1', name: 'Original', chords: [openC as never, openA as never] })
    importChordList({ id: 'l1', name: 'Original', chords: [openC] }) // file only mentions C
    const stored = getList('l1')!
    expect(stored.chords.map((c) => c.id).sort()).toEqual(['a-open', 'c-open']) // A survives
  })

  it('generates a fresh id and treats the chord as new when the imported chord has no id', () => {
    saveList({ id: 'l1', name: 'Original', chords: [] })
    const result = importChordList({ id: 'l1', name: 'Original', chords: [{ name: 'Bdim' }] })
    expect(result.addedChordIds).toHaveLength(1)
    expect(result.addedChordIds[0]).not.toBe('')
    expect(getList('l1')!.chords[0].name).toBe('Bdim')
  })

  it('updates the list name from the imported file when merging into an existing list', () => {
    saveList({ id: 'l1', name: 'Old name', chords: [] })
    importChordList({ id: 'l1', name: 'New name', chords: [] })
    expect(getList('l1')!.name).toBe('New name')
  })

  it('accepts a name-only chord (no strings/fingers/barres)', () => {
    const result = importChordList({ chords: [{ id: 'bdim-x', name: 'Bdim' }] })
    expect(result.list.chords[0]).toEqual({ id: 'bdim-x', name: 'Bdim' })
  })

  it('parses a barre chord, keeping barre string numbers (6..1) as given', () => {
    const fBarre = {
      id: 'f-barre-e',
      name: 'F',
      variant: 'barre E-shape',
      strings: [1, 3, 3, 2, 1, 1],
      fingers: [1, 3, 4, 2, 1, 1],
      barres: [{ fret: 1, fromString: 6, toString: 1, finger: 1 }],
    }
    const result = importChordList({ chords: [fBarre] })
    expect(result.list.chords[0].barres).toEqual([{ fret: 1, fromString: 6, toString: 1, finger: 1 }])
  })

  it('throws a descriptive error for structurally invalid JSON', () => {
    expect(() => importChordList('not an object')).toThrow()
    expect(() => importChordList({ chords: [{ strings: [1, 2, 3] }] })).toThrow(/name/)
    expect(() => importChordList({ chords: [{ name: 'X', strings: [0, 0, 0] }] })).toThrow(/6 elementi/)
  })
})
