import { describe, expect, it } from 'vitest'
import { STANDARD_TUNING } from '../tuning'
import { positionToMidi, positionToNoteName, semitoneDistance } from '../fretboard'

// String indices in STANDARD_TUNING: 0=E 1=A 2=D 3=G 4=B 5=e
describe('fretboard', () => {
  it('computes MIDI pitch from an open low-E string', () => {
    expect(positionToMidi(STANDARD_TUNING, { stringIndex: 0, fret: 0 })).toBe(40)
  })

  it('names the open high-e string E4', () => {
    expect(positionToNoteName(STANDARD_TUNING, { stringIndex: 5, fret: 0 })).toBe('E4')
  })

  it('finds a perfect fourth (5 semitones) between D and G open strings', () => {
    const d = { stringIndex: 2, fret: 0 }
    const g = { stringIndex: 3, fret: 0 }
    expect(semitoneDistance(STANDARD_TUNING, d, g)).toBe(5)
  })

  it('finds a major third (4 semitones) between G and B open strings, with no special case in the code', () => {
    const g = { stringIndex: 3, fret: 0 }
    const b = { stringIndex: 4, fret: 0 }
    expect(semitoneDistance(STANDARD_TUNING, g, b)).toBe(4)
  })

  it('handles a string-skipping pair (low E to D) correctly', () => {
    const lowE = { stringIndex: 0, fret: 0 }
    const d = { stringIndex: 2, fret: 0 }
    expect(semitoneDistance(STANDARD_TUNING, lowE, d)).toBe(10)
  })
})
