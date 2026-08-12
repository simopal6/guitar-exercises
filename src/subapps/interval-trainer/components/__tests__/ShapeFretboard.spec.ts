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
  it('computes a tight fret window around the shape, with one fret of padding', () => {
    const wrapper = mount(ShapeFretboard, { props: { shape: makeShape(5, 8) } })
    const fretboard = wrapper.findComponent(Fretboard)
    expect(fretboard.props('fretStart')).toBe(4)
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
