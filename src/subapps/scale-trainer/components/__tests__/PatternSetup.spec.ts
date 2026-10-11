import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PatternSetup from '../PatternSetup.vue'
import { PATTERNS } from '../../patterns'

const baseProps = {
  patternId: PATTERNS[0].id,
  mode: 'forma' as const,
  completeOctaves: [],
  selectedOctaveIndex: 0,
  patternBpmPreview: 80,
  canStart: true,
}

describe('PatternSetup', () => {
  it('emits select-mode when a mode pill is clicked', async () => {
    const wrapper = mount(PatternSetup, { props: { ...baseProps, completeOctaves: [{ lowMidi: 43, highMidi: 55 }] } })
    const scalaButton = wrapper.findAll('button').find((b) => b.text() === 'Scala')!
    await scalaButton.trigger('click')
    expect(wrapper.emitted('select-mode')).toEqual([['scala']])
  })

  it('disables the "Scala" pill when the pattern has no complete octave', () => {
    const wrapper = mount(PatternSetup, { props: { ...baseProps, completeOctaves: [] } })
    const scalaButton = wrapper.findAll('button').find((b) => b.text() === 'Scala')!
    expect(scalaButton.attributes('disabled')).toBeDefined()
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
})
