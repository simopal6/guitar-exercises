import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SessionSetup from '../SessionSetup.vue'

const baseProps = {
  modeId: 'name-semitones',
  difficultyId: 1,
  durationSeconds: 60,
  usesShape: false,
  bestScore: 7,
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
})
