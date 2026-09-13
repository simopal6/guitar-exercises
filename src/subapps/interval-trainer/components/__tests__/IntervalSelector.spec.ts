import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import IntervalSelector from '../IntervalSelector.vue'

const STANDARD_SEMITONES = [3, 4, 5, 7, 9, 10, 11, 12]

describe('IntervalSelector', () => {
  it('shows both preset pills and the checklist when standard is active', () => {
    const wrapper = mount(IntervalSelector, {
      props: { intervalPreset: 'standard', standardSemitones: STANDARD_SEMITONES },
    })
    expect(wrapper.text()).toContain('Standard')
    expect(wrapper.text()).toContain('Completa')
    expect(wrapper.text()).toContain('Ripristina default')
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(12)
  })

  it('hides the checklist and reset button when completa is active', () => {
    const wrapper = mount(IntervalSelector, {
      props: { intervalPreset: 'completa', standardSemitones: STANDARD_SEMITONES },
    })
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('Ripristina default')
  })

  it('checks exactly the boxes present in standardSemitones', () => {
    const wrapper = mount(IntervalSelector, {
      props: { intervalPreset: 'standard', standardSemitones: [3, 4] },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    const checkedCount = checkboxes.filter((c) => (c.element as HTMLInputElement).checked).length
    expect(checkedCount).toBe(2)
  })

  it('emits set-interval-preset when a preset pill is clicked', async () => {
    const wrapper = mount(IntervalSelector, {
      props: { intervalPreset: 'standard', standardSemitones: STANDARD_SEMITONES },
    })
    const completaButton = wrapper.findAll('button').find((b) => b.text() === 'Completa')
    await completaButton?.trigger('click')
    expect(wrapper.emitted('set-interval-preset')).toEqual([['completa']])
  })

  it('emits toggle-standard-semitone with the right semitone count when a checkbox changes', async () => {
    const wrapper = mount(IntervalSelector, {
      props: { intervalPreset: 'standard', standardSemitones: STANDARD_SEMITONES },
    })
    const labels = wrapper.findAll('label')
    const tritoneLabel = labels.find((l) => l.text().includes('Tritone'))
    await tritoneLabel?.find('input[type="checkbox"]').trigger('change')
    expect(wrapper.emitted('toggle-standard-semitone')).toEqual([[6]])
  })

  it('emits reset-standard-semitones when the reset button is clicked', async () => {
    const wrapper = mount(IntervalSelector, {
      props: { intervalPreset: 'standard', standardSemitones: STANDARD_SEMITONES },
    })
    const resetButton = wrapper.findAll('button').find((b) => b.text() === 'Ripristina default')
    await resetButton?.trigger('click')
    expect(wrapper.emitted('reset-standard-semitones')).toHaveLength(1)
  })
})
