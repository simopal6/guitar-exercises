import { STANDARD_TUNING, type PitchClass, type TriadQuality } from '../../../theory'

export type ChordShape = 'E' | 'A'

/** Movable barre shapes, frets above the barre, strings 6→1 (low E first). null = muted string. */
const SHAPES: Record<TriadQuality, Record<ChordShape, readonly (number | null)[]>> = {
  maj: { E: [0, 2, 2, 1, 0, 0], A: [null, 0, 2, 2, 2, 0] },
  min: { E: [0, 2, 2, 0, 0, 0], A: [null, 0, 2, 2, 1, 0] },
  dim: { E: [0, 1, 2, 0, null, null], A: [null, 0, 1, 2, 1, null] },
}

export interface Voicing {
  /** One entry per string, 6→1; null = not played. */
  midi: (number | null)[]
  shape: ChordShape
  /** Barre fret (0 = open position). */
  fret: number
}

const LOW_E = STANDARD_TUNING[0] % 12 // 4
const A_STRING = STANDARD_TUNING[1] % 12 // 9

/**
 * Picks whichever of the E-shape (root on the 6th string) and A-shape (root
 * on the 5th) sits lower on the neck — the E-shape on a tie — so the
 * strumming stays in one comfortable register whatever the chord.
 */
export function voicing(root: PitchClass, quality: TriadQuality): Voicing {
  const eFret = (root - LOW_E + 12) % 12
  const aFret = (root - A_STRING + 12) % 12
  const shape: ChordShape = eFret <= aFret ? 'E' : 'A'
  const fret = shape === 'E' ? eFret : aFret
  return {
    midi: SHAPES[quality][shape].map((offset, i) => (offset === null ? null : STANDARD_TUNING[i] + fret + offset)),
    shape,
    fret,
  }
}
