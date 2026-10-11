import { describe, expect, it } from 'vitest'
import { findCompleteOctaves, octaveLabel } from '../octaves'
import { MAJOR_SCALE, STANDARD_TUNING } from '../../../theory'
import { derivePatternNotes, dropRedundantMarginNotes, rootMidiOf } from '../patternNotes'
import { STANDARD_BOX_SIZE } from '../pattern'
import { PATTERNS } from '../patterns'

const MAJOR_FORMULA = MAJOR_SCALE.formula // [0, 2, 4, 5, 7, 9, 11]

describe('findCompleteOctaves', () => {
  it('finds no octave when no two root instances are 12 semitones apart', () => {
    const distinctMidis = [40, 42, 44, 45, 47, 49, 51] // a single partial run, no repeated root
    expect(findCompleteOctaves(distinctMidis, 40, MAJOR_FORMULA)).toEqual([])
  })

  it('does not count a root-to-root span as complete if a degree in between is missing', () => {
    // root at 40 and 52 (12 apart), but 47 (the 5th, offset 7) is missing
    const distinctMidis = [40, 42, 44, 45, 49, 51, 52]
    expect(findCompleteOctaves(distinctMidis, 40, MAJOR_FORMULA)).toEqual([])
  })

  it('finds exactly one complete octave when every degree in between is present', () => {
    const distinctMidis = [40, 42, 44, 45, 47, 49, 51, 52]
    expect(findCompleteOctaves(distinctMidis, 40, MAJOR_FORMULA)).toEqual([{ lowMidi: 40, highMidi: 52 }])
  })

  it('finds two complete octaves when three root instances are each 12 semitones apart with every degree present', () => {
    const distinctMidis = [40, 42, 44, 45, 47, 49, 51, 52, 54, 56, 57, 59, 61, 63, 64]
    expect(findCompleteOctaves(distinctMidis, 40, MAJOR_FORMULA)).toEqual([
      { lowMidi: 40, highMidi: 52 },
      { lowMidi: 52, highMidi: 64 },
    ])
  })

  it('ignores stray notes that are neither a scale degree nor a root instance', () => {
    const distinctMidis = [40, 42, 44, 45, 47, 49, 51, 52, 53] // 53 is just noise, not part of the scale
    expect(findCompleteOctaves(distinctMidis, 40, MAJOR_FORMULA)).toEqual([{ lowMidi: 40, highMidi: 52 }])
  })

  describe('on the real patterns', () => {
    function completeOctavesFor(patternId: string) {
      const pattern = PATTERNS.find((p) => p.id === patternId)!
      const derived = derivePatternNotes(pattern, MAJOR_SCALE, STANDARD_TUNING)
      const boxStart = pattern.root.fret - pattern.rootOffsetInBox
      const boxEnd = boxStart + STANDARD_BOX_SIZE - 1
      const notes = dropRedundantMarginNotes(derived, boxStart, boxEnd)
      const distinctMidis = [...new Set(notes.map((n) => n.midi))].sort((a, b) => a - b)
      return findCompleteOctaves(distinctMidis, rootMidiOf(pattern, STANDARD_TUNING), MAJOR_SCALE.formula)
    }

    it('finds two complete octaves for "Scala maggiore (1)" (root 6th string, 3rd fret)', () => {
      expect(completeOctavesFor('major-e-shape')).toEqual([
        { lowMidi: 43, highMidi: 55 },
        { lowMidi: 55, highMidi: 67 },
      ])
    })

    it('finds a single complete octave for "Scala maggiore (2)" (root 5th string, 7th fret)', () => {
      expect(completeOctavesFor('major-a-shape')).toEqual([{ lowMidi: 52, highMidi: 64 }])
    })
  })
})

describe('octaveLabel', () => {
  it('labels the common 2-octave case as "bassa"/"alta"', () => {
    expect(octaveLabel(0, 2)).toBe('Ottava bassa')
    expect(octaveLabel(1, 2)).toBe('Ottava alta')
  })

  it('falls back to a numbered label for any other count', () => {
    expect(octaveLabel(0, 3)).toBe('Ottava 1')
    expect(octaveLabel(1, 3)).toBe('Ottava 2')
    expect(octaveLabel(2, 3)).toBe('Ottava 3')
  })
})
