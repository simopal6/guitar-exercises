import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { ChordList } from '../../chord'
import { getPairTempo, setPairTempo } from '../../pairTempoStore'

vi.mock('tone', () => {
  const Transport = { bpm: { value: 120 }, start: vi.fn(), stop: vi.fn() }
  class MetalSynth {
    triggerAttackRelease = vi.fn()
    dispose = vi.fn()
    toDestination() {
      return this
    }
  }
  class Loop {
    callback: (time: number) => void
    interval: string
    start = vi.fn()
    stop = vi.fn()
    dispose = vi.fn()
    constructor(callback: (time: number) => void, interval: string) {
      this.callback = callback
      this.interval = interval
    }
  }
  return { start: vi.fn().mockResolvedValue(undefined), Transport, MetalSynth, Loop }
})

import { useChordPairExercise } from '../useChordPairExercise'

function withSetup<T>(composable: () => T): { result: T; unmount: () => void } {
  let result!: T
  const wrapper = mount({
    setup() {
      result = composable()
      return () => null
    },
  })
  return { result, unmount: () => wrapper.unmount() }
}

const threeChordList: ChordList = {
  id: 'l1',
  name: 'Test',
  chords: [
    { id: 'c-open', name: 'C' },
    { id: 'a-open', name: 'A' },
    { id: 'g-open', name: 'G' },
  ],
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useChordPairExercise', () => {
  it('starts in setup with no current pair, canStart false until a list with >=2 chords is set', () => {
    const { result } = withSetup(() => useChordPairExercise())
    expect(result.phase.value).toBe('setup')
    expect(result.currentPair.value).toBeNull()
    expect(result.canStart.value).toBe(false)

    result.setSelectedList({ id: 'l2', name: 'Solo', chords: [{ id: 'x', name: 'X' }] })
    expect(result.canStart.value).toBe(false) // only 1 chord, no pair possible

    result.setSelectedList(threeChordList)
    expect(result.canStart.value).toBe(true)
  })

  it('start() moves to running and loads a pair at the base bpm for a never-seen pair', async () => {
    const { result } = withSetup(() => useChordPairExercise({ baseBpm: 50 }))
    result.setSelectedList(threeChordList)
    await result.start()

    expect(result.phase.value).toBe('running')
    expect(result.currentPair.value).not.toBeNull()
    expect(result.bpm.value).toBe(50)
  })

  it('uses the stored tempo (not the base) for a pair that was already recorded', async () => {
    setPairTempo('c-open', 'a-open', 90)
    setPairTempo('c-open', 'g-open', 90)
    setPairTempo('a-open', 'g-open', 90)

    const { result } = withSetup(() => useChordPairExercise({ baseBpm: 50 }))
    result.setSelectedList(threeChordList)
    await result.start()

    expect(result.bpm.value).toBe(90) // every possible pair was pre-seeded at 90
  })

  it('shuffled bag serves every unique pair once before any repeat', async () => {
    const { result } = withSetup(() => useChordPairExercise({ turnDurationSeconds: 10, gapSeconds: 2 }))
    result.setSelectedList(threeChordList)
    await result.start()

    const seenPairKeys = new Set<string>()
    for (let i = 0; i < 3; i++) {
      const [a, b] = result.currentPair.value!
      seenPairKeys.add([a.id, b.id].sort().join('::'))
      vi.advanceTimersByTime(10_000) // end of turn -> gap
      vi.advanceTimersByTime(2_000) // end of gap -> next turn
    }
    expect(seenPairKeys.size).toBe(3) // C-A, C-G, A-G all distinct — 3 chords = 3 unique pairs
  })

  it('adjustBpm moves in steps of 5 and persists immediately for the current pair', async () => {
    const { result } = withSetup(() => useChordPairExercise({ baseBpm: 50 }))
    result.setSelectedList(threeChordList)
    await result.start()

    result.adjustBpm(1)
    expect(result.bpm.value).toBe(55)
    const [a, b] = result.currentPair.value!
    expect(getPairTempo(a.id, b.id)).toBe(55)

    result.adjustBpm(-1)
    expect(result.bpm.value).toBe(50)
  })

  it('stop() returns to setup, clears the current pair, and stops the timer', async () => {
    const { result } = withSetup(() => useChordPairExercise())
    result.setSelectedList(threeChordList)
    await result.start()
    result.stop()

    expect(result.phase.value).toBe('setup')
    expect(result.currentPair.value).toBeNull()

    const pairBefore = result.currentPair.value
    vi.advanceTimersByTime(120_000)
    expect(result.currentPair.value).toBe(pairBefore) // no stray tick revived it
  })

  it('setSelectedList/setTurnDuration/setBaseBpm are no-ops once running', async () => {
    const { result } = withSetup(() => useChordPairExercise({ turnDurationSeconds: 60 }))
    result.setSelectedList(threeChordList)
    await result.start()

    result.setTurnDuration(180)
    result.setBaseBpm(100)
    const otherList: ChordList = { id: 'other', name: 'Other', chords: [{ id: 'x', name: 'X' }, { id: 'y', name: 'Y' }] }
    result.setSelectedList(otherList)

    expect(result.turnDurationSeconds.value).toBe(60)
    expect(result.baseBpm.value).toBe(50)
    expect(result.selectedList.value?.id).toBe('l1')
  })
})
