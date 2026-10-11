export interface ScaleOctave {
  lowMidi: number
  highMidi: number
}

/**
 * A "complete octave" is a root→root span (exactly 12 semitones) where
 * every scale degree in between is actually present among the pattern's
 * notes — i.e. the player can go from one root to the next without leaving
 * the box. Derived entirely from the notes already on the fretboard: never
 * hand-written, never assumed from the root fret alone (a pattern can have
 * zero, one, or several of these, depending on how far it extends past its
 * root in each direction).
 */
export function findCompleteOctaves(distinctMidis: number[], rootMidi: number, formula: readonly number[]): ScaleOctave[] {
  const midiSet = new Set(distinctMidis)
  const rootInstances = distinctMidis.filter((midi) => (((midi - rootMidi) % 12) + 12) % 12 === 0)
  const octaves: ScaleOctave[] = []
  for (const low of rootInstances) {
    const high = low + 12
    if (!rootInstances.includes(high)) continue
    if (formula.every((offset) => midiSet.has(low + offset))) {
      octaves.push({ lowMidi: low, highMidi: high })
    }
  }
  return octaves
}

/** "Ottava bassa"/"Ottava alta" for the common 2-octave case, a generic numbered label otherwise. */
export function octaveLabel(index: number, total: number): string {
  if (total === 2) return index === 0 ? 'Ottava bassa' : 'Ottava alta'
  return `Ottava ${index + 1}`
}
