import type { PitchClass } from './notes'
import { MAJOR_SCALE, type Scale } from './scales'

export type TriadQuality = 'maj' | 'min' | 'dim'

export interface DiatonicTriad {
  /** 1..7, position of the chord's root in the key's major scale. */
  degree: number
  root: PitchClass
  quality: TriadQuality
}

const MAJOR_FORMULA = MAJOR_SCALE.formula // [0, 2, 4, 5, 7, 9, 11]

/** Semitones from the key's root to its `index`-th scale note, counting past the octave (index 7 = 12, 9 = 16, ...). */
function majorScaleOffset(index: number): number {
  return MAJOR_FORMULA[index % 7] + 12 * Math.floor(index / 7)
}

/**
 * The triad built on `degree` of a major key by stacking two scale thirds
 * (scale notes d, d+2, d+4) — the quality falls out of the resulting
 * intervals rather than being looked up, so I/IV/V come out major, ii/iii/vi
 * minor and vii diminished on their own.
 */
export function diatonicTriad(keyRoot: PitchClass, degree: number): DiatonicTriad {
  const i = degree - 1
  const third = majorScaleOffset(i + 2) - majorScaleOffset(i)
  const fifth = majorScaleOffset(i + 4) - majorScaleOffset(i)
  let quality: TriadQuality
  if (third === 4 && fifth === 7) quality = 'maj'
  else if (third === 3 && fifth === 7) quality = 'min'
  else if (third === 3 && fifth === 6) quality = 'dim'
  else throw new RangeError(`unexpected stacked-thirds triad on degree ${degree}: third ${third}, fifth ${fifth}`)
  return { degree, root: ((keyRoot + MAJOR_FORMULA[i]) % 12) as PitchClass, quality }
}

/** Semitones from the root to the triad's fifth — the bass line needs the real one (diminished = 6), not always 7. */
export function triadFifth(quality: TriadQuality): number {
  return quality === 'dim' ? 6 : 7
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

/** Upper case for major, lower case for minor and diminished, ° for diminished: I ii iii IV V vi vii°. */
export function romanNumeral(degree: number, quality: TriadQuality): string {
  const numeral = ROMAN[degree - 1]
  if (quality === 'maj') return numeral
  return quality === 'dim' ? `${numeral.toLowerCase()}°` : numeral.toLowerCase()
}

export const MODE_NAMES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'] as const

/**
 * The mode on `degree` of the major scale: the major scale read starting from
 * its `degree`-th note. Each note keeps its degree number relative to the new
 * root (1..7) and is marked flat or sharp where it differs from the major
 * scale built on that same root — e.g. Dorian's b3/b7, Lydian's #4.
 */
export function modeScale(degree: number): Scale {
  const start = degree - 1
  const formula = Array.from({ length: 7 }, (_, i) => majorScaleOffset(start + i) - majorScaleOffset(start))
  const name = MODE_NAMES[start]
  return {
    id: name.toLowerCase(),
    name,
    formula,
    degrees: [1, 2, 3, 4, 5, 6, 7],
    flats: formula.map((semitones, i) => semitones < MAJOR_FORMULA[i]),
    sharps: formula.map((semitones, i) => semitones > MAJOR_FORMULA[i]),
  }
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const LETTER_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11]

/** The usual name of each major key, by pitch class: flats where a flat key is the common choice, F# for the six-sharp/six-flat key. */
const KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

export function majorKeyName(keyRoot: PitchClass): string {
  return KEY_NAMES[keyRoot]
}

/**
 * The 7 note names of a major key, spelled the way a musician would: one
 * note per letter, starting from the key's usual name, with whatever sharps
 * or flats that takes (so F# major ends on E#, Db major has Gb as its 4th).
 * Index 0 = degree 1.
 */
export function majorScaleSpelling(keyRoot: PitchClass): string[] {
  const firstLetter = LETTERS.indexOf(KEY_NAMES[keyRoot][0] as (typeof LETTERS)[number])
  return MAJOR_FORMULA.map((semitones, i) => {
    const letterIndex = (firstLetter + i) % 7
    const target = (keyRoot + semitones) % 12
    // -2..+2: how far the target pitch sits from the plain letter
    const shift = ((target - LETTER_PITCH_CLASSES[letterIndex] + 18) % 12) - 6
    const accidental = shift >= 0 ? '#'.repeat(shift) : 'b'.repeat(-shift)
    return LETTERS[letterIndex] + accidental
  })
}

/** e.g. "C", "Am", "Bdim" — the root spelled within its key. */
export function chordSymbol(keyRoot: PitchClass, triad: DiatonicTriad): string {
  const suffix = triad.quality === 'maj' ? '' : triad.quality === 'min' ? 'm' : 'dim'
  return majorScaleSpelling(keyRoot)[triad.degree - 1] + suffix
}
