import { readonly, ref, shallowRef, type Ref } from 'vue'
import type { PitchClass, TriadQuality } from '../../../theory'
import { clampBpm } from '../useMetronome'
import { voicing, type Voicing } from './voicings'
import { bassNote, drumHits, strumAt, STEPS_PER_BAR } from './patterns'

export type GuitarType = 'acoustic' | 'electric'

export interface BackingChord {
  root: PitchClass
  quality: TriadQuality
}

/** What the band loops: the chords in order, each held for the same number of bars. */
export interface BackingSequence {
  chords: BackingChord[]
  barsPerChord: number
}

export interface BackingTrack {
  /** True while the samples needed to start (drums, bass, current guitar) are still downloading. */
  isLoading: Readonly<Ref<boolean>>
  loadError: Readonly<Ref<string | null>>
  isRunning: Readonly<Ref<boolean>>
  bpm: Readonly<Ref<number>>
  guitarType: Readonly<Ref<GuitarType>>
  /** The sequence actually being heard — switches at a bar line, in sync with the audio, not when setSequence() is called. */
  playingSequence: Readonly<Ref<BackingSequence | null>>
  /** Index (in playingSequence.chords) of the chord being heard, null when stopped. */
  currentChordIndex: Readonly<Ref<number | null>>
  /** 0-based bar within the current chord. */
  barInChord: Readonly<Ref<number>>
  /** Starts downloading the samples; safe to call before any user gesture (audio only starts in start()). */
  load(): Promise<void>
  /** The second guitar's samples are only downloaded the first time it's chosen. */
  setGuitarType(type: GuitarType): Promise<void>
  /** Before start(): used from the first beat. While running: takes over at the next bar line. */
  setSequence(sequence: BackingSequence): void
  /** Must be called from a user-gesture handler (Tone.start() requirement). */
  start(): Promise<void>
  stop(): void
  setBpm(bpm: number): void
  dispose(): void
}

const SAMPLES_URL = `${import.meta.env.BASE_URL}samples/`

// Sample file names use "s" for sharp ("As1" = A#1), since "#" can't sit in a URL path unescaped.
const urlMap = (files: string[]) => Object.fromEntries(files.map((f) => [f.replace('s', '#'), `${f}.mp3`]))

const GUITARS: Record<GuitarType, { files: string[]; dir: string; volumeDb: number }> = {
  acoustic: {
    files: ['E2', 'G2', 'As2', 'Cs3', 'E3', 'G3', 'As3', 'Cs4', 'E4', 'G4', 'As4', 'Cs5'],
    dir: 'gtr-acoustic/',
    volumeDb: -4,
  },
  electric: {
    files: ['Cs2', 'E2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6'],
    dir: 'gtr-electric/',
    volumeDb: -7,
  },
}

const DRUM_NOTES = { kick: 'C1', snare: 'D1', hihat: 'F#1' } as const

/**
 * A small rock band (drums, bass, strummed guitar) looping a chord sequence
 * on Tone.Transport, ported from the "sala prove" prototype. Independent of
 * any sub-app: give it chords, it plays them.
 *
 * Tone.Transport is shared with useMetronome: don't run both at once.
 */
