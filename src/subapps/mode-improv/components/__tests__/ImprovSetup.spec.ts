import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ImprovSetup from '../ImprovSetup.vue'

const baseProps = {
  shape: 'e' as const,
  barsPerChord: 2 as const,
  guitarType: 'acoustic' as const,
  bpm: 80,
  isLoading: false,
  loadError: null,
  canStart: true,
}

describe('ImprovSetup', () => {
  it('offers the two major scale shapes, the chosen one pressed', () => {
    const wrapper = mount(ImprovSetup, { props: baseProps })
    const button = (label: string) => wrapper.findAll('button').find((b) => b.text() === label)!
    expect(button('Scala maggiore (3)').attributes('aria-pressed')).toBe('true')
    expect(button('Scala maggiore (10)').attributes('aria-pressed')).toBe('false')
    expect(wrapper.text()).not.toContain('Pentatonica')
  })

  it('emits set-shape when a shape is clicked', async () => {
    const wrapper = mount(ImprovSetup, { props: baseProps })
    await wrapper.findAll('button').find((b) => b.text() === 'Scala maggiore (10)')!.trigger('click')
    expect(wrapper.emitted('set-shape')).toEqual([['a']])
  })
})
