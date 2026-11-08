import { describe, expect, it } from 'vitest'
import {
  chordSymbol,
  diatonicTriad,
  majorKeyName,
  majorScaleSpelling,
  modeScale,
  romanNumeral,
  triadFifth,
} from '../diatonic'
import { AEOLIAN_SCALE, DORIAN_SCALE, LOCRIAN_SCALE, LYDIAN_SCALE, MAJOR_SCALE, MIXOLYDIAN_SCALE, PHRYGIAN_SCALE, scaleDegree } from '../scales'
import type { PitchClass } from '../notes'

const ALL_KEYS = Array.from({ length: 12 }, (_, i) => i as PitchClass)
const DEGREES = [1, 2, 3, 4, 5, 6, 7]

describe('diatonicTriad', () => {
  it('stacks thirds into I maj, ii min, iii min, IV maj, V maj, vi min, vii dim, in every key', () => {
    for (const key of ALL_KEYS) {
      expect(DEGREES.map((d) => diatonicTriad(key, d).quality)).toEqual(['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'])
    }
  })

  it('roots each triad on the matching note of the major scale', () => {
    // G major: G A B C D E F#
    expect(DEGREES.map((d) => diatonicTriad(7, d).root)).toEqual([7, 9, 11, 0, 2, 4, 6])
  })

  it('uses a diminished fifth (6) only for the diminished triad', () => {
    expect(triadFifth('maj')).toBe(7)
    expect(triadFifth('min')).toBe(7)
    expect(triadFifth('dim')).toBe(6)
  })
})

describe('romanNumeral', () => {
  it('writes I ii iii IV V vi vii°', () => {
    expect(DEGREES.map((d) => romanNumeral(d, diatonicTriad(0, d).quality))).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
  })
})

describe('majorScaleSpelling', () => {
  it('uses the usual key names', () => {
    expect(ALL_KEYS.map(majorKeyName)).toEqual(['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'])
  })

  it('spells every key with each letter exactly once, never mixing sharps and flats', () => {
    for (const key of ALL_KEYS) {
      const names = majorScaleSpelling(key)
      expect(new Set(names.map((n) => n[0])).size).toBe(7)
      const usesSharps = names.some((n) => n.includes('#'))
      const usesFlats = names.some((n) => n.includes('b'))
      expect(usesSharps && usesFlats).toBe(false)
    }
  })

  it('spells the trickier keys as a musician would', () => {
    expect(majorScaleSpelling(6)).toEqual(['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'])
    expect(majorScaleSpelling(1)).toEqual(['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'])
    expect(majorScaleSpelling(3)).toEqual(['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'])
  })
})

describe('chordSymbol', () => {
  it('names the diatonic chords of a key', () => {
    expect(DEGREES.map((d) => chordSymbol(0, diatonicTriad(0, d)))).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'])
    expect(DEGREES.map((d) => chordSymbol(3, diatonicTriad(3, d)))).toEqual(['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'])
    expect(chordSymbol(6, diatonicTriad(6, 7))).toBe('E#dim')
  })
})

describe('modeScale', () => {
  const marks = (degree: number) => {
    const mode = modeScale(degree)
    return mode.degrees.flatMap((d, i) => (mode.flats![i] ? [`b${d}`] : mode.sharps![i] ? [`#${d}`] : []))
  }

  it('names the seven modes in order', () => {
    expect(DEGREES.map((d) => modeScale(d).name)).toEqual(['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'])
  })

  it('marks each mode\'s alterations relative to the major scale', () => {
    expect(marks(1)).toEqual([])
    expect(marks(2)).toEqual(['b3', 'b7'])
    expect(marks(3)).toEqual(['b2', 'b3', 'b6', 'b7'])
    expect(marks(4)).toEqual(['#4'])
    expect(marks(5)).toEqual(['b7'])
    expect(marks(6)).toEqual(['b3', 'b6', 'b7'])
    expect(marks(7)).toEqual(['b2', 'b3', 'b5', 'b6', 'b7'])
  })

  it('matches the hand-written major, Dorian and Phrygian scales', () => {
    expect(modeScale(1).formula).toEqual(MAJOR_SCALE.formula)
    expect(modeScale(2).formula).toEqual(DORIAN_SCALE.formula)
    expect(modeScale(2).flats).toEqual(DORIAN_SCALE.flats)
    expect(modeScale(3).formula).toEqual(PHRYGIAN_SCALE.formula)
    expect(modeScale(3).flats).toEqual(PHRYGIAN_SCALE.flats)
  })

  it('matches the hand-written Lydian, Mixolydian, Aeolian and Locrian scales', () => {
    const marks = (flats?: boolean[], sharps?: boolean[]) => [0, 1, 2, 3, 4, 5, 6].map((i) => (flats?.[i] ? 'b' : sharps?.[i] ? '#' : ''))
    ;[LYDIAN_SCALE, MIXOLYDIAN_SCALE, AEOLIAN_SCALE, LOCRIAN_SCALE].forEach((scale, i) => {
      const mode = modeScale(i + 4)
      expect(scale.id).toBe(mode.id)
      expect(scale.formula).toEqual(mode.formula)
      expect(marks(scale.flats, scale.sharps)).toEqual(marks(mode.flats, mode.sharps))
    })
  })

  it('numbers degrees from the mode\'s own root, so the b3 of Dorian is degree 3', () => {
    expect(scaleDegree(modeScale(2), 3)).toBe(3)
    expect(scaleDegree(modeScale(4), 6)).toBe(4) // Lydian #4
  })
})
