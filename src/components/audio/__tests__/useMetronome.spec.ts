import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('tone', () => {
  const Transport = {
    bpm: { value: 120 },
    start: vi.fn(),
    stop: vi.fn(),
  }
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

import { useMetronome } from '../useMetronome'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useMetronome', () => {
  it('clamps the initial bpm to the technical floor', () => {
    const metronome = useMetronome(5)
    expect(metronome.bpm.value).toBe(20)
  })

  it('accepts a normal initial bpm unchanged', () => {
    const metronome = useMetronome(65)
    expect(metronome.bpm.value).toBe(65)
  })

  it('start()/stop() toggle isRunning', async () => {
    const metronome = useMetronome(60)
    expect(metronome.isRunning.value).toBe(false)
    await metronome.start()
    expect(metronome.isRunning.value).toBe(true)
    metronome.stop()
    expect(metronome.isRunning.value).toBe(false)
  })

  it('setBpm updates the bpm ref live and re-clamps out-of-range values', () => {
    const metronome = useMetronome(60)
    metronome.setBpm(85)
    expect(metronome.bpm.value).toBe(85)
    metronome.setBpm(-100)
    expect(metronome.bpm.value).toBe(20)
  })

  it('calling start() twice does not start the Transport twice (no doubled clicks)', async () => {
    const Tone = await import('tone')
    const metronome = useMetronome(60)
    await metronome.start()
    await metronome.start()
    expect(Tone.Transport.start).toHaveBeenCalledTimes(1)
  })

  it('dispose() stops the transport and cleans up', async () => {
    const Tone = await import('tone')
    const metronome = useMetronome(60)
    await metronome.start()
    metronome.dispose()
    expect(Tone.Transport.stop).toHaveBeenCalled()
    expect(metronome.isRunning.value).toBe(false)
  })

  describe('onBeat', () => {
    it('calls every subscribed listener on each Loop tick, alongside the click sound', async () => {
      const Tone = (await import('tone')) as unknown as { __getLastLoop: () => { callback: (t: number) => void } }
      const metronome = useMetronome(60)
      await metronome.start()
      const listener = vi.fn()
      metronome.onBeat(listener)

      Tone.__getLastLoop().callback(0)
      Tone.__getLastLoop().callback(1)

      expect(listener).toHaveBeenCalledTimes(2)
    })

    it('stops notifying a listener once unsubscribed', async () => {
      const Tone = (await import('tone')) as unknown as { __getLastLoop: () => { callback: (t: number) => void } }
      const metronome = useMetronome(60)
      await metronome.start()
      const listener = vi.fn()
      const unsubscribe = metronome.onBeat(listener)

      Tone.__getLastLoop().callback(0)
      unsubscribe()
      Tone.__getLastLoop().callback(1)

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('supports multiple independent listeners', async () => {
      const Tone = (await import('tone')) as unknown as { __getLastLoop: () => { callback: (t: number) => void } }
      const metronome = useMetronome(60)
      await metronome.start()
      const a = vi.fn()
      const b = vi.fn()
      metronome.onBeat(a)
      metronome.onBeat(b)

      Tone.__getLastLoop().callback(0)

      expect(a).toHaveBeenCalledTimes(1)
      expect(b).toHaveBeenCalledTimes(1)
    })
  })
})
