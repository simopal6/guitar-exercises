import { beforeEach, describe, expect, it } from 'vitest'
import { useSongRotation } from '../useSongRotation'
import { getSequenceProgress, setSequenceProgress } from '../../songProgressStore'
import type { Song } from '../../songs'

// 8 songs: not a multiple of 3, so the review batch has to wrap past the end
const songs: Song[] = Array.from({ length: 8 }, (_, i) => ({ id: `s${i + 1}`, title: `Song ${i + 1}` }))
const ids = (list: Song[]) => list.map((s) => s.id)

beforeEach(() => {
  localStorage.clear()
})

describe('useSongRotation', () => {
  it('starts both sequences at the top of the list, lap 1', () => {
    const { review, deep } = useSongRotation(songs)
    expect(ids(review.songs.value)).toEqual(['s1', 's2', 's3'])
    expect(review.positions.value).toEqual([1, 2, 3])
    expect(review.lap.value).toBe(1)
    expect(ids(deep.songs.value)).toEqual(['s1'])
    expect(deep.lap.value).toBe(1)
  })

  it('review advances by a whole batch of 3, deep by one', () => {
    const { review, deep } = useSongRotation(songs)
    review.advance()
    deep.advance()
    expect(ids(review.songs.value)).toEqual(['s4', 's5', 's6'])
    expect(ids(deep.songs.value)).toEqual(['s2'])
  })

  it('the two sequences move independently', () => {
    const { review, deep } = useSongRotation(songs)
    review.advance()
    review.advance()
    expect(ids(deep.songs.value)).toEqual(['s1'])
  })

  it('a review batch wraps past the end of the list and starts a new lap', () => {
    const { review } = useSongRotation(songs)
    review.advance() // 4-6
    review.advance() // 7, 8, 1
    expect(ids(review.songs.value)).toEqual(['s7', 's8', 's1'])
    expect(review.positions.value).toEqual([7, 8, 1])
    expect(review.lap.value).toBe(1)

    review.advance()
    expect(ids(review.songs.value)).toEqual(['s2', 's3', 's4'])
    expect(review.lap.value).toBe(2)
  })

  it('deep starts a new lap after the last song', () => {
    const { deep } = useSongRotation(songs)
    for (let i = 0; i < 8; i++) deep.advance()
    expect(ids(deep.songs.value)).toEqual(['s1'])
    expect(deep.lap.value).toBe(2)
  })

  it('back() undoes advance(), across a lap boundary too', () => {
    const { review } = useSongRotation(songs)
    review.advance()
    review.advance()
    review.advance() // lap 2, s2-s4
    review.back()
    expect(ids(review.songs.value)).toEqual(['s7', 's8', 's1'])
    expect(review.lap.value).toBe(1)
    review.back()
    review.back()
    expect(ids(review.songs.value)).toEqual(['s1', 's2', 's3'])
  })

  it('back() at the very start is a no-op', () => {
    const { review, deep } = useSongRotation(songs)
    review.back()
    deep.back()
    expect(ids(review.songs.value)).toEqual(['s1', 's2', 's3'])
    expect(review.lap.value).toBe(1)
    expect(ids(deep.songs.value)).toEqual(['s1'])
  })

  it('persists by song id, and picks up where it left off', () => {
    const first = useSongRotation(songs)
    first.review.advance()
    first.deep.advance()
    expect(getSequenceProgress('review')).toEqual({ songId: 's4', lap: 1 })

    const second = useSongRotation(songs)
    expect(ids(second.review.songs.value)).toEqual(['s4', 's5', 's6'])
    expect(ids(second.deep.songs.value)).toEqual(['s2'])
  })

  it('keeps its place when songs are inserted before the bookmark', () => {
    setSequenceProgress('deep', { songId: 's3', lap: 2 })
    const withNewSong = [{ id: 'new', title: 'New' }, ...songs]
    const { deep } = useSongRotation(withNewSong)
    expect(ids(deep.songs.value)).toEqual(['s3'])
    expect(deep.lap.value).toBe(2)
  })

  it('restarts from the top when the saved song is no longer in the list', () => {
    setSequenceProgress('review', { songId: 'gone', lap: 3 })
    const { review } = useSongRotation(songs)
    expect(ids(review.songs.value)).toEqual(['s1', 's2', 's3'])
    expect(review.lap.value).toBe(1)
  })

  it('a list shorter than 3 shows each song once in the review batch', () => {
    const { review } = useSongRotation(songs.slice(0, 2))
    expect(ids(review.songs.value)).toEqual(['s1', 's2'])
    review.advance()
    expect(ids(review.songs.value)).toEqual(['s1', 's2'])
    expect(review.lap.value).toBe(2)
  })

  it('an empty list yields no songs and advance/back do nothing', () => {
    const { review, deep } = useSongRotation([])
    expect(review.songs.value).toEqual([])
    expect(() => {
      review.advance()
      deep.back()
    }).not.toThrow()
    expect(deep.songs.value).toEqual([])
  })
})
