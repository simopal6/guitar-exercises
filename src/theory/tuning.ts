/**
 * A tuning is exactly six open-string MIDI pitches, low to high (index 0 = lowest string).
 * Every fretboard calculation derives from these six numbers — changing tuning
 * never requires touching any other theory function.
 */
export type Tuning = readonly [number, number, number, number, number, number]

export const STANDARD_TUNING: Tuning = [40, 45, 50, 55, 59, 64] // E2 A2 D3 G3 B3 E4
export const DROP_D_TUNING: Tuning = [38, 45, 50, 55, 59, 64] // D2 A2 D3 G3 B3 E4
export const DADGAD_TUNING: Tuning = [38, 45, 50, 55, 57, 62] // D2 A2 D3 G3 A3 D4
