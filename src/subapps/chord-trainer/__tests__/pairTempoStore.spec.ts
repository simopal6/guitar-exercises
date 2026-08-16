import { beforeEach, describe, expect, it } from 'vitest'
import { getPairTempo, pairKey, setPairTempo } from '../pairTempoStore'

beforeEach(() => {
  localStorage.clear()
})

describe('pairKey', () => {
  it('is independent of argument order', () => {
    expect(pairKey('c-open', 'g-open')).toBe(pairKey('g-open', 'c-open'))
  })

  it('differs for different pairs', () => {
    expect(pairKey('c-open', 'g-open')).not.toBe(pairKey('c-open', 'a-open'))
  })
})

describe('pairTempoStore', () => {
  it('returns undefined for a pair that has never been recorded', () => {
    expect(getPairTempo('c-open', 'g-open')).toBeUndefined()
  })

  it('stores and retrieves the absolute bpm for a pair, regardless of call order', () => {
    setPairTempo('c-open', 'g-open', 65)
    expect(getPairTempo('c-open', 'g-open')).toBe(65)
    expect(getPairTempo('g-open', 'c-open')).toBe(65)
  })

  it('overwrites the stored bpm on a later call (immediate persistence, no "only if higher" rule)', () => {
    setPairTempo('c-open', 'g-open', 65)
    setPairTempo('c-open', 'g-open', 40) // a lower value must still overwrite — tempo is not a "best score"
    expect(getPairTempo('c-open', 'g-open')).toBe(40)
  })

  it('keeps different pairs independent', () => {
    setPairTempo('c-open', 'g-open', 65)
    setPairTempo('c-open', 'a-open', 90)
    expect(getPairTempo('c-open', 'g-open')).toBe(65)
    expect(getPairTempo('c-open', 'a-open')).toBe(90)
  })
})