export function useBackingTrack(initialBpm: number): BackingTrack {
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)
  const isRunning = ref(false)
  const bpm = ref(clampBpm(initialBpm))
  const guitarType = ref<GuitarType>('acoustic')
  const playingSequence = shallowRef<BackingSequence | null>(null)
  const currentChordIndex = ref<number | null>(null)
  const barInChord = ref(0)

  let Tone: typeof import('tone') | null = null
  let nodes: import('tone').ToneAudioNode[] = []
  let drums: import('tone').Sampler | null = null
  let bass: import('tone').Sampler | null = null
  let guitarBus: import('tone').Volume | null = null
  const guitars: Partial<Record<GuitarType, { sampler: import('tone').Sampler; ready: Promise<void> }>> = {}
  let requestedGuitar: GuitarType = 'acoustic'
  let loadPromise: Promise<void> | null = null

  let repeatId: number | null = null
  let step = 0
  let active: BackingSequence | null = null
  let pending: BackingSequence | null = null
  let barsIntoSequence = 0
  let currentVoicing: Voicing | null = null
  let ringingNotes: string[] = []

  async function ensureTone(): Promise<typeof import('tone')> {
    if (!Tone) Tone = await import('tone')
    return Tone
  }

  function samplerReady(T: typeof import('tone'), options: ConstructorParameters<typeof T.Sampler>[0] & object) {
    let sampler!: import('tone').Sampler
    const ready = new Promise<void>((resolve, reject) => {
      sampler = new T.Sampler({ ...options, onload: () => resolve(), onerror: (e: Error) => reject(e) })
    })
    return { sampler, ready }
  }

  function loadGuitar(type: GuitarType): Promise<void> {
    const existing = guitars[type]
    if (existing) return existing.ready
    const T = Tone!
    const g = GUITARS[type]
    const { sampler, ready } = samplerReady(T, { urls: urlMap(g.files), baseUrl: SAMPLES_URL + g.dir, release: 0.12 })
    sampler.connect(guitarBus!)
    sampler.volume.value = g.volumeDb
    guitars[type] = { sampler, ready }
    nodes.push(sampler)
    return ready
  }

  function load(): Promise<void> {
    if (loadPromise) return loadPromise
    isLoading.value = true
    loadError.value = null
    loadPromise = (async () => {
      const T = await ensureTone()
      const limiter = new T.Limiter(-2).toDestination()
      const room = new T.Freeverb({ roomSize: 0.5, dampening: 3500, wet: 0.12 }).connect(limiter)
      guitarBus = new T.Volume(0).connect(room)
      nodes.push(limiter, room, guitarBus)

      // TODO(licenza): the drum samples ("acoustic-kit" from Tonejs/audio)
      // have no declared license — replace them with a clearly licensed kit.
      // See public/samples/CREDITI.md.
      const d = samplerReady(T, {
        urls: { C1: 'kick.mp3', D1: 'snare.mp3', 'F#1': 'hihat.mp3' },
        baseUrl: `${SAMPLES_URL}drums/`,
        release: 1,
      })
      drums = d.sampler.connect(limiter)
      const b = samplerReady(T, {
        urls: urlMap(['E1', 'G1', 'As1', 'Cs2', 'E2', 'G2', 'As2', 'Cs3']),
        baseUrl: `${SAMPLES_URL}bass/`,
        release: 0.08,
      })
      bass = b.sampler.connect(limiter)
      bass.volume.value = -2
      nodes.push(drums, bass)

      await Promise.all([d.ready, b.ready, loadGuitar(guitarType.value)])
    })()
      .catch(() => {
        loadError.value = 'Non riesco a caricare i suoni: controlla la connessione e ricarica la pagina.'
        loadPromise = null // let a later call retry
      })
      .finally(() => {
        isLoading.value = false
      })
    return loadPromise
  }

  async function setGuitarType(type: GuitarType): Promise<void> {
    requestedGuitar = type
    await load()
    try {
      await loadGuitar(type)
    } catch {
      loadError.value = 'Non riesco a caricare i suoni di questa chitarra.'
      return
    }
    // Picking back and forth quickly: only the latest choice wins, whichever load finishes last
    if (requestedGuitar !== type || guitarType.value === type) return
    guitars[guitarType.value]?.sampler.releaseAll()
    ringingNotes = []
    guitarType.value = type
  }

  function setSequence(sequence: BackingSequence): void {
    if (isRunning.value) {
      pending = sequence
    } else {
      active = sequence
      pending = null
    }
  }

  function noteName(midi: number): string {
    return Tone!.Frequency(midi, 'midi').toNote()
  }

  function strum(direction: 'down' | 'up', time: number): void {
    const guitar = guitars[guitarType.value]?.sampler
    if (!guitar || !currentVoicing) return
    const sounding = currentVoicing.midi.filter((m): m is number => m !== null).map(noteName)
    const jitter = () => (Math.random() - 0.5) * 0.004
    if (direction === 'down') {
      if (ringingNotes.length) guitar.triggerRelease(ringingNotes, time)
      sounding.forEach((n, k) => guitar.triggerAttack(n, time + k * 0.014 + jitter(), 0.75 + Math.random() * 0.15 - k * 0.02))
      ringingNotes = sounding
    } else {
      const top = sounding.slice(-4).reverse()
      guitar.triggerRelease(top, time)
      top.forEach((n, k) => guitar.triggerAttack(n, time + k * 0.011 + jitter(), 0.5 + Math.random() * 0.1))
    }
  }

  function tick(time: number): void {
    const s = step % STEPS_PER_BAR
    if (s === 0) {
      if (pending) {
        active = pending
        pending = null
        barsIntoSequence = 0
      }
    }
    const sequence = active
    if (!sequence || sequence.chords.length === 0) {
      step++
      return
    }
    const chordIndex = Math.floor(barsIntoSequence / sequence.barsPerChord) % sequence.chords.length
    const chord = sequence.chords[chordIndex]
    if (s === 0) {
      currentVoicing = voicing(chord.root, chord.quality)
      const bar = barsIntoSequence % sequence.barsPerChord
      // Draw runs the UI update when this bar is actually heard, not now (up to lookAhead earlier)
      Tone!.getDraw().schedule(() => {
        playingSequence.value = sequence
        currentChordIndex.value = chordIndex
        barInChord.value = bar
      }, time)
    }

    for (const hit of drumHits(s)) drums?.triggerAttack(DRUM_NOTES[hit.drum], time, hit.velocity)
    const b = bassNote(s, chord.root, chord.quality)
    bass?.triggerAttackRelease(noteName(b.midi), Tone!.Time('8n').toSeconds() * 0.9, time, b.velocity)
    const direction = strumAt(s)
    if (direction) strum(direction, time)

    step++
    if (step % STEPS_PER_BAR === 0) barsIntoSequence++
  }

  async function start(): Promise<void> {
    const T = await ensureTone()
    await T.start() // first await: keeps the resume inside the iOS gesture window
    if (isRunning.value) return
    await load()
    if (loadError.value) return
    const transport = T.getTransport()
    transport.bpm.value = bpm.value
    step = 0
    barsIntoSequence = 0
    ringingNotes = []
    if (pending) {
      active = pending
      pending = null
    }
    if (repeatId === null) repeatId = transport.scheduleRepeat(tick, '8n')
    transport.position = 0
    transport.start('+0.1')
    isRunning.value = true
  }

  function stop(): void {
    if (Tone) {
      const transport = Tone.getTransport()
      transport.stop()
      if (repeatId !== null) transport.clear(repeatId)
    }
    repeatId = null
    drums?.releaseAll()
    bass?.releaseAll()
    for (const g of Object.values(guitars)) g?.sampler.releaseAll()
    ringingNotes = []
    isRunning.value = false
    currentChordIndex.value = null
    playingSequence.value = null
  }

  function setBpm(next: number): void {
    bpm.value = clampBpm(next)
    if (Tone) Tone.getTransport().bpm.value = bpm.value
  }

  function dispose(): void {
    stop()
    for (const node of nodes) node.dispose()
    nodes = []
    drums = null
    bass = null
    guitarBus = null
    for (const key of Object.keys(guitars) as GuitarType[]) delete guitars[key]
    loadPromise = null
    active = null
    pending = null
  }

  return {
    isLoading: readonly(isLoading),
    loadError: readonly(loadError),
    isRunning: readonly(isRunning),
    bpm: readonly(bpm),
    guitarType: readonly(guitarType),
    playingSequence,
    currentChordIndex: readonly(currentChordIndex),
    barInChord: readonly(barInChord),
    load,
    setGuitarType,
    setSequence,
    start,
    stop,
    setBpm,
    dispose,
  }
}
