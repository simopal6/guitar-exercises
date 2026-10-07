import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useScalePractice } from '../useScalePractice'
import { getPatternTempo } from '../../patternTempoStore'
import { PATTERNS } from '../../patterns'
import { buildUpDownSequence } from '../../sequence'

vi.mock('tone', () => {
  const Transport = { bpm: { value: 120 }, start: vi.fn(), stop: vi.fn() }
  class MetalSynth {
    triggerAttackRelease = vi.fn()
    dispose = vi.fn()
    toDestination() {
      return this
    }
  }
  let lastLoop: InstanceType<typeof Loop> | null = null
  class Loop {
    callback: (time: number) => void
    interval: string
    start = vi.fn()
    stop = vi.fn()
    dispose = vi.fn()
    constructor(callback: (time: number) => void, interval: string) {
      this.callback = callback
      this.interval = interval
      lastLoop = this
    }
  }
  return {
    start: vi.fn().mockResolvedValue(undefined),
    Transport,
    MetalSynth,
    Loop,
    __getLastLoop: () => lastLoop,
  }
})

import * as Tone from 'tone'

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

function tick() {
  ;(Tone as unknown as { __getLastLoop: () => { callback: (t: number) => void } }).__getLastLoop().callback(0)
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useScalePractice', () => {
  it('starts in setup, defaulting to the first known pattern', () => {
    const { result } = withSetup(useScalePractice)
    expect(result.phase.value).toBe('setup')
    expect(result.patternId.value).toBe(PATTERNS[0].id)
    expect(result.canStart.value).toBe(true)
  })

  it('start() moves to running and highlights the first note of the up/down sequence', async () => {
    const { result } = withSetup(useScalePractice)
    await result.start()
    expect(result.phase.value).toBe('running')
    const expectedSequence = buildUpDownSequence(result.notes.value.length)
    expect(result.currentNoteIndex.value).toBe(expectedSequence[0])
  })

  it('advances the highlighted note by one step on each metronome beat', async () => {
    const { result } = withSetup(useScalePractice)
    await result.start()
    const sequence = buildUpDownSequence(result.notes.value.length)

    tick()
    expect(result.currentNoteIndex.value).toBe(sequence[1])

    tick()
    expect(result.currentNoteIndex.value).toBe(sequence[2])
  })

  it('loops the sequence around without stopping', async () => {
    const { result } = withSetup(useScalePractice)
    await result.start()
    const sequence = buildUpDownSequence(result.notes.value.length)

    for (let i = 0; i < sequence.length; i++) tick()
    // back to the start of the next period
    expect(result.currentNoteIndex.value).toBe(sequence[0])
  })

  it('stop() returns to setup and further beats no longer advance the note', async () => {
    const { result } = withSetup(useScalePractice)
    await result.start()
    tick()
    const indexAtStop = result.currentNoteIndex.value
    result.stop()
    expect(result.phase.value).toBe('setup')

    tick()
    expect(result.currentNoteIndex.value).toBe(indexAtStop) // no longer subscribed
  })

  it('adjustBpm persists the new tempo for the current pattern', async () => {
    const { result } = withSetup(useScalePractice)
    await result.start()
    result.adjustBpm(1)
    expect(result.bpm.value).toBe(65) // default 60 + 5
    expect(getPatternTempo(result.patternId.value!)).toBe(65)
  })

  it('the setup-screen bpm preview reflects an adjustment made during practice, after stopping', async () => {
    const { result } = withSetup(useScalePractice)
    await result.start()
    result.adjustBpm(1) // 60 -> 65
    result.stop()
    expect(result.patternBpmPreview.value).toBe(65)
  })

  it('a different pattern starts at its own previously-saved tempo, independent of others', async () => {
    const { result: first } = withSetup(useScalePractice)
    await first.start()
    first.adjustBpm(2) // 60 -> 70
    first.stop()

    first.selectPattern(PATTERNS[1].id)
    await first.start()
    expect(first.bpm.value).toBe(60) // never touched before, falls back to the default
  })

  it('selectPattern is a no-op once running', async () => {
    const { result } = withSetup(useScalePractice)
    await result.start()
    result.selectPattern(PATTERNS[1].id)
    expect(result.patternId.value).toBe(PATTERNS[0].id)
  })
})
