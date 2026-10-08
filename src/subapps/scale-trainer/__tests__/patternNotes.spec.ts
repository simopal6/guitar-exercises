import { describe, expect, it } from 'vitest'
import { MAJOR_SCALE, STANDARD_TUNING } from '../../../theory'
import { derivePatternNotes, dropRedundantMarginNotes, type DerivedNote } from '../patternNotes'
import { generateScaleBoxNotes } from '../generateScaleBox'
import { PATTERNS } from '../patterns'
import type { ScalePatternNote } from '../pattern'

const patternA = PATTERNS.find((p) => p.id === 'major-e-shape')!

describe('derivePatternNotes', () => {
  const derived = derivePatternNotes(patternA, MAJOR_SCALE, STANDARD_TUNING)

  it('derives one entry per pattern note', () => {
    expect(derived).toHaveLength(patternA.notes.length)
  })

  it('gives the root position degree 1 and note name G (6th string, 3rd fret)', () => {
    const root = derived.find((n) => n.stringIndex === 0 && n.fret === 3)
    expect(root).toBeDefined()
    expect(root!.degree).toBe(1)
    expect(root!.noteName).toBe('G2')
  })

  it('derives correct degrees for a few known positions (G major scale)', () => {
    // 6th string (index 0), fret 5 = A -> degree 2 (major second above G)
    const d2 = derived.find((n) => n.stringIndex === 0 && n.fret === 5)
    expect(d2!.degree).toBe(2)
    expect(d2!.noteName).toBe('A2')

    // 5th string (index 1), fret 2 = B -> degree 3
    const d3 = derived.find((n) => n.stringIndex === 1 && n.fret === 2)
    expect(d3!.degree).toBe(3)
    expect(d3!.noteName).toBe('B2')
  })

  it('every derived note has a color and the color only depends on degree', () => {
    for (const note of derived) {
      expect(note.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
    const byDegree = new Map<number, string>()
    for (const note of derived) {
      if (byDegree.has(note.degree)) {
        expect(note.color).toBe(byDegree.get(note.degree))
      } else {
        byDegree.set(note.degree, note.color)
      }
    }
  })
})

describe('generateScaleBoxNotes', () => {
  const root: ScalePatternNote = { string: 5, fret: 4 }
  const notes = generateScaleBoxNotes(STANDARD_TUNING, MAJOR_SCALE, root, 2, 6)

  it('only returns positions whose pitch class actually belongs to the scale', () => {
    const derived = derivePatternNotes(
      { id: 'test', scaleId: MAJOR_SCALE.id, label: 'test', root, rootOffsetInBox: 1, notes },
      MAJOR_SCALE,
      STANDARD_TUNING,
    )
    expect(derived.length).toBe(notes.length)
    for (const note of derived) {
      expect(note.degree).toBeGreaterThanOrEqual(1)
      expect(note.degree).toBeLessThanOrEqual(7)
    }
  })

  it('stays within the requested fret window on every string', () => {
    for (const note of notes) {
      expect(note.fret).toBeGreaterThanOrEqual(2)
      expect(note.fret).toBeLessThanOrEqual(6)
    }
  })

  it('includes the root position itself', () => {
    expect(notes).toContainEqual(root)
  })
})

describe('dropRedundantMarginNotes', () => {
  function note(partial: Partial<DerivedNote> & Pick<DerivedNote, 'fret' | 'midi'>): DerivedNote {
    return { stringIndex: 0, noteName: '', degree: 1, color: '#000000', ...partial }
  }

  it('drops a margin note whose pitch is already present inside the box', () => {
    const inBox = note({ fret: 5, midi: 60, stringIndex: 1 })
    const duplicateInMargin = note({ fret: 8, midi: 60, stringIndex: 2 }) // same pitch, outside [4,7]
    const result = dropRedundantMarginNotes([inBox, duplicateInMargin], 4, 7)
    expect(result).toEqual([inBox])
  })

  it('keeps a margin note whose pitch is not reachable inside the box', () => {
    const inBox = note({ fret: 5, midi: 60 })
    const genuineStretch = note({ fret: 8, midi: 65 }) // different pitch, a real stretch note
    const result = dropRedundantMarginNotes([inBox, genuineStretch], 4, 7)
    expect(result).toEqual([inBox, genuineStretch])
  })

  it('never drops notes that are inside the box, even if duplicated there', () => {
    const a = note({ fret: 4, midi: 60, stringIndex: 0 })
    const b = note({ fret: 6, midi: 60, stringIndex: 1 }) // same pitch, also inside the box
    const result = dropRedundantMarginNotes([a, b], 4, 7)
    expect(result).toEqual([a, b])
  })
})

describe('major-scale-3 (root on string 6, box touching the nut)', () => {
  const patternC = PATTERNS.find((p) => p.id === 'major-scale-3')!

  it('generates 19 raw notes, 18 after dropping the one that duplicates an in-box pitch', () => {
    expect(patternC.notes).toHaveLength(19)
    const derived = derivePatternNotes(patternC, MAJOR_SCALE, STANDARD_TUNING)
    const boxStart = patternC.root.fret - patternC.rootOffsetInBox
    const boxEnd = boxStart + 4 - 1
    const filtered = dropRedundantMarginNotes(derived, boxStart, boxEnd)
    expect(filtered).toHaveLength(18)
  })

  it('keeps both margin occurrences of degree 7 (string 3 fret 0 and string 4 fret 5), since neither is inside the box', () => {
    const derived = derivePatternNotes(patternC, MAJOR_SCALE, STANDARD_TUNING)
    const boxStart = patternC.root.fret - patternC.rootOffsetInBox
    const boxEnd = boxStart + 4 - 1
    const filtered = dropRedundantMarginNotes(derived, boxStart, boxEnd)
    const string3Fret0 = filtered.find((n) => n.stringIndex === 3 && n.fret === 0)
    const string4Fret5 = filtered.find((n) => n.stringIndex === 2 && n.fret === 5)
    expect(string3Fret0).toBeDefined()
    expect(string4Fret5).toBeDefined()
    expect(string3Fret0!.midi).toBe(string4Fret5!.midi)
    expect(string3Fret0!.degree).toBe(7)
  })
})
