import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionSetup from '../SessionSetup.vue'

const baseProps = {
  modeId: 'name-semitones',
  difficultyId: 1,
  durationSeconds: 60,
  usesShape: false,
  bestScore: 7,
  intervalPreset: 'standard' as const,
  standardSemitones: [3, 4, 5, 7, 9, 10, 11, 12],
  canStart: true,
}

describe('SessionSetup', () => {
  it('shows the mode and duration pills but hides difficulty when usesShape is false', () => {
    const wrapper = mount(SessionSetup, { props: baseProps })
    expect(wrapper.text()).toContain('Nome ↔ Semitoni')
    expect(wrapper.text()).toContain('1 minuto')
    expect(wrapper.text()).toContain('3 minuti')
    expect(wrapper.text()).not.toContain('Difficoltà')
  })

  it('shows difficulty pills when usesShape is true', () => {
    const wrapper = mount(SessionSetup, { props: { ...baseProps, usesShape: true } })
    expect(wrapper.text()).toContain('Difficoltà')
    expect(wrapper.text()).toContain('Principiante')
  })

  it('always shows the interval selector, regardless of usesShape', () => {
    const wrapper = mount(SessionSetup, { props: baseProps })
    expect(wrapper.text()).toContain('Intervalli')
    expect(wrapper.text()).toContain('Standard')
    expect(wrapper.text()).toContain('Completa')
  })

  it('displays the current best score', () => {
    const wrapper = mount(SessionSetup, { props: baseProps })
    expect(wrapper.text()).toContain('7')
  })

  it('emits set-mode when a mode pill is clicked', async () => {
    const wrapper = mount(SessionSetup, { props: baseProps })
    const modeButton = wrapper.findAll('button').find((b) => b.text() === 'Nome ↔ Forma')
    await modeButton?.trigger('click')
    expect(wrapper.emitted('set-mode')).toEqual([['name-shape']])
  })

  it('emits set-duration when a duration pill is clicked', async () => {
    const wrapper = mount(SessionSetup, { props: baseProps })
    const durationButton = wrapper.findAll('button').find((b) => b.text() === '3 minuti')
    await durationButton?.trigger('click')
    expect(wrapper.emitted('set-duration')).toEqual([[180]])
  })

  it('emits start when the start button is clicked', async () => {
    const wrapper = mount(SessionSetup, { props: baseProps })
    const startButton = wrapper.findAll('button').find((b) => b.text() === 'Inizia')
    await startButton?.trigger('click')
    expect(wrapper.emitted('start')).toHaveLength(1)
  })

  it('disables the start button and shows a warning when canStart is false', async () => {
    const wrapper = mount(SessionSetup, { props: { ...baseProps, canStart: false } })
    const startButton = wrapper.findAll('button').find((b) => b.text() === 'Inizia')
    expect(startButton?.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Seleziona almeno 4 intervalli')
    await startButton?.trigger('click')
    expect(wrapper.emitted('start')).toBeUndefined()
  })

  it('emits set-interval-preset when the Completa pill is clicked', async () => {
    const wrapper = mount(SessionSetup, { props: baseProps })
    const completaButton = wrapper.findAll('button').find((b) => b.text() === 'Completa')
    await completaButton?.trigger('click')
    expect(wrapper.emitted('set-interval-preset')).toEqual([['completa']])
  })
})
