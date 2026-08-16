import type { Barre, Chord, ChordList, FingerLabel, StringFret } from './chord'

const STORAGE_KEY = 'guitar-exercises.chord-trainer.lists'

export interface ImportResult {
  list: ChordList
  isNewList: boolean
  addedChordIds: string[]
  updatedChordIds: string[]
}

function readAll(): Record<string, ChordList> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(lists: Record<string, ChordList>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
  } catch {
    // localStorage unavailable (private browsing, quota, ...) — changes just won't persist
  }
}

export function getAllLists(): ChordList[] {
  return Object.values(readAll())
}

export function getList(listId: string): ChordList | undefined {
  return readAll()[listId]
}

/** Upsert a whole list by id. */
export function saveList(list: ChordList): void {
  const all = readAll()
  all[list.id] = list
  writeAll(all)
}

export function deleteList(listId: string): void {
  const all = readAll()
  delete all[listId]
  writeAll(all)
}

export function deleteChordFromList(listId: string, chordId: string): void {
  const all = readAll()
  const list = all[listId]
  if (!list) return
  list.chords = list.chords.filter((c) => c.id !== chordId)
  writeAll(all)
}

export function exportChordListJson(list: ChordList): string {
  return JSON.stringify(list, null, 2)
}

function generateId(): string {
  return crypto.randomUUID()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateStringFret(value: unknown, context: string): StringFret {
  if (value === 'x') return 'x'
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value
  throw new Error(`${context}: valore corda non valido (${JSON.stringify(value)}), atteso "x" o un tasto >= 0`)
}

function validateFinger(value: unknown, context: string): FingerLabel | null {
  if (value === null || value === undefined) return null
  if (value === 'T' || value === 1 || value === 2 || value === 3 || value === 4) return value
  throw new Error(`${context}: dito non valido (${JSON.stringify(value)})`)
}

function validateBarre(raw: unknown, context: string): Barre {
  if (!isPlainObject(raw)) throw new Error(`${context}: non è un oggetto valido`)
  const fret = raw.fret
  const fromString = raw.fromString
  const toStringValue = raw['toString'] // the JSON field literally named "toString", not Object.prototype.toString
  if (typeof fret !== 'number') throw new Error(`${context}: "fret" mancante o non numerico`)
  if (typeof fromString !== 'number' || fromString < 1 || fromString > 6) {
    throw new Error(`${context}: "fromString" deve essere un numero di corda tra 1 e 6`)
  }
  if (typeof toStringValue !== 'number' || toStringValue < 1 || toStringValue > 6) {
    throw new Error(`${context}: "toString" deve essere un numero di corda tra 1 e 6`)
  }
  const barre: Barre = { fret, fromString, toString: toStringValue }
  if (raw.finger !== undefined) {
    const finger = validateFinger(raw.finger, context)
    if (finger !== null) barre.finger = finger
  }
  return barre
}

function validateChord(raw: unknown, index: number): Chord {
  if (!isPlainObject(raw)) throw new Error(`Accordo #${index + 1}: non è un oggetto valido`)
  const name = raw.name
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error(`Accordo #${index + 1}: "name" è obbligatorio`)
  }

  const chord: Chord = {
    id: typeof raw.id === 'string' && raw.id !== '' ? raw.id : generateId(),
    name,
  }
  if (typeof raw.variant === 'string') chord.variant = raw.variant

  if (raw.strings !== undefined) {
    if (!Array.isArray(raw.strings) || raw.strings.length !== 6) {
      throw new Error(`Accordo "${name}": "strings" deve avere esattamente 6 elementi`)
    }
    chord.strings = raw.strings.map((s, i) =>
      validateStringFret(s, `Accordo "${name}", corda ${i}`),
    ) as unknown as Chord['strings']
  }
  if (raw.fingers !== undefined) {
    if (!Array.isArray(raw.fingers) || raw.fingers.length !== 6) {
      throw new Error(`Accordo "${name}": "fingers" deve avere esattamente 6 elementi`)
    }
    chord.fingers = raw.fingers.map((f, i) =>
      validateFinger(f, `Accordo "${name}", corda ${i}`),
    ) as unknown as Chord['fingers']
  }
  if (raw.barres !== undefined) {
    if (!Array.isArray(raw.barres)) throw new Error(`Accordo "${name}": "barres" deve essere un array`)
    chord.barres = raw.barres.map((b, i) => validateBarre(b, `Accordo "${name}", barré ${i + 1}`))
  }

  return chord
}

function validateChordListJson(raw: unknown): { id?: string; name?: string; chords: unknown[] } {
  if (!isPlainObject(raw)) throw new Error('Il file non contiene un oggetto JSON valido')
  const chords = raw.chords
  if (chords !== undefined && !Array.isArray(chords)) {
    throw new Error('"chords" deve essere un array')
  }
  return {
    id: typeof raw.id === 'string' && raw.id !== '' ? raw.id : undefined,
    name: typeof raw.name === 'string' ? raw.name : undefined,
    chords: chords ?? [],
  }
}

/**
 * Non-destructive merge import: chords with an id already present in the
 * target list are updated in place; new ids are added; chords present
 * locally but absent from the file are left untouched. Chords missing an id
 * are always treated as new (a fresh id is generated). A list missing its
 * own top-level id is always imported as a brand-new list.
 */
export function importChordList(raw: unknown): ImportResult {
  const parsed = validateChordListJson(raw)
  const all = readAll()
  const isNewList = !parsed.id || !(parsed.id in all)
  const listId = parsed.id ?? generateId()

  const target: ChordList = isNewList
    ? { id: listId, name: parsed.name ?? 'Lista importata', chords: [] }
    : structuredClone(all[listId])

  if (!isNewList && parsed.name) target.name = parsed.name

  const addedChordIds: string[] = []
  const updatedChordIds: string[] = []

  parsed.chords.forEach((rawChord, index) => {
    const hadId = isPlainObject(rawChord) && typeof rawChord.id === 'string' && rawChord.id !== ''
    const chord = validateChord(rawChord, index)
    const existingIndex = target.chords.findIndex((c) => c.id === chord.id)
    if (hadId && existingIndex !== -1) {
      target.chords[existingIndex] = chord
      updatedChordIds.push(chord.id)
    } else {
      target.chords.push(chord)
      addedChordIds.push(chord.id)
    }
  })

  all[target.id] = target
  writeAll(all)

  return { list: target, isNewList, addedChordIds, updatedChordIds }
}
