import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ShapeFretboard from '../ShapeFretboard.vue'
import Fretboard from '../../../../components/fretboard/Fretboard.vue'
import { STANDARD_TUNING } from '../../../../theory'
import type { GeneratedShape } from '../../../../theory'

function makeShape(rootFret: number, targetFret: number, rootString = 0, targetString = 1): GeneratedShape {
  return {
    rootPosition: { stringIndex: rootString, fret: rootFret },
    targetPosition: { stringIndex: targetString, fret: targetFret },
    semitones: 5,
    intervalName: 'Perfect Fourth',
  }
}

describe('ShapeFretboard', () => {
  it('always shows a fixed 5-fret window (span 3 example), not a variable-width tight crop', () => {
    const wrapper = mount(ShapeFretboard, { props: { shape: makeShape(5, 8) } })
    const fretboard = wrapper.findComponent(Fretboard)
    expect(fretboard.props('fretStart')).toBe(5)
    expect(fretboard.props('fretEnd')).toBe(9)
    expect(fretboard.props('tuning')).toEqual(STANDARD_TUNING)
    expect(fretboard.props('showOpenStringLabels')).toBe(false)
  })

  it('clamps fretStart to 0 instead of going negative when a note is at fret 0', () => {
    const wrapper = mount(ShapeFretboard, { props: { shape: makeShape(0, 3) } })
    const fretboard = wrapper.findComponent(Fretboard)
    expect(fretboard.props('fretStart')).toBe(0)
    expect(fretboard.props('fretEnd')).toBe(4)
  })

  it('centers a zero-span shape (e.g. same fret on the G-B pair) with symmetric padding', () => {
    const wrapper = mount(ShapeFretboard, { props: { shape: makeShape(5, 5, 3, 4) } })
    const fretboard = wrapper.findComponent(Fretboard)
    expect(fretboard.props('fretStart')).toBe(3)
    expect(fretboard.props('fretEnd')).toBe(7)
  })

  it('shows zero padding at the maximum span (4 frets): both markers sit on the window edges', () => {
    const wrapper = mount(ShapeFretboard, { props: { shape: makeShape(5, 9) } })
    const fretboard = wrapper.findComponent(Fretboard)
    expect(fretboard.props('fretStart')).toBe(5)
    expect(fretboard.props('fretEnd')).toBe(9)
  })

  it('the window is always exactly 5 frets wide, for every possible span (0-4)', () => {
    for (let span = 0; span <= 4; span++) {
      for (const rootFret of [0, 1, 5, 12]) {
        const wrapper = mount(ShapeFretboard, { props: { shape: makeShape(rootFret, rootFret + span) } })
        const fretboard = wrapper.findComponent(Fretboard)
        const fretStart = fretboard.props('fretStart') as number
        const fretEnd = fretboard.props('fretEnd') as number
        expect(fretEnd - fretStart).toBe(4)
        expect(fretStart).toBeLessThanOrEqual(rootFret)
        expect(fretEnd).toBeGreaterThanOrEqual(rootFret + span)
      }
    }
  })

  it('highlights root and target with the correct roles', () => {
    const shape = makeShape(5, 8, 0, 1)
    const wrapper = mount(ShapeFretboard, { props: { shape } })
    const fretboard = wrapper.findComponent(Fretboard)
    expect(fretboard.props('highlights')).toEqual([
      { position: shape.rootPosition, role: 'root' },
      { position: shape.targetPosition, role: 'target' },
    ])
  })
})
