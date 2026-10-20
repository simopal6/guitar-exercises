import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PatternSetup from '../PatternSetup.vue'
import { PATTERNS } from '../../patterns'

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
    expect(wrapper.text()).not.toContain('Scala maggiore (1)')
    expect(wrapper.text()).not.toContain('Pentatonica')
    expect(wrapper.text()).not.toContain('Ionian')
  })

  describe('"forma" mode', () => {
    it('shows the "Forma" row, with one pill per shape', () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'forma' } })
      expect(wrapper.text()).toContain('Scala maggiore (1)')
      expect(wrapper.text()).toContain('Pentatonica')
    })

    it('emits select-shape when a shape pill is clicked', async () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'forma' } })
      const shapeButton = wrapper.findAll('button').find((b) => b.text() === 'Pentatonica')!
      await shapeButton.trigger('click')
      expect(wrapper.emitted('select-shape')).toEqual([[PATTERNS[1].shapeId]])
    })

    it('does not show a "Scala" row at all — forma mode never asks which scale to play', () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'forma' } })
      expect(wrapper.text()).not.toContain('Ionian')
      expect(wrapper.text()).not.toContain('Dorian')
    })
  })

  describe('"scala" mode', () => {
    it('shows the "Scala" row with every scale across every shape, skipping the shape question entirely', () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'scala' } })
      // "Scala maggiore (1)" is a shape label (shown only in "forma" mode), never a scale label
      expect(wrapper.text()).not.toContain('Scala maggiore (1)')
      for (const pattern of PATTERNS) {
        expect(wrapper.text()).toContain(pattern.scaleLabel)
      }
    })

    it('emits select-scale (not select-shape) when a scale pill is clicked', async () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'scala' } })
      const dorianButton = wrapper.findAll('button').find((b) => b.text() === 'Dorian (II)')!
      await dorianButton.trigger('click')
      expect(wrapper.emitted('select-scale')).toEqual([['major-e-shape-dorian']])
      expect(wrapper.emitted('select-shape')).toBeUndefined()
    })

    it('highlights the active scale pill by patternId, regardless of which shape it belongs to', () => {
      const wrapper = mount(PatternSetup, { props: { ...baseProps, mode: 'scala', patternId: 'major-pentatonic' } })
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
