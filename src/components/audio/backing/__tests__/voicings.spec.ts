import { describe, expect, it } from 'vitest'
import { voicing } from '../voicings'
import type { PitchClass, TriadQuality } from '../../../../theory'

const ALL_ROOTS = Array.from({ length: 12 }, (_, i) => i as PitchClass)
const INTERVALS: Record<TriadQuality, number[]> = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6] }

describe('voicing', () => {
  for (const quality of ['maj', 'min', 'dim'] as TriadQuality[]) {
    it(`plays exactly the triad's notes, lowest note on the root, for every ${quality} chord`, () => {
      for (const root of ALL_ROOTS) {
        const sounding = voicing(root, quality).midi.filter((m): m is number => m !== null)
        const pitchClasses = new Set(sounding.map((m) => (m - root + 120) % 12))
        expect([...pitchClasses].sort((a, b) => a - b)).toEqual(INTERVALS[quality])
        expect(sounding[0] % 12).toBe(root)
      }
    })
  }

  it('picks the lower of the E-shape and A-shape barre, E on a tie', () => {
    expect(voicing(4, 'maj')).toMatchObject({ shape: 'E', fret: 0 }) // E: open
    expect(voicing(2, 'maj')).toMatchObject({ shape: 'A', fret: 5 }) // D: A-shape at 5 beats E-shape at 10
    expect(voicing(9, 'min')).toMatchObject({ shape: 'A', fret: 0 }) // Am: open
    expect(voicing(7, 'maj')).toMatchObject({ shape: 'E', fret: 3 }) // G: E-shape at 3
  })

  it('uses the diminished shapes as given: E [0,1,2,0,x,x], A [x,0,1,2,1,x]', () => {
    // F#dim: E-shape at fret 2 → F#2 C3 F#3 A3
    expect(voicing(6, 'dim').midi).toEqual([42, 48, 54, 57, null, null])
    // Bdim: A-shape at fret 2 → B2 F3 B3 D4
    expect(voicing(11, 'dim').midi).toEqual([null, 47, 53, 59, 62, null])
  })
})
