import { describe, expect, it } from 'vitest'
import { DADGAD_TUNING, DROP_D_TUNING, STANDARD_TUNING } from '../tuning'

describe('tuning', () => {
  it('defines standard tuning as E2 A2 D3 G3 B3 E4', () => {
    expect(STANDARD_TUNING).toEqual([40, 45, 50, 55, 59, 64])
  })

  it('defines drop D by only lowering the low string a whole step', () => {
    expect(DROP_D_TUNING).toEqual([38, 45, 50, 55, 59, 64])
    expect(DROP_D_TUNING.slice(1)).toEqual(STANDARD_TUNING.slice(1))
  })

  it('defines DADGAD', () => {
    expect(DADGAD_TUNING).toEqual([38, 45, 50, 55, 57, 62])
  })
})
