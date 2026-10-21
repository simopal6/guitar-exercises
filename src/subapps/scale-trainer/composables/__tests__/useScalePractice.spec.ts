import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useScalePractice } from '../useScalePractice'
import { getPatternTempo } from '../../patternTempoStore'
import { PATTERNS } from '../../patterns'

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
    getContext: () => ({ lookAhead: 0.1 }),
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
  it('starts in setup with nothing chosen yet, so practice cannot start', () => {
    const { result } = withSetup(useScalePractice)
    expect(result.phase.value).toBe('setup')
    expect(result.mode.value).toBeNull()
    expect(result.shapeId.value).toBeNull()
    expect(result.patternId.value).toBeNull()
    expect(result.canStart.value).toBe(false)
  })

  it('in "forma" mode, selecting a shape resolves its primary scale on its own, even when the shape offers more than one', () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId) // "major-e-shape" now also offers Dorian — forma mode doesn't ask
    expect(result.patternId.value).toBe(PATTERNS[0].id)
    expect(result.canStart.value).toBe(true)
  })

  it('in "scala" mode, selectScale picks directly from any scale, with no shape question first', () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('scala')
    expect(result.shapeId.value).toBeNull() // no "Forma" row/step in this mode
    result.selectScale('major-e-shape-dorian') // Dorian, without ever picking "Scala maggiore (1)" as a shape
    expect(result.patternId.value).toBe('major-e-shape-dorian')
    expect(result.shapeId.value).toBe('major-e-shape') // bookkeeping only, derived from the chosen scale
    expect(result.canStart.value).toBe(true)
  })

  it('in "scala" mode, selectScale can pick a scale belonging to a different shape right after another, with no shape step in between', () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('scala')
    result.selectScale('major-e-shape') // Ionian
    expect(result.patternId.value).toBe('major-e-shape')
    result.selectScale('major-pentatonic')
    expect(result.patternId.value).toBe('major-pentatonic')
    expect(result.shapeId.value).toBe('major-pentatonic')
  })

  it('selectScale is a no-op for an unknown id', () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('scala')
    result.selectScale('does-not-exist')
    expect(result.patternId.value).toBeNull()
  })

  it('changing mode resets the shape and pattern already chosen', () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    result.selectMode('scala')
    expect(result.shapeId.value).toBeNull()
    expect(result.patternId.value).toBeNull()
  })

  it('start() moves to running', async () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    await result.start()
    expect(result.phase.value).toBe('running')
  })

  // The dot animation (advancing currentMidi on each metronome beat) is
  // temporarily disabled — see DOT_ANIMATION_ENABLED in useScalePractice.ts —
  // because it was found to contribute to audio drift at high bpm on iOS
  // Safari. currentMidi stays null throughout practice until it's
  // re-enabled; buildUpDownSequence itself is still covered by its own
  // sequence.spec.ts regardless.
  it('currentMidi stays null across metronome beats while the dot animation is disabled', async () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    await result.start()
    expect(result.currentMidi.value).toBeNull()

    tick()
    tick()
    expect(result.currentMidi.value).toBeNull()
  })

  it('stop() returns to setup', async () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    await result.start()
    tick()
    result.stop()
    expect(result.phase.value).toBe('setup')
  })

  it('adjustBpm persists the new tempo for the current pattern', async () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    await result.start()
    result.adjustBpm(1)
    expect(result.bpm.value).toBe(90) // default 80 + 10
    expect(getPatternTempo(`${result.patternId.value}:forma`)).toBe(90)
  })

  it('the setup-screen bpm preview reflects an adjustment made during practice, after stopping', async () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    await result.start()
    result.adjustBpm(1) // 80 -> 90
    result.stop()
    expect(result.patternBpmPreview.value).toBe(90)
  })

  it('a different shape starts at its own previously-saved tempo, independent of others', async () => {
    const { result: first } = withSetup(useScalePractice)
    first.selectMode('forma')
    first.selectShape(PATTERNS[0].shapeId)
    await first.start()
    first.adjustBpm(2) // 80 -> 100
    first.stop()

    first.selectShape(PATTERNS[1].shapeId)
    await first.start()
    expect(first.bpm.value).toBe(80) // never touched before, falls back to the default
  })

  it('selectMode, selectShape and selectScale are no-ops once running', async () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    await result.start()
    result.selectMode('scala')
    result.selectShape(PATTERNS[1].shapeId)
    result.selectScale('major-e-shape-dorian')
    expect(result.mode.value).toBe('forma')
    expect(result.patternId.value).toBe(PATTERNS[0].id)
  })

  describe('"scala" mode (one root-to-root octave)', () => {
    function setupScala(result: ReturnType<typeof useScalePractice>) {
      result.selectMode('scala')
      result.selectScale('major-e-shape') // Ionian, picked directly — no shape step in "scala" mode
    }

    it('finds the two complete octaves of "Scala maggiore (1)", defaulting to the first one', () => {
      const { result } = withSetup(useScalePractice)
      setupScala(result)
      expect(result.patternId.value).toBe('major-e-shape')
      expect(result.completeOctaves.value).toEqual([
        { lowMidi: 43, highMidi: 55 },
        { lowMidi: 55, highMidi: 67 },
      ])
      expect(result.selectedOctaveIndex.value).toBe(0)
    })

    // Which pitches get stepped through (stepMidis, filtered to the chosen
    // octave) is unaffected by the dot animation being disabled — only
    // currentMidi (the visual highlight) stays null while it is.
    it('running with an octave selected still leaves currentMidi null, like "forma" mode', async () => {
      const { result } = withSetup(useScalePractice)
      setupScala(result)
      await result.start()
      expect(result.currentMidi.value).toBeNull()

      tick()
      expect(result.currentMidi.value).toBeNull()
    })

    it('switching to the other octave still changes which complete octave is selected', async () => {
      const { result } = withSetup(useScalePractice)
      setupScala(result)
      result.selectOctave(1)
      expect(result.selectedOctaveIndex.value).toBe(1)
      await result.start()
      expect(result.currentMidi.value).toBeNull()
    })

    it('selectOctave is a no-op once running', async () => {
      const { result } = withSetup(useScalePractice)
      setupScala(result)
      await result.start()
      result.selectOctave(1)
      expect(result.selectedOctaveIndex.value).toBe(0)
    })

    it('remembers tempo separately for "forma", and for each octave of "scala"', async () => {
      const { result } = withSetup(useScalePractice)

      result.selectMode('forma')
      result.selectShape('major-e-shape')
      await result.start() // forma
      result.adjustBpm(1) // 80 -> 90
      result.stop()

      setupScala(result) // octave 0
      await result.start()
      expect(result.bpm.value).toBe(80) // never touched before, independent of "forma"'s 90
      result.adjustBpm(2) // 80 -> 100
      result.stop()

      result.selectOctave(1) // octave 1, still untouched
      await result.start()
      expect(result.bpm.value).toBe(80)
      result.stop()

      result.selectOctave(0)
      await result.start()
      expect(result.bpm.value).toBe(100) // octave 0's own tempo, preserved
    })
  })
})
