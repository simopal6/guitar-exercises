import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('tone', () => {
  const transport = {
    bpm: { value: 120 },
    position: 0 as number | string,
    start: vi.fn(),
    stop: vi.fn(),
    clear: vi.fn(),
    callback: null as ((time: number) => void) | null,
    scheduleRepeat: vi.fn(function (this: unknown, cb: (time: number) => void) {
      transport.callback = cb
      return 7
    }),
  }
  const samplers: Sampler[] = []
  class Node {
    volume = { value: 0 }
    dispose = vi.fn()
    connect() {
      return this
    }
    toDestination() {
      return this
    }
  }
  class Sampler extends Node {
    options: { baseUrl: string; onload: () => void }
    triggerAttack = vi.fn()
    triggerAttackRelease = vi.fn()
    triggerRelease = vi.fn()
    releaseAll = vi.fn()
    constructor(options: { baseUrl: string; onload: () => void }) {
      super()
      this.options = options
      samplers.push(this)
      queueMicrotask(options.onload)
    }
  }
  return {
    start: vi.fn().mockResolvedValue(undefined),
    getTransport: () => transport,
    getDraw: () => ({ schedule: (cb: () => void) => cb() }),
    Frequency: (midi: number) => ({ toNote: () => `m${midi}` }),
    Time: () => ({ toSeconds: () => 0.25 }),
    Sampler,
    Limiter: Node,
    Freeverb: Node,
    Volume: Node,
    __transport: transport,
    __samplers: samplers,
  }
})

import * as Tone from 'tone'
import { useBackingTrack, type BackingSequence } from '../useBackingTrack'

const mock = Tone as unknown as {
  __transport: { callback: (time: number) => void; scheduleRepeat: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; bpm: { value: number } }
  __samplers: { options: { baseUrl: string }; triggerAttack: ReturnType<typeof vi.fn>; triggerAttackRelease: ReturnType<typeof vi.fn>; releaseAll: ReturnType<typeof vi.fn> }[]
}
const sampler = (dir: string) => mock.__samplers.filter((s) => s.options.baseUrl.endsWith(`${dir}/`)).at(-1)!

/** Runs `bars` full bars of eighth-note ticks. */
function playBars(bars: number) {
  for (let i = 0; i < bars * 8; i++) mock.__transport.callback(i)
}

const amToD: BackingSequence = { chords: [{ root: 9, quality: 'min' }, { root: 2, quality: 'maj' }], barsPerChord: 2 }

beforeEach(() => {
  vi.clearAllMocks()
  mock.__samplers.length = 0
})

describe('useBackingTrack', () => {
  it('loads drums, bass and only the acoustic guitar up front, from the app base path', async () => {
    const track = useBackingTrack(80)
    await track.load()
    const dirs = mock.__samplers.map((s) => s.options.baseUrl)
    expect(dirs).toEqual(['/samples/drums/', '/samples/bass/', '/samples/gtr-acoustic/'])
    expect(track.isLoading.value).toBe(false)
  })

  it('downloads the electric guitar only once it is picked', async () => {
    const track = useBackingTrack(80)
    await track.load()
    await track.setGuitarType('electric')
    expect(mock.__samplers.some((s) => s.options.baseUrl.endsWith('gtr-electric/'))).toBe(true)
    expect(track.guitarType.value).toBe('electric')
  })

  it('start() schedules one eighth-note tick at the chosen bpm and starts the Transport', async () => {
    const track = useBackingTrack(85)
    track.setSequence(amToD)
    await track.start()
    expect(mock.__transport.scheduleRepeat).toHaveBeenCalledTimes(1)
    expect(mock.__transport.scheduleRepeat.mock.calls[0][1]).toBe('8n')
    expect(mock.__transport.bpm.value).toBe(85)
    expect(track.isRunning.value).toBe(true)
  })

  it('holds each chord for barsPerChord bars, alternating, and reports the one being heard', async () => {
    const track = useBackingTrack(80)
    track.setSequence(amToD)
    await track.start()

    playBars(1)
    expect(track.currentChordIndex.value).toBe(0)
    playBars(1)
    expect(track.currentChordIndex.value).toBe(0)
    expect(track.barInChord.value).toBe(1)
    playBars(1)
    expect(track.currentChordIndex.value).toBe(1)
    playBars(2)
    expect(track.currentChordIndex.value).toBe(0)
  })

  it('plays the bass on each chord root (A1 for Am, D2 for D)', async () => {
    const track = useBackingTrack(80)
    track.setSequence({ ...amToD, barsPerChord: 1 })
    await track.start()
    playBars(2)
    const bassNotes = sampler('bass').triggerAttackRelease.mock.calls.map((c) => c[0])
    expect(bassNotes[0]).toBe('m33')
    expect(bassNotes[8]).toBe('m38')
  })

  it('a new sequence set while playing takes over at the next bar line, from its first chord', async () => {
    const track = useBackingTrack(80)
    track.setSequence(amToD)
    await track.start()
    for (let i = 0; i < 3; i++) mock.__transport.callback(i) // mid-bar

    const next: BackingSequence = { chords: [{ root: 0, quality: 'maj' }, { root: 11, quality: 'dim' }], barsPerChord: 2 }
    track.setSequence(next)
    expect(track.playingSequence.value).toBe(amToD) // not yet: still in the old bar
    for (let i = 3; i < 9; i++) mock.__transport.callback(i) // finish the bar + first eighth of the next
    expect(track.playingSequence.value).toBe(next)
    expect(track.currentChordIndex.value).toBe(0)
  })

  it('stop() stops the Transport, removes its tick and silences everything', async () => {
    const track = useBackingTrack(80)
    track.setSequence(amToD)
    await track.start()
    track.stop()
    expect(mock.__transport.clear).toHaveBeenCalledWith(7)
    expect(sampler('drums').releaseAll).toHaveBeenCalled()
    expect(track.isRunning.value).toBe(false)
    expect(track.currentChordIndex.value).toBeNull()
  })

  it('setBpm changes the tempo live, with the usual floor', async () => {
    const track = useBackingTrack(80)
    await track.start()
    track.setBpm(95)
    expect(mock.__transport.bpm.value).toBe(95)
    track.setBpm(3)
    expect(track.bpm.value).toBe(20)
  })
})
