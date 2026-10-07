/**
 * One fixed rainbow color per scale degree — the single source of truth.
 * Colors repeat per octave ((degree - 1) % 7), so degree 8 reuses degree 1's
 * color automatically. Adjust here only.
 */
export const DEGREE_COLORS: readonly string[] = [
  '#E24B4A', // 1 rosso
  '#EF9F27', // 2 arancio
  '#FFD400', // 3 giallo (più chiaro, per distinguerlo dall'arancio)
  '#4FA32E', // 4 verde
  '#4AA3E0', // 5 azzurro
  '#3730A3', // 6 indaco
  '#9B4FD0', // 7 viola
]

export function colorForDegree(degree: number): string {
  return DEGREE_COLORS[(degree - 1) % 7]
}
