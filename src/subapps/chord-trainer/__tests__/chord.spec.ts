import { describe, expect, it } from 'vitest'
import { guitarStringNumberToIndex, soundingNoteName, soundingPosition } from '../chord'
import type { Chord } from '../chord'

const openC: Chord = {
  id: 'c-open',
  name: 'C',
  variant: 'open',
  strings: ['x', 3, 2, 0, 1, 0],
  fingers: [null, 3, 2, null, 1, null],
  barres: [],
}

describe('guitarStringNumberToIndex', () => {
  it('converts guitar string numbers (6..1) to array indices (0..5)', () => {
    expect(guitarStringNumberToIndex(6)).toBe(0) // low E
    expect(guitarStringNumberToIndex(1)).toBe(5) // high e
    expect(guitarStringNumberToIndex(3)).toBe(3) // D string
  })
})

describe('soundingPosition', () => {
  it('returns null for a muted string', () => {
    expect(soundingPosition(openC, 0)).toBeNull() // 'x'
  })

  it('returns the fret position for a fretted string', () => {
    expect(soundingPosition(openC, 1)).toEqual({ stringIndex: 1, fret: 3 })
  })

  it('returns a position for an open string (fret 0)', () => {
    expect(soundingPosition(openC, 3)).toEqual({ stringIndex: 3, fret: 0 })
  })

  it('returns null when the chord has no strings data at all', () => {
    const nameOnly: Chord = { id: 'bdim-x', name: 'Bdim' }
    expect(soundingPosition(nameOnly, 0)).toBeNull()
  })
})

describe('soundingNoteName', () => {
  it('derives the note name from the tuning for a fretted string', () => {
    // string index 1 = A string (open A2 = MIDI 45), fret 3 => C3
    expect(soundingNoteName(openC, 1)).toBe('C3')
  })

  it('returns null for a muted string', () => {
    expect(soundingNoteName(openC, 0)).toBeNull()
  })
})
