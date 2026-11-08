import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, shallowRef } from 'vue'
import type { BackingSequence } from '../../../../components/audio/backing/useBackingTrack'

// A stand-in band: records what it's asked to play, and lets each test decide when a sequence is "heard".
const fake = {
  bpm: ref(80),
  isRunning: ref(false),
  isLoading: ref(false),
  loadError: ref<string | null>(null),
  guitarType: ref<'acoustic' | 'electric'>('acoustic'),
  playingSequence: shallowRef<BackingSequence | null>(null),
  currentChordIndex: ref<number | null>(null),
  barInChord: ref(0),
  sequences: [] as BackingSequence[],
}
vi.mock('../../../../components/audio/backing/useBackingTrack', () => ({
  useBackingTrack: (initialBpm: number) => {
    fake.bpm.value = initialBpm
    return {
      ...fake,
      load: vi.fn().mockResolvedValue(undefined),
      setGuitarType: vi.fn().mockResolvedValue(undefined),
      setSequence: (s: BackingSequence) => fake.sequences.push(s),
      start: vi.fn(async () => {
        fake.isRunning.value = true
      }),
      stop: vi.fn(() => {
        fake.isRunning.value = false
      }),
      setBpm: (b: number) => {
        fake.bpm.value = b
      },
      dispose: vi.fn(),
    }
  },
}))

import { useModeImprov } from '../useModeImprov'
import { getModeImprovBpm } from '../../bpmStore'

function withSetup<T>(composable: () => T): T {
  let result!: T
  mount({
    setup() {
      result = composable()
      return () => null
    },
  })
  return result
}

/** Pretends the band has reached the bar where `sequence` starts, on chord `index`. */
function hear(sequence: BackingSequence, index = 0) {
  fake.playingSequence.value = sequence
  fake.currentChordIndex.value = index
}

beforeEach(() => {
  localStorage.clear()
  fake.sequences.length = 0
  fake.playingSequence.value = null
  fake.currentChordIndex.value = null
  fake.isRunning.value = false
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useModeImprov', () => {
  it('starts with the saved bpm, or 80', () => {
    expect(withSetup(useModeImprov).bpm.value).toBe(80)
  })

  it('start() draws a key and two different degrees, and hands the band their two chords', async () => {
    const improv = withSetup(useModeImprov)
    improv.setBarsPerChord(4)
    await improv.start()

    expect(improv.phase.value).toBe('running')
    const round = improv.round.value!
    expect(round.chords).toHaveLength(2)
    expect(round.chords[0].numeral).not.toBe(round.chords[1].numeral)
    expect(fake.sequences).toHaveLength(1)
    expect(fake.sequences[0].barsPerChord).toBe(4)
    expect(fake.sequences[0].chords.map((c) => c.root)).toEqual(round.chords.map((c) => c.triad.root))
  })

  it('highlights the chord the band is playing, only once it is heard', async () => {
    const improv = withSetup(useModeImprov)
    await improv.start()
    expect(improv.activeChordIndex.value).toBeNull()
    hear(fake.sequences[0], 1)
    expect(improv.activeChordIndex.value).toBe(1)
  })

  it('"Nuova estrazione" keeps showing the old chords until the band switches at the bar line', async () => {
    const improv = withSetup(useModeImprov)
    await improv.start()
    hear(fake.sequences[0])
    const first = improv.round.value

    improv.nextRound()
    expect(fake.sequences).toHaveLength(2)
    expect(improv.round.value).toBe(first) // still hearing the old pair

    hear(fake.sequences[1])
    expect(improv.round.value).not.toBe(first)
    expect(improv.round.value!.sequence).toBe(fake.sequences[1])
  })

  it('adjustBpm moves by 5 and saves one tempo for the whole sub-app', async () => {
    const improv = withSetup(useModeImprov)
    await improv.start()
    improv.adjustBpm(1)
    expect(improv.bpm.value).toBe(85)
    expect(getModeImprovBpm()).toBe(85)
  })

  it('bars per chord can only change in setup', async () => {
    const improv = withSetup(useModeImprov)
    await improv.start()
    improv.setBarsPerChord(1)
    expect(improv.barsPerChord.value).toBe(2)
  })

  it('stop() returns to setup and clears the round', async () => {
    const improv = withSetup(useModeImprov)
    await improv.start()
    improv.stop()
    expect(improv.phase.value).toBe('setup')
    expect(improv.round.value).toBeNull()
  })
})
