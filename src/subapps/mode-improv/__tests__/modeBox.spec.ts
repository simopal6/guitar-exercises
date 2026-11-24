import { describe, expect, it } from 'vitest'
import { keyBox, modeBoxNotes } from '../modeBox'
import { MAJOR_A_SHAPE_NOTES } from '../../../components/scale-box/majorAShape'
import { diatonicTriad, type PitchClass } from '../../../theory'

const ALL_KEYS = Array.from({ length: 12 }, (_, i) => i as PitchClass)

describe('keyBox', () => {
  it('leaves G where the shape is defined (3rd fret)', () => {
    expect(keyBox(7).keyFret).toBe(3)
  })

  it('puts the key root on the 6th string between the 3rd and 14th fret, so the box never reaches the nut', () => {
    for (const key of ALL_KEYS) {
      const box = keyBox(key)
      expect(box.keyFret).toBeGreaterThanOrEqual(3)
      expect(box.keyFret).toBeLessThanOrEqual(14)
      expect(Math.min(...box.notes.map((n) => n.fret))).toBeGreaterThanOrEqual(2)
    }
    expect(keyBox(4).keyFret).toBe(12) // E: 0 → 12
    expect(keyBox(5).keyFret).toBe(13) // F: 1 → 13
    expect(keyBox(6).keyFret).toBe(14) // F#: 2 → 14
    expect(keyBox(0).keyFret).toBe(8) // C
  })
})

describe('modeBoxNotes', () => {
  it('colors the chord root as degree 1, not the key root (key G, ii = Am → red on the A notes)', () => {
    const notes = modeBoxNotes(keyBox(7), 2, diatonicTriad(7, 2).root)
    const roots = notes.filter((n) => n.degree === 1)
    expect(roots.length).toBeGreaterThan(0)
    expect(roots.every((n) => n.midi % 12 === 9)).toBe(true)
    // Dorian: b3 and b7 marked
    expect(notes.filter((n) => n.flat).map((n) => n.degree).sort()).toEqual(expect.arrayContaining([3, 7]))
  })

  it('shows the same positions for both chords of a key, only the numbering changes', () => {
    const box = keyBox(2)
    const ii = modeBoxNotes(box, 2, diatonicTriad(2, 2).root)
    const v = modeBoxNotes(box, 5, diatonicTriad(2, 5).root)
    const positions = (notes: typeof ii) => notes.map((n) => `${n.stringIndex}-${n.fret}`).sort()
    expect(positions(ii)).toEqual(positions(v))
  })

  it('marks the Lydian #4 as sharp', () => {
    const notes = modeBoxNotes(keyBox(0), 4, diatonicTriad(0, 4).root) // key C, IV = F Lydian: B is #4
    const sharps = notes.filter((n) => n.sharp)
    expect(sharps.length).toBeGreaterThan(0)
    expect(sharps.every((n) => n.degree === 4 && n.midi % 12 === 11)).toBe(true)
  })

  it('works for every degree in every key', () => {
    for (const key of ALL_KEYS) {
      for (let degree = 1; degree <= 7; degree++) {
        expect(() => modeBoxNotes(keyBox(key), degree, diatonicTriad(key, degree).root)).not.toThrow()
      }
    }
  })
})

describe('keyBox with the "Scala maggiore (10)" shape', () => {
  it('puts G on the 5th string\'s 10th fret', () => {
    const box = keyBox(7, 'a')
    expect(box.keyFret).toBe(10)
    expect(box.rootOffsetInBox).toBe(3)
    expect(box.notes).toContainEqual({ string: 5, fret: 10 })
  })

  it('puts the key root on the 5th string between the 5th and 16th fret, in a 4-fret box that never reaches the nut', () => {
    for (const key of ALL_KEYS) {
      const box = keyBox(key, 'a')
      expect(box.keyFret).toBeGreaterThanOrEqual(5)
      expect(box.keyFret).toBeLessThanOrEqual(16)
      const frets = box.notes.map((n) => n.fret)
      expect(Math.min(...frets)).toBe(box.keyFret - 3)
      expect(Math.max(...frets)).toBe(box.keyFret)
      expect(Math.min(...frets)).toBeGreaterThanOrEqual(2)
      expect(box.notes).toHaveLength(MAJOR_A_SHAPE_NOTES.length)
    }
    expect(keyBox(2, 'a').keyFret).toBe(5) // D: 5th fret
    expect(keyBox(10, 'a').keyFret).toBe(13) // Bb: 1 → 13
  })

  it('works for every degree in every key, and marks the Lydian #4', () => {
    for (const key of ALL_KEYS) {
      for (let degree = 1; degree <= 7; degree++) {
        expect(() => modeBoxNotes(keyBox(key, 'a'), degree, diatonicTriad(key, degree).root)).not.toThrow()
      }
    }
    const sharps = modeBoxNotes(keyBox(0, 'a'), 4, diatonicTriad(0, 4).root).filter((n) => n.sharp)
    expect(sharps.length).toBeGreaterThan(0)
    expect(sharps.every((n) => n.degree === 4 && n.midi % 12 === 11)).toBe(true)
  })
})
