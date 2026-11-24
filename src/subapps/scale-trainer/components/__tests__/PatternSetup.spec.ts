import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PatternSetup from '../PatternSetup.vue'
import { PATTERNS, patternsOfShape } from '../../patterns'

const baseProps = {
  mode: null as 'forma' | 'scala' | null,
  shapeId: null as string | null,
  patternId: null as string | null,
  completeOctaves: [],
  selectedOctaveIndex: 0,
  patternBpmPreview: 80,
  canStart: false,
}

describe('PatternSetup', () => {
  it('emits select-mode when a mode pill is clicked', async () => {
    const wrapper = mount(PatternSetup, { props: baseProps })
    const scalaButton = wrapper.findAll('button').find((b) => b.text() === 'Scala')!
    await scalaButton.trigger('click')
    expect(wrapper.emitted('select-mode')).toEqual([['scala']])
  })

  it('does not show the "Forma" or "Scala" row until a mode has been chosen', () => {
    const wrapper = mount(PatternSetup, { props: baseProps })
    expect(wrapper.text()).not.toContain('Scala maggiore (3)')
    expect(wrapper.text()).not.toContain('Pentatonica')
    expect(wrapper.text()).not.toContain('Ionian')
  })

  describe('"forma" mode', () => {
    it('shows the "Forma" row, with one pill per shape', () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'forma' } })
      expect(wrapper.text()).toContain('Scala maggiore (3)')
      expect(wrapper.text()).toContain('Scala maggiore (10)')
      expect(wrapper.text()).toContain('Pentatonica')
    })

    it('emits select-shape when a shape pill is clicked', async () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'forma' } })
      const shapeButton = wrapper.findAll('button').find((b) => b.text() === 'Pentatonica')!
      await shapeButton.trigger('click')
      const pentatonicShapeId = PATTERNS.find((p) => p.label === 'Pentatonica')!.shapeId
      expect(wrapper.emitted('select-shape')).toEqual([[pentatonicShapeId]])
    })

    it('does not show a "Scala" row at all — forma mode never asks which scale to play', () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'forma' } })
      expect(wrapper.text()).not.toContain('Ionian')
      expect(wrapper.text()).not.toContain('Dorian')
    })
  })

  describe('"scala" mode', () => {
    it('asks for the shape first: the "Forma" row is shown, the "Scala" row is not', () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'scala' } })
      expect(wrapper.text()).toContain('Scala maggiore (3)')
      expect(wrapper.text()).toContain('Scala maggiore (10)')
      expect(wrapper.text()).toContain('Pentatonica')
      expect(wrapper.text()).not.toContain('Ionian')
    })

    it('emits select-shape when a shape pill is clicked', async () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'scala' } })
      await wrapper.findAll('button').find((b) => b.text() === 'Scala maggiore (10)')!.trigger('click')
      expect(wrapper.emitted('select-shape')).toEqual([['major-a-shape']])
    })

    it('offers the 7 modes for a major shape', () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'scala', shapeId: 'major-a-shape' } })
      const labels = wrapper.findAll('button').map((b) => b.text())
      for (const label of ['Ionian (I)', 'Dorian (ii)', 'Phrygian (iii)', 'Lydian (IV)', 'Mixolydian (V)', 'Aeolian (vi)', 'Locrian (vii°)']) {
        expect(labels.filter((l) => l === label)).toHaveLength(1)
      }
      expect(patternsOfShape('major-a-shape')).toHaveLength(7)
      expect(patternsOfShape('major-e-shape')).toHaveLength(7)
    })

    it('offers only major and minor for the pentatonic shape', () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'scala', shapeId: 'major-pentatonic' } })
      expect(wrapper.text()).toContain('Pentatonica maggiore')
      expect(wrapper.text()).toContain('Pentatonica minore')
      expect(wrapper.text()).not.toContain('Ionian')
      expect(patternsOfShape('major-pentatonic').map((p) => p.scaleLabel)).toEqual(['Pentatonica maggiore', 'Pentatonica minore'])
    })

    it('emits select-scale (not select-shape) when a scale pill is clicked', async () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'scala', shapeId: 'major-e-shape' } })
      const dorianButton = wrapper.findAll('button').find((b) => b.text() === 'Dorian (ii)')!
      await dorianButton.trigger('click')
      expect(wrapper.emitted('select-scale')).toEqual([['major-e-shape-dorian']])
      expect(wrapper.emitted('select-shape')).toBeUndefined() // the shape row is still there, just not clicked
    })

    it('highlights the active scale pill by patternId', () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'scala', shapeId: 'major-pentatonic', patternId: 'major-pentatonic' } })
      const pentatonicButton = wrapper.findAll('button').find((b) => b.text() === 'Pentatonica maggiore')!
      expect(pentatonicButton.classes().join(' ')).toContain('bg-indigo-500')
    })
  })

  it('does not show an octave row when there is only one complete octave', () => {
    const wrapper = mount(PatternSetup, {
      props: { ...baseProps, mode: 'scala', completeOctaves: [{ lowMidi: 52, highMidi: 64 }] },
    })
    expect(wrapper.text()).not.toContain('Ottava bassa')
    expect(wrapper.text()).not.toContain('Ottava alta')
  })

  it('shows an octave pill per complete octave, labeled bassa/alta, when there are two', () => {
    const wrapper = mount(PatternSetup, {
      props: {
        ...baseProps,
        mode: 'scala',
        completeOctaves: [
          { lowMidi: 43, highMidi: 55 },
          { lowMidi: 55, highMidi: 67 },
        ],
      },
    })
    expect(wrapper.text()).toContain('Ottava bassa')
    expect(wrapper.text()).toContain('Ottava alta')
  })

  it('emits select-octave with the clicked octave index', async () => {
    const wrapper = mount(PatternSetup, {
      props: {
        ...baseProps,
        mode: 'scala',
        completeOctaves: [
          { lowMidi: 43, highMidi: 55 },
          { lowMidi: 55, highMidi: 67 },
        ],
      },
    })
    const altaButton = wrapper.findAll('button').find((b) => b.text() === 'Ottava alta')!
    await altaButton.trigger('click')
    expect(wrapper.emitted('select-octave')).toEqual([[1]])
  })

  it('does not show an octave row in "forma" mode even if complete octaves exist', () => {
    const wrapper = mount(PatternSetup, {
      props: {
        ...baseProps,
        mode: 'forma',
        completeOctaves: [
          { lowMidi: 43, highMidi: 55 },
          { lowMidi: 55, highMidi: 67 },
        ],
      },
    })
    expect(wrapper.text()).not.toContain('Ottava')
  })

  it('keeps "Inizia" disabled until canStart is true', () => {
    const wrapper = mount(PatternSetup, { props: baseProps })
    const startButton = wrapper.findAll('button').find((b) => b.text() === 'Inizia')!
    expect(startButton.attributes('disabled')).toBeDefined()
  })
})
