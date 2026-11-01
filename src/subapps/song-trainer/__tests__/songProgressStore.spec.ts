import { beforeEach, describe, expect, it } from 'vitest'
import { getSequenceProgress, setSequenceProgress } from '../songProgressStore'

beforeEach(() => {
  localStorage.clear()
})

describe('songProgressStore', () => {
  it('returns undefined for a sequence that was never advanced', () => {
    expect(getSequenceProgress('review')).toBeUndefined()
    expect(getSequenceProgress('deep')).toBeUndefined()
  })

  it('round-trips a sequence position', () => {
    setSequenceProgress('review', { songId: 'canzone-4', lap: 2 })
    expect(getSequenceProgress('review')).toEqual({ songId: 'canzone-4', lap: 2 })
  })

  it('keeps the two sequences independent', () => {
    setSequenceProgress('review', { songId: 'canzone-4', lap: 1 })
    setSequenceProgress('deep', { songId: 'canzone-2', lap: 3 })
    setSequenceProgress('review', { songId: 'canzone-7', lap: 1 })
    expect(getSequenceProgress('deep')).toEqual({ songId: 'canzone-2', lap: 3 })
  })

  it('does not throw on malformed stored JSON', () => {
    localStorage.setItem('guitar-exercises.song-trainer.progress', '{not json')
    expect(getSequenceProgress('review')).toBeUndefined()
    expect(() => setSequenceProgress('review', { songId: 'canzone-1', lap: 1 })).not.toThrow()
  })

  it('ignores a stored value with the wrong shape', () => {
    localStorage.setItem('guitar-exercises.song-trainer.progress', JSON.stringify({ review: { songId: 3, lap: 'x' } }))
    expect(getSequenceProgress('review')).toBeUndefined()
  })
})
