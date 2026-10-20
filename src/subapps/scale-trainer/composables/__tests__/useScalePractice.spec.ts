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

/** Mirrors useScalePractice's own distinctMidis: notes are already pitch-sorted, so Set insertion order is ascending. */
function distinctMidis(notes: { midi: number }[]): number[] {
  return [...new Set(notes.map((n) => n.midi))]
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

  it('start() moves to running and highlights the first pitch of the up/down sequence', async () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    await result.start()
    expect(result.phase.value).toBe('running')
    const midis = distinctMidis(result.notes.value)
    const expectedSequence = buildUpDownSequence(midis.length)
    expect(result.currentMidi.value).toBe(midis[expectedSequence[0]])
  })

  it('advances the highlighted pitch by one step on each metronome beat', async () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    await result.start()
    const midis = distinctMidis(result.notes.value)
    const sequence = buildUpDownSequence(midis.length)

    tick()
    expect(result.currentMidi.value).toBe(midis[sequence[1]])

    tick()
    expect(result.currentMidi.value).toBe(midis[sequence[2]])
  })

  it('loops the sequence around without stopping', async () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    await result.start()
    const midis = distinctMidis(result.notes.value)
    const sequence = buildUpDownSequence(midis.length)

    for (let i = 0; i < sequence.length; i++) tick()
    // back to the start of the next period
    expect(result.currentMidi.value).toBe(midis[sequence[0]])
  })

  it('stop() returns to setup and further beats no longer advance the note', async () => {
    const { result } = withSetup(useScalePractice)
    result.selectMode('forma')
    result.selectShape(PATTERNS[0].shapeId)
    await result.start()
    tick()
    const midiAtStop = result.currentMidi.value
    result.stop()
    expect(result.phase.value).toBe('setup')

    tick()
    expect(result.currentMidi.value).toBe(midiAtStop) // no longer subscribed
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

    it('steps only through the chosen octave, starting and ending exactly on its root', async () => {
      const { result } = withSetup(useScalePractice)
      setupScala(result)
      await result.start()

      const octave = result.completeOctaves.value[0]
      const octaveMidis = [...new Set(result.notes.value.map((n) => n.midi))].filter(
        (m) => m >= octave.lowMidi && m <= octave.highMidi,
      )
      const sequence = buildUpDownSequence(octaveMidis.length)

      // first step is the low root
      expect(result.currentMidi.value).toBe(octave.lowMidi)

      // walk a whole period: every step stays within the octave, and the top of the "up" leg is the high root
      for (let i = 1; i < sequence.length; i++) {
        tick()
        expect(result.currentMidi.value).toBeGreaterThanOrEqual(octave.lowMidi)
        expect(result.currentMidi.value).toBeLessThanOrEqual(octave.highMidi)
      }
      // back to the low root at the start of the next period
      tick()
      expect(result.currentMidi.value).toBe(octave.lowMidi)
    })

    it('switching to the other octave changes which pitches are stepped through', async () => {
      const { result } = withSetup(useScalePractice)
      setupScala(result)
      result.selectOctave(1)
      await result.start()

      const octave = result.completeOctaves.value[1]
      expect(result.currentMidi.value).toBe(octave.lowMidi)
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
